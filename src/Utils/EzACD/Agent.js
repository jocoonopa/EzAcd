import Bridge from '../BridgeService'
import ResponseAdapter from './Response/Adapter'
import ResponseHandler from './Response/Handler'
import OpDescList from './OpDescList'
import CallActionDescList from './CallActionDescList'
import { client, w3cwebsocket }  from 'websocket'
import _ from 'lodash'
import OPS from './OPs'
import CallAction from './CallAction'
import MergeCallAction from './MergeCallAction'
import md5 from 'md5'
import colors from 'colors'

export default class Agent extends Bridge
{
    /*
    |--------------------------------------------------------------------------
    |                             Flow (以方法為開發導向)
    |--------------------------------------------------------------------------
    | 1. Connected to ACD Server, should get "nonce"
    | 2. Agent login to ACD server
    | 3. 建立 ResponseHandler，負責接收 Event 時的處理
    |--------------------------------------------------------------------------
    */
    /**
    * 初始化 Agent
    *
    * @param  {Number} options.port     [Server port]
    * @param  {String} options.domain   [Server domain]
    * @param  {String} options.id       [Agent Id]
    * @param  {Number} options.ext      [分機]
    * @param  {String} options.password [密碼]
    * @param  {String} options.centerId [Center Id]
    * @param  {String} options.subProtocol [websocket subProtocol]
    * @param  {Boolean} options.ssl      [ssl]
    * @param  {Object} bus              [Vue instance]
    * @param  {Boolean} isDebug         [是否啟用除錯]
    * @param  {Object} mockConnection     [方便測試用，初始化時不建立 socket]
    * @return {Void}
    */
    constructor({ port, domain, id, ext, password, centerId, ssl, subProtocol }, bus = null, isDebug = false, mockConnection = null) {
        super()

        this.port = port
        this.domain = domain
        this.id = id
        this.password = password
        this.centerId = centerId
        this.ext = ext
        this.cid = null
        this.protocol = ssl ? 'wss' : 'ws'
        this.isDebug = isDebug
        this.subProtocol = subProtocol

        this.commandList = OpDescList

        this.initSocket(mockConnection)

        /* init by self */
        this.seq = 0
        this.state = null
        this.callState = null
        this.hasClosed = false
        this.bus = bus

        this.handler = new ResponseHandler(this, bus, isDebug)
    }

    /**
     * 建立 websocket
     *
     * @param  {Object} mockConnection
     * @return {Void}
     */
    initSocket(mockConnection = null) {
        if (this.connection) {
            return
        }

        if (mockConnection) {
            return this.initTestSocket(mockConnection)
        }

        return 'undefined' !== typeof window ? this.initBrowserSocket() : this.initNodeSocket()
    }

    initTestSocket(mockConnection) {
        this.connection = mockConnection

        this.connection.on('message', message => this.handler.receive(message))
    }

    initNodeSocket() {
        this.socket = new client()

        if (this.isDebug) {
            console.log(`\n${this.url}\n\n`.yellow)
        }

        this.socket.connect(this.url, this.subProtocol)

        this.socket.on('connect', connection => {
            this.connection = connection

            connection.on('message', message => {
                this.handler.receive(message)
            })

            connection.on('error', error => {
                if (this.isDebug) {
                    console.log(`Connection Error: ${error.toString()}`.red)
                }

                this.emit(Bridge.events.SOCKET_ERROR, {
                    message: `Connection Error: ${error.toString()}`
                })
            })

            connection.on('close', () => {
                this.hasClosed = true

                if (this.isDebug) {
                    console.log(`echo-protocol Client Closed`.cyan)
                }

                this.emit(Bridge.events.SOCKET_CLOSED, {
                    message: 'echo-protocol Client Closed',
                })
            })

            this.authorize()
        })
    }

    onError(error) {
        this.connection.close()

        this.emit(Bridge.events.ACD_SOCKET_ERROR, {
            message: `Acd connection error: ${error.toString()}`,
        })
    }

    onClose() {
        this.hasClosed = true

        this.emit(Bridge.events.ACD_SOCKET_CLOSED, {
            message: 'Acd client closed',
        })
    }

    onOpen() {
        this.authorize()
    }

    onMessage(message) {
        this.handler.receive(message)
    }

    /**
     * This command start the AP level communication to ACD server after you successfully connect to webosocket server.
     * The server will return an nonce value for authentication.
     *
     * @param  {Number} seq  [Unique command sequence]
     * @return {Void}
     */
    authorize(seq) {
        return this.dispatch({
            op: OPS.CONNECT_TO_ACD,
            seq,
            ag: this.ag,
        })
    }

    /**
     * After receive 4001 form server,
     * agent desktop use the receive nonce and password for the agent to calculate the auth header.
     * And send this command to start the login procedure.
     *
     * @param  {Number} seq  [Unique command sequence]
     * @return {Void}
     */
    login(seq) {
        return this.dispatch({
            op: OPS.AGENT_LOGIN,
            seq,
            ag: this.ag,
            auth: this.auth,
            agext: this.ext,
        })
    }

    /**
     * Logout agent from ACD server
     *
     * @param  {Number} seq  [Unique command sequence]
     * @return {Void}
     */
    logout(seq) {
        return this.dispatch({
            op: OPS.AGENT_LOGOUT,
            seq,
        })
    }

    /**
     * This command can be used to retrieve the current agent state,
     * supported DN and enabled skill
     *
     * @param  {Number} seq  [Unique command sequence]
     * @return {Void}
     */
    getState(seq) {
        return this.dispatch({
            op: OPS.GET_CURRENT_AGENT_STATE,
            seq,
        })
    }

    /**
     * This command is used to change agent state.
     *
     * @param {Number} options.state [
     *     0 Login
     *     1 Logout
     *     2 Not Ready
     *     3 Ready
     *     4 Busy(unchangeable from agent)
     *     5 ACW (unchangeable from agent)
     *     6 Answer Abandoned (unchangeable from agent)
     *     7 Un-exclusive Busy (unchangeable from agent)
     *     8 Assigned (unchangeable from agent)
     * ]
     * @param {Number} seq   [Unique command sequence]
     * @return {Void}
     */
    setState(state, seq) {
        return this.dispatch({
            op: OPS.SET_CURRNET_AGENT_STATE,
            seq,
            state,
        })
    }

    /**
     * 取得話機狀態
     *
     * @param  {Number} seq [Unique command sequence]
     * @return {Void}
     */
    getDnState(seq) {
        return this.dispatch({
            op: OPS.GET_DN_STATE,
            seq,
        })
    }

    /**
     * Query ACD Queued
     *
     * @param  {Number} seq   [Unique command sequence]
     * @param  {Number} dn [ACD DN to be queried]
     * @return {Void}
     */
    queryAcdQueued(dn, seq) {
        return this.dispatch({
            op: OPS.QUERY_ACD_QUEUED,
            seq,
            dn,
        })
    }

    /**
     * Make call
     *
     * @param  {Number} options.dn   [Dial Number]
     * @param  {Number} seq  [Unique command sequence]
     * @return {Void}
     */
    makeCall(dn, seq, ani, cdata) {
        return this.dispatch({
            op: OPS.MAKE_CALL,
            seq,
            tel: dn,
            ani,
            cdata,
        })
    }

    /**
     * This command is used to send DTMF to remote party.
     *
     * @param  {Number} dtmf  [digit to be dialed, 1 digit can be send for each command]
     * @param  {Number} seq   [Unique command sequence]
     * @return {Void}
     */
    dialDtmf(dtmf, seq) {
        return this.dispatch({
            op: OPS.DIAL_DTMF,
            seq,
            dtmf,
        })
    }

    answer() {
        return this.callAction(CallAction.ANSWER)
    }

    disconnect() {
        return this.callAction(CallAction.DISCONNECT)
    }

    hold() {
        return this.callAction(CallAction.HOLD)
    }

    mute() {
        return this.callAction(CallAction.MUTE)
    }

    cancel() {
        return this.callAction(CallAction.CANCEL)
    }

    /**
     * This command is used to manage the call.
     *
     * @param  {Number} options.act [
     *     0: answer the call
     *     1: set the call to hold
     *     2: disconnect the call (after call is conencted)
     *     3: mute the call
     *     4: cancel the call (call is on the way and not connected yet)
     *     5: Start recording when agent is set to recording on demand.
     *     6: Stop recording when agent is set to recording on demand.
     *  ]
     * @param  {Number} seq  [Unique command sequence]
     *
     * @return {Void}
     */
    callAction(act, seq) {
        return this.dispatch({
            op: OPS.CALL_ACTION,
            seq,
            act,
            cid: this.cid, // [cid 可以從 4030 (Make Call Response)取得]
        })
    }

    /**
     * This command is used when first call is connected
     * and agent would like to make 2nd call for transfer,
     * coach or conference etc.
     *
     * @param  {String}  tel  [dialed telephone number]
     * @param  {String}  cid  [call id]
     * @param  {String}  cdata  [CTI data for this call, this CTI data will overwrite the
existing one)]
     * @return {Void}
     */
    make2ndCall(tel, cid, cdata) {
        return this.dispatch({
            op: OPS.MAKE_2ND_CALL,
            tel,
            cid,
            cdata,
        })
    }

    /**
     * Get Agent Group List (3021)
     *
     * This command is used to get real time agent state from ACD server.
     * There are different type of information could be returned depending
     * on request type.
     *
     * @param  {String} agroup
     * @param  {Number} type [0 ~ 6 p23]
     * @param  {Number} olonly
     *
     * Show on line user only (for type 4-7):
     *     0: All Agents
     *     1: On-Line Agent Only. the default is 0
     *
     * It is recommend to check on-line useronly
     *
     * @return {Void}
     */
    getAgentGroupList(agroup, type, olonly = 0) {
        return this.dispatch({
            op: OPS.GET_AGENT_GROUP_LIST,
            agroup,
            type,
            olonly,
        })
    }

    /**
     * 轉接
     *
     * Disconnect agent's call leg and transfer it to 2nd call
     *
     * @param  {String} cid [call id]
     * @return {Void}
     */
    transfer(cid) {
        return this.mergeCallAction(MergeCallAction.TRANSFER, cid)
    }

    /**
     * Conference
     *
     * Make 1st and 2nd call into conference.
     * This command is not available for lite ACD version.
     *
     * @param  {String} cid [call id]
     * @return {Void}
     */
    conference(cid) {
        return this.mergeCallAction(MergeCallAction.CONFERENCE, cid)
    }

    /**
     * Disconnect 2nd call and back to talk to customer (1st call)
     *
     * @param  {String} cid [call id]
     * @return {Void}
     */
    disconnectMergeCall(cid) {
        return this.mergeCallAction(MergeCallAction.DISCONNECT, cid)
    }

    /**
     * This command is used to merge second call into first call.
     * The action indicate the merge behavior to be done.
     *
     * @param  {Number} act [act code]
     * @param  {String} cid [call id]
     * @return {Void}
     */
    mergeCallAction(act, cid, cdata) {
        return this.dispatch({
            op: OPS.MERGE_CALL_ACTION,
            act,
            cid,
        })
    }

    /**
     * Get DN Performance (3050)
     *
     * This command is used to query the the ACD-DN
     * real time performance from server.
     *
     * only hourly performance (type=1) can have those real time information:
     * f_queued, f_longest_waiting,f_alarm
     *
     * @param  {String} dn   [Queried ACD DN Number]
     * @param  {Number} type [0:quarterly, 1:hourly, 2:daily]
     * @param  {Number} fmt  [
     *     0: (default, backward compatible full format)
     *     1: wallboard format 1
     *     2: wallboard format 2
     * ]
     * @return {Void}
     */
    getDnPerformance(dn, type = 1, fmt = 0) {
        return this.dispatch({
            dn,
            op: OPS.GET_DN_PERFORMANCE,
            type,
            fmt,
        })
    }

    /**
     * Supervisor Coach (3040)
     *
     * This command is for supervisor only.
     * It will start the coach with the selected agent.
     * This command is normally used after [Supervisor Monitor Request].
     *
     * @param  {String} agext
     * @return {Void}
     */
    supervisorCoach(agext) {
        return this.dispatch({
            op: OPS.SUPERVISOR_COACH,
            agext,
        })
    }

    /**
     * Supervisor Monitor (3041)
     *
     * This command is for supervisor only.
     * It will start the monitor to the selected agent.
     *
     * @param  {String} agext
     * @return {Void}
     */
    supervisorMonitor(agext) {
        return this.dispatch({
            op: OPS.SUPERVISOR_MONITOR,
            agext,
        })
    }

    /**
     * Supervisor Conference (3042)
     *
     * This command is for supervisor only.
     * It will start the conference with the selected agent and customer.
     * This command is normally used after [Supervisor Monitor Request]
     * or [Supervisor Coach Request].
     *
     * @param  {String} agext
     * @return {Void}
     */
    supervisorConference(agext) {
        return this.dispatch({
            op: OPS.SUPERVISOR_CONFERENCE,
            agext,
        })
    }

    /**
     * Supervisor Transfer (3043)
     *
     * This command is for supervisor only.
     * It will start the conference with the selected agent and customer.
     * This command is normally used after Supervisor Monitor Request,
     * Supervisor Coach Request or Supervisor Conference Request.
     *
     * After his command, the selected agent will be disconnect from the call
     * and the customer will talk to customer directly.
     *
     * @param  {String} agext
     * @return {Void}
     */
    supervisorTransfer(agext) {
        return this.dispatch({
            op: OPS.SUPERVISOR_TRANSFER,
            agext,
        })
    }

    /**
     * Supervisor Talk to Agent (3044)
     *
     * This command is for supervisor only and it is normally used after
     * [Supervisor Monitor Request] or [Supervisor Coach Request].
     *
     * After this command, the customer will be hold (hearing music)
     * and agent will able to talk to supervisor privately.
     *
     * @param  {String} agext
     * @return {Void}
     */
    supervisorTalkToAgent(agext) {
        return this.dispatch({
            op: OPS.SUPERVISOR_TALK_TO_AGENT,
            agext,
        })
    }

    /**
     * Get Agent Group Performance(3051)
     *
     * This command is used to query the the Agent Group real time
     * performance from server
     *
     * @param  {Number} agroup  [Agent Group ID to be Queried]
     * @param  {Number} type [0:quarterly, 1:hourly, 2:daily]
     * @param  {Number} fmt  [
     *     0: (default, backward compatible full format)
     *     1: wallboard format 1
     *     2: wallboard format 2
     * ]
     * @return {Void}
     */
    getAgentGroupPerformance(agroup, type = 1, fmt = 0) {
        return this.dispatch({
            op: OPS.GET_AGENT_GROUP_PERFORMANCE,
            agroup,
            type,
            fmt,
        })
    }

    /**
     * Get Agent Performance (3052)
     *
     * This command is used to query the the Agent real time performance from server.
     *
     * @param  {String} ag   [
     *   Optional, if supervisor would like to query
     *   other agent's performance
     * ]
     * @param  {Number} type [0:quarterly, 1:hourly, 2:daily]
     * @return {Void}
     */
    getAgentPerformance(ag = null, type) {
        return this.dispatch({
            op: OPS.GET_AGENT_PERFORMANCE,
            ag: ag ? ag : this.id,
            type,
        })
    }

    get ag() {
        return `${this.id}@${this.centerId}`
    }

    get auth() {
        return md5(`${this.ag}${this.nonce}${this.password}`)
    }
}