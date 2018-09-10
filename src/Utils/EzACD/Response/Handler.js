import Adapter from './Adapter'
import OpDescList from '../OpDescList'
import ResponseHandlerMap from './ResponseHandlerMap'
import prettyjson from 'prettyjson'
import colors from 'colors'
import OPs from '../OPs'
import _ from 'lodash'

export default class Handler
{
    /**
     * @param  {Object}      agent    [Adapter]
     * @param  {Object|Null} bus      [Vue instance]
     * @param  {Boolean}     isDebug  [是否啟用除錯]
     */
    constructor(agent, bus, isDebug = false) {
        this.agent = agent
        this.bus = bus
        this.isDebug = isDebug
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
        let obj = Adapter.toObj(data)
        let op = Number(_.get(obj, 'op'))

        if (_.isEqual(op, OPs.GET_AGENT_GROUP_LIST_RESPONSE)) {
            obj = Adapter.toObj(data, true)
        }

        let opDesc = _.find(OpDescList, { code: op })

        this.cb = _.find(this.cbs, {
            op,
        })

        if (this.isDebug) {
            opDesc ?
                console.log(`\n<<<<<<<<<<<<<< ${opDesc.desc}`.cyan) :
                console.log(`\n<<<<<<<<<<<<<< Unknown (${op})`.cyan)

            console.log(prettyjson.render(obj))
        }

        return !_.isNil(this.cb) && _.isFunction(this[this.cb.method]) ?
            this[this.cb.method](data, !Adapter.isSuccess(data)) :
            this.unknownHandler(data)
    }

    /**
     * Unknown handler
     *
     * @param  {String}  data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    unknownHandler(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * (4001) Connect to ACD Server response
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    authResponseHandler(data, isError) {
        this.agent.nonce = Adapter.get(data, 'nonce')

        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * (4002) Login to ACD Server response
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    loginResponseHandler(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * (4003) Logout from ACD Server response
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    logoutResponseHandler(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * (4010) Get agent state response
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    currentAgentStateResponseHandler(data, isError) {
        let obj = Adapter.toObj(data)

        if (this.isDebug) {
            this.printAgentState(Number(obj.state))
        }

        return this.emitViaBus(obj, isError)
    }

    /**
     * (4011) Set agent state response
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    setCurrentAgentStateResponseHandler(data, isError) {
        let obj = Adapter.toObj(data)

        return this.emitViaBus(obj, isError)
    }

    /**
     * (4030) Make call response
     *
     * 更新 agent 的 cid
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    makeCallResponseHandler(data, isError) {
        let obj = Adapter.toObj(data)

        this.agent.cid = obj.cid

        return this.emitViaBus(obj, isError)
    }

    /**
     * (4031) Dial dtmf response
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    dialDtmfResponseHandler(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * (4032) Call action response
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    callActionResponseHandler(data, isError) {
        let obj = Adapter.toObj(data)

        if (this.isDebug) {
            switch (obj.state) {
                case 0:
                    console.log('Call-Action =>  '.yellow + '<ANSWER>'.red)
                break
                case 1:
                    console.log('Call-Action =>  '.yellow + '<HOLD>'.red)
                break
                case 2:
                    console.log('Call-Action =>  '.yellow + '<DISCONNECT>'.red)
                break
                case 3:
                    console.log('Call-Action =>  '.yellow + '<MUTE>'.red)
                break
                case 4:
                    console.log('Call-Action =>  '.yellow + '<CANCEL>'.red)
                break
            }
        }

        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * (4038) Get dn state response
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    getDnStateResponseHandler(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * Query acd state response
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    queryAcdStateResponseHandler(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * make2ndCallResponse
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    make2ndCallResponse(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * mergeCallActionResponse
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    mergeCallActionResponse(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * getAgentGroupListResponse (4021)
     *
     * @param  {String}  data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    getAgentGroupListResponse(data, isError) {
        return this.emitViaBus(Adapter.toObj(data, true), isError)
    }

    /**
     * getDnPerformanceResponse
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    getDnPerformanceResponse(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * getAgentPerformanceResponse
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Void]}
     */
    getAgentPerformanceResponse(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * getAgentGroupPerformanceResponse
     *
     * @param  {String} data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    getAgentGroupPerformanceResponse(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
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

        this.agent.state = Number(obj.state)

        if (this.isDebug) {
            this.printAgentState(Number(obj.state))
        }

        return this.emitViaBus(Adapter.toObj(data))
    }

    /**
     * 輸出 Agent 目前的狀態
     *
     * @param  {Number} state
     * @return {Void}
     */
    printAgentState(state) {
        switch (state) {
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
                 console.log('Agent-State >>>>  '.yellow + 'Ready'.green)
            break

            case 4:
                 console.log('Agent-State >>>>  '.yellow + 'Busy'.magenta)
            break

            case 5:
                 console.log('Agent-State >>>>  '.yellow + 'ACW'.magenta)
            break

            case 6:
                 console.log('Agent-State >>>>  '.yellow + 'Answer Abandoned'.red)
            break

            case 7:
                 console.log('Agent-State >>>>  '.yellow + 'Un-exclusive Busy'.magenta)
            break

            case 8:
                 console.log('Agent-State >>>>  '.yellow + 'Assigned'.magenta)
            break

            default:
                console.log('Agent-State >>>>  '.yellow + 'Unknown'.red)
            break
        }
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
            Number(_.get(obj, 'atype'))
        )) {
            return this.emitViaBus(obj)
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

        if (this.isDebug) {
            switch (Number(obj.state)) {
                case 0x0:
                    console.log('Call-State =>  '.yellow + 'Call is disconnected and became idle'.magenta)
                break

                case 0x1:
                    console.log('Call-State =>  '.yellow + 'Call is ringing'.cyan)
                break

                case 0x2:
                    console.log('Call-State =>  '.yellow + 'Call is connected'.green)
                break

                case 0x4:
                    console.log('Call-State =>  '.yellow + 'Agent has been coached'.blue)
                break

                case 0x5:
                    console.log('Call-State =>  '.yellow + 'Agent has forced to enter conference'.blue)
                break

                case 0x6:
                    console.log('Call-State =>  '.yellow + 'Agent has been monitored'.blue)
                break

                case 0x7:
                    console.log('Call-State => '.yellow + 'Agent ask supervisor to enter conference'.blue)
                break

                default:
                    console.log('Call-State =>  '.yellow + 'Unknown'.red)
                break
            }
        }

        // 掛斷時，將 cid 改為 null
        this.agent.cid = _.isEqual(Number(_.get(obj, 'state')), DISCONNECT_STATE) ? null : obj.cid

        // 更新 Call State
        this.agent.callState = Number(_.get(obj, 'state'))

        return this.emitViaBus(obj)
    }

    /**
     * (9004) Incoming call event
     *
     * @param  {String} data
     * @return {Mixed}
     */
    incomingCallEvent(data) {
        return this.emitViaBus(Adapter.toObj(data))
    }

    /**
     * Emit via bus
     *
     * @param  {Object} obj
     * @return {Void}
     */
    emitViaBus(obj, isError = false) {
        return this.emit({
            eventName: _.get(this.cb, 'event', 'Unknown'),
            withData: obj,
        }, isError)
    }

    /**
     * Emit to vue instance via bus
     *
     * @param  {String} options.eventName
     * @param  {Obj} options.withData
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    emit({ eventName, withData }, isError = false) {
        if (this.bus) {
            return this.bus.$emit(eventName, {
                data: withData,
                error: true,
            })
        }
    }

    /**
     * Callback mapped collection
     *
     * @return {Array} [{op:<op code> method:<callback method> event: <vue bus event-name>}]
     */
    get cbs() {
        return ResponseHandlerMap
    }
}