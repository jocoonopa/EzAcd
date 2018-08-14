import OPS from '../OPs'
import Adapter from './Adapter'
import prettyjson from 'prettyjson'
import colors from 'colors'
import _ from 'lodash'

export default class Handler
{
    /**
     * @param  {Object} agent [Adapter]
     * @param  {Object|Null} bus   [Vue instance]
     */
    constructor(agent, bus) {
        this.agent = agent
        this.bus = bus
        this.cb = null
    }

    /**
     * 接收 socket message
     *
     * @param  {Object} evt
     * @return {Mixed}
     */
    receive(evt) {
        let data = evt.data || evt.utf8Data

        this.cb = _.find(this.cbs, {
            op: Number(Adapter.get(data, 'op'))
        })

        if (!Adapter.isSuccess(data)) {
            return this.emit({
                eventName: _.isNil(this.cb) ? 'Unknown' : this.cb.event,
                withData: Adapter.toObj(data),
                error: true,
            })
        }

        return !_.isNil(this.cb) && _.isFunction(this[this.cb.method]) ? this[this.cb.method](data) : null
    }

    /**
     * (4001) Connect to ACD Server response
     *
     * @param  {String} data
     * @return {Mixed}
     */
    authResponseHandler(data) {
        this.agent.nonce = Adapter.get(data, 'nonce')

        return this.emit({
            eventName: this.cb.event,
            withData: Adapter.toObj(data),
        })
    }

    /**
     * (4002) Login to ACD Server response
     *
     * @param  {String} data
     * @return {Mixed}
     */
    loginResponseHandler(data) {
        return this.emit({
            eventName: this.cb.event,
            withData: Adapter.toObj(data),
        })
    }

    /**
     * (4003) Logout from ACD Server response
     *
     * @param  {String} data
     * @return {Mixed}
     */
    logoutResponseHandler(data) {
        return this.emit({
            eventName: this.cb.event,
            withData: Adapter.toObj(data),
        })
    }

    /**
     * (4010) Get agent state response
     *
     * @param  {String} data
     * @return {Mixed}
     */
    currentAgentStateResponseHandler(data) {
        return this.emit({
            eventName: this.cb.event,
            withData: Adapter.toObj(data),
        })
    }

    /**
     * (4011) Set agent state response
     *
     * @param  {String} data
     * @return {Mixed}
     */
    setCurrentAgentStateResponseHandler(data) {
        return this.emit({
            eventName: this.cb.event,
            withData: Adapter.toObj(data),
        })
    }

    /**
     * (4030) Make call response
     *
     * @param  {String} data
     * @return {Mixed}
     */
    makeCallResponseHandler(data) {
        let obj = Adapter.toObj(data)

        this.agent.cid = obj.cid

        return this.emit({
            eventName: this.cb.event,
            withData: obj,
        })
    }

    /**
     * (4031) Dial dtmf response
     *
     * @param  {String} data
     * @return {Mixed}
     */
    dialDtmfResponseHandler(data) {
        return this.emit({
            eventName: this.cb.event,
            withData: Adapter.toObj(data),
        })
    }

    /**
     * (4032) Call action response
     *
     * @param  {String} data
     * @return {Mixed}
     */
    callActionResponseHandler(data) {
        let obj = Adapter.toObj(data)

        console.log('========= Call State ========='.blue)
        console.log(prettyjson.render(obj))

        switch (obj.state) {
            case 0:
                console.log('Call-State >>>>>  '.yellow + '<ANSWER>'.red)
            break
            case 1:
                console.log('Call-State >>>>>  '.yellow + '<HOLD>'.red)
            break
            case 2:
                console.log('Call-State >>>>>  '.yellow + '<DISCONNECT>'.red)
            break
            case 3:
                console.log('Call-State >>>>>  '.yellow + '<MUTE>'.red)
            break
            case 4:
                console.log('Call-State >>>>>  '.yellow + '<CANCEL>'.red)
            break
        }

        return this.emit({
            eventName: this.cb.event,
            withData: Adapter.toObj(data),
        })
    }

    /**
     * (9001) This event will be send when:
     *     1. agent use Set Agent State to change state or
     *     2. server change agent state.
     *
     * state-list:
     *  - 0: Login
     *  - 1: Logout
     *  - 2: Not Ready
     *  - 3: Ready
     *  - 4: Busy(unchangeable from agent)
     *  - 5: ACW (unchangeable from agent)
     *  - 6: Answer Abandoned (unchangeable from agent)
     *  - 7: Un-exclusive Busy (unchangeable from agent)
     *  - 8: Assigned (unchangeable from agent)
     *
     * @param  {String} data
     * @return {Mixed}
     */
    agentStateChangeEventHandler(data) {
        let obj = Adapter.toObj(data)

        console.log('========= Agent State ========='.yellow)
        console.log(prettyjson.render(obj))

        switch(Number(obj.state)) {
            case 0:
                console.log('Agent-State >>>>  '.yellow + 'Login'.red)
            break

            case 1:
                 console.log('Agent-State >>>>  '.yellow + 'Logout'.red)
            break

            case 2:
                  console.log('Agent-State >>>>  '.yellow + 'Not Ready'.red)
            break

            case 3:
                 console.log('Agent-State >>>>  '.yellow + 'Ready'.red)
            break

            case 4:
                 console.log('Agent-State >>>>  '.yellow + 'Busy'.red)
            break

            case 5:
                 console.log('Agent-State >>>>  '.yellow + 'ACW'.red)
            break

            case 6:
                 console.log('Agent-State >>>>  '.yellow + 'Answer Abandoned'.red)
            break

            case 7:
                 console.log('Agent-State >>>>  '.yellow + 'Busy'.red)
            break

            case 8:
                 console.log('Agent-State >>>>  '.yellow + 'Assigned'.red)
            break
        }

        return this.emit({
            eventName: this.cb.event,
            withData: Adapter.toObj(data),
        })
    }

    /**
     * (9002) The event is to notice agent desktop there is a message arrived.
     * It could the one of the following:
     *     - Bulletin message received
     *     - Agent to Agent message
     *     - Customer Chat message
     *     - Bulletin message need to be deleted notice
     *     - SIP Phone Dialing Information
     *
     * @param  {String} data
     * @return {Void}
     */
    messageReceiveEvent(data) {
        const SIP_PHONE_DIALING = 98
        const ACD_DN_QUEUE_COUNT_CHANGE = 99

        let obj = Adapter.toObj(data)

        if (_.includes(
            [
                SIP_PHONE_DIALING,
                ACD_DN_QUEUE_COUNT_CHANGE,
            ],
            _.get(obj, 'atype')
        )) {
            return this.emit({
                eventName: this.cb.event,
                withData: obj,
            })
        }
    }

    /**
     * (9003) Call state change event
     *
     * @param  {String} data
     * @return {Mixed}
     */
    callStateChangeEvent(data) {
        let obj = Adapter.toObj(data)
        const DISCONNECT_STATE = 0

        console.log('========= Call State ========='.pink)

        console.log(prettyjson.render(obj))

        // 掛斷時，將 cid 改為 null
        if (_.isEqual(Number(_.get(obj, 'state')), DISCONNECT_STATE)) {
            this.agent.cid = null
        }

        return this.emit({
            eventName: this.cb.event,
            withData: obj,
        })
    }

    /**
     * (9004) Incoming call event
     * 
     * @param  {String} data
     * @return {Mixed}
     */
    incomingCallEvent(data) {
        return this.emit({
            eventName: this.cb.event,
            withData: Adapter.toObj(data),
        })
    }

    /**
     * Emit to vue instance via bus
     *
     * @param  {String} options.eventName
     * @param  {Obj} options.withData
     * @return {Mixed}
     */
    emit({ eventName, withData }) {
        if (this.bus) {
            return this.bus.emit(eventName, withData)
        }
    }

    get cbs() {
        return [
            {
                op: OPS.CONNECT_TO_ACD_RESPONSE,
                method: 'authResponseHandler',
                event: 'auth',
            },

            {
                op: OPS.AGENT_LOGIN_RESPONSE,
                method: 'loginResponseHandler',
                event: 'login',
            },

            {
                op: OPS.AGENT_LOGOUT_RESPONSE,
                method: 'logoutResponseHandler',
                event: 'logout',
            },

            {
                op: OPS.CURRENT_AGENT_STATE_RESPONSE,
                method: 'currentAgentStateResponseHandler',
                event: 'get-current-agent-state',
            },

            {
                op: OPS.SET_CURRNET_AGENT_STATE_RESPONSE,
                method: 'setCurrentAgentStateResponseHandler',
                event: 'set-current-agent-state-eesponse',
            },

            {
                op: OPS.MAKE_CALL_RESPONSE,
                method: 'makeCallResponseHandler',
                event: 'make-call-response',
            },

            {
                op: OPS.DIAL_DTMF_RESPONSE,
                method: 'dialDtmfResponseHandler',
                event: 'dial-dtmf-response',
            },

            {
                op: OPS.CALL_ACTION_RESPONSE,
                method: 'callActionResponseHandler',
                event: 'call-action-response',
            },

            {
                op: OPS.AGENT_STATE_CHANGE_EVENT, // 9001
                method: 'agentStateChangeEventHandler',
                event: 'agent-state-change-event',
            },

            {
                op: OPS.MESSAGE_RECEIVE_EVENT, // 9002
                method: 'messageReceiveEvent',
                event: 'message-receive-event',
            },

            {
                op: OPS.CALL_STATE_CHANGE_EVENT, // 9003
                method: 'callStateChangeEvent',
                event: 'state-change-event',
            },

            {
                op: OPS.INCOMING_CALL_EVENT, // 9004
                method: 'incomingCallEvent',
                event: 'incoming-call-event',
            },
        ]
    }
}