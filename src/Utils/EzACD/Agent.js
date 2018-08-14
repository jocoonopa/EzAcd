import ResponseAdapter from './Response/Adapter'
import ResponseHandler from './Response/Handler'
import { client }  from 'websocket'
import _ from 'lodash'
import OPS from './OPs'
import CallAction from './CallAction'

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
    * @param  {Object} bus              [Vue instance]
    * @return {Void}
    */
    constructor({ port, domain, id, ext, password, centerId }, bus) {
        this.port = port
        this.domain = domain
        this.id = id
        this.password = password
        this.centerId = centerId
        this.ext = ext
        this.state = null
        this.cid = null

        this.initSocket()

        /* init by self */
        this.seq = 0
        this.handler = new ResponseHandler(this, bus)
    }

    /**
     * 建立 websocket
     *
     * @return {Void}
     */
    initSocket() {
        this.socket = new client()

        this.socket.connect(this.url, 'cti-agent-protocol')

        this.socket.on('connect', connection => {

            this.connection = connection

            connection.on('message', message => {
                this.handler.receive(message)
            })

            connection.on('error', error => {
                console.log("Connection Error: " + error.toString())
            })

            connection.on('close', () => {
                console.log('echo-protocol Connection Closed')
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
            //dn: this.ext,
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
        return this.callAction(CallAction.HILD)
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

        console.log(prettyjson.render(obj))

        console.log("send:  \n".yellow + Agent.genSendStr(obj))

        return this.connection.send(Agent.genSendStr(obj))
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