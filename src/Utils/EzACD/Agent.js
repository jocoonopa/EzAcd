import ResponseAdapter from './Response/Adapter'
import ResponseHandler from './Response/Handler'
import OpDescList from './OpDescList'
import CallActionDescList from './CallActionDescList'
import { client, w3cwebsocket }  from 'websocket'
import _ from 'lodash'
import OPS from './OPs'
import CallAction from './CallAction'
import MergeCallAction from './MergeCallAction'
import prettyjson from 'prettyjson'
import md5 from 'md5'
import colors from 'colors'

export default class Agent
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
    * @param  {Boolean} options.ssl      [ssl]
    * @param  {Object} bus              [Vue instance]
    * @param  {Boolean} isDebug         [是否啟用除錯]
    * @param  {Object} mockConnection     [方便測試用，初始化時不建立 socket]
    * @return {Void}
    */
    constructor({ port, domain, id, ext, password, centerId, ssl }, bus = null, isDebug = false, mockConnection = null) {
        this.port = port
        this.domain = domain
        this.id = id
        this.password = password
        this.centerId = centerId
        this.ext = ext
        this.cid = null
        this.protocol = ssl ? 'wss' : 'ws'
        this.isDebug = isDebug

        this.initSocket(mockConnection)

        /* init by self */
        this.seq = 0
        this.state = null
        this.callState = null

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

    initBrowserSocket() {
        this.connection = new w3cwebsocket(this.url, 'cti-agent-protocol')

        this.connection.onerror = error => {
            this.emit(Agent.events.SOCKET_ERROR, {
                message: `Connection Error: ${error.toString()}`,
            })
        }

        this.connection.onopen = () => this.authorize()

        this.connection.onclose = () => {
            this.emit(Agent.events.SOCKET_CLOSED, {
                message: 'echo-protocol Client Closed',
            })
        }

        this.connection.onmessage = message => this.handler.receive(message)
    }

    initNodeSocket() {
        this.socket = new client()

        if (this.isDebug) {
            console.log(`\n${this.url}\n\n`.yellow)
        }

        this.socket.connect(this.url, 'cti-agent-protocol')

        this.socket.on('connect', connection => {
            this.connection = connection

            connection.on('message', message => {
                this.handler.receive(message)
            })

            connection.on('error', error => {
                if (this.isDebug) {
                    console.log(`Connection Error: ${error.toString()}`.red)
                }

                this.emit(Agent.events.SOCKET_ERROR, {
                    message: `Connection Error: ${error.toString()}`
                })
            })

            connection.on('close', () => {
                if (this.isDebug) {
                    console.log(`echo-protocol Client Closed`.cyan)
                }

                this.emit(Agent.events.SOCKET_CLOSED, {
                    message: 'echo-protocol Client Closed',
                })
            })

            this.authorize()
        })
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
    makeCall(dn, seq) {
        return this.dispatch({
            op: OPS.MAKE_CALL,
            seq,
            tel: dn,
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
     * @return {Void}
     */
    make2ndCall(tel, cid) {
        return this.dispatch({
            op: OPS.MAKE_2ND_CALL,
            tel,
            cid,
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
     * @param  {Number} type
     * @return {Void}
     */
    getAgentGroupList(agroup, type) {
        return this.dispatch({
            op: OPS.GET_AGENT_GROUP_LIST,
            agroup,
            type,
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
    mergeCallAction(act, cid) {
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
            op: OPS.GET_DN_PERFORMANCE,
            type,
            fmt,
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
            op: OPS.GET_AGENT_GROUP_PERFORMANCE_RESPONSE,
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

    /**
     * 向 socket 發送訊息
     *
     * @param  {Object} obj
     * @return {Mixed}
     */
    dispatch(obj) {
        this.seq ++

        if (_.isNil(obj.seq)) {
            obj.seq = this.seq
        }

        if (this.isDebug) {
            let opDesc = _.find(OpDescList, { code: obj.op })
            let tail = ''

            if (!_.isNil(obj.act)) {
                let callActionDesc = _.find(CallActionDescList, { code: Number(obj.act) })

                tail = callActionDesc ? `: ${callActionDesc.desc}` : ` Unknown`
            }

            opDesc ?
                console.log(`\n${opDesc.desc}${tail} >>>>>>>>>>>>>>`.yellow) :
                console.log(`\nUnknown: (${obj.op})${tail} >>>>>>>>>>>>>>`.red)

            console.log(prettyjson.render(obj))
        }

        return this.connection.send(Agent.genSendStr(obj))
    }

    emit(eventName, withData) {
        if (this.bus) {
            this.bus.$emit(eventName, withData)
        }
    }

    /**
     * 組成發送到 socket 的字串
     *
     * @param  {Object} obj
     * @return {String}
     */
    static genSendStr(obj) {
        let msg = ''

        for (let prop in obj) {
            msg += `${prop}=${_.get(obj, prop)}\n`
        }

        return msg
    }

    static get events() {
        return {
            SOCKET_ERROR: 'socket-error',
            SOCKET_CLOSED: 'socket-closed',
        }
    }

    get url() {
        return `${this.protocol}://${this.domain}:${this.port}`
    }

    get ag() {
        return `${this.id}@${this.centerId}`
    }

    get auth() {
        return md5(`${this.ag}${this.nonce}${this.password}`)
    }
}