'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _OPs = require('../OPs');

var _OPs2 = _interopRequireDefault(_OPs);

var _Adapter = require('./Adapter');

var _Adapter2 = _interopRequireDefault(_Adapter);

var _OpDescList = require('../OpDescList');

var _OpDescList2 = _interopRequireDefault(_OpDescList);

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Handler = function () {
    /**
     * @param  {Object}      agent    [Adapter]
     * @param  {Object|Null} bus      [Vue instance]
     * @param  {Boolean}     isDebug  [是否啟用除錯]
     */
    function Handler(agent, bus) {
        var isDebug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        _classCallCheck(this, Handler);

        this.agent = agent;
        this.bus = bus;
        this.isDebug = isDebug;
        this.cb = null;
    }

    /**
     * 接收 socket message
     *
     * @param  {Object} evt
     * @return {Mixed}
     */


    _createClass(Handler, [{
        key: 'receive',
        value: function receive(evt) {
            var data = evt.data || evt.utf8Data;
            var obj = _Adapter2.default.toObj(data);
            var op = Number(_lodash2.default.get(obj, 'op'));
            var opDesc = _lodash2.default.find(_OpDescList2.default, { code: op });

            this.cb = _lodash2.default.find(this.cbs, {
                op: op
            });

            if (this.isDebug) {
                opDesc ? console.log(('\n<<<<<<<<<<<<<< ' + opDesc.desc).cyan) : console.log(('\n<<<<<<<<<<<<<< Unknown (' + op + ')').cyan);

                console.log(_prettyjson2.default.render(obj));
            }

            return !_lodash2.default.isNil(this.cb) && _lodash2.default.isFunction(this[this.cb.method]) ? this[this.cb.method](data, !_Adapter2.default.isSuccess(data)) : this.unknownHandler(data);
        }

        /**
         * Unknown handler
         *
         * @param  {String}  data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'unknownHandler',
        value: function unknownHandler(data, isError) {
            return this.emit({
                eventName: _lodash2.default.isNil(this.cb) ? 'Unknown' : this.cb.event,
                withData: _Adapter2.default.toObj(data)
            }, isError);
        }

        /**
         * (4001) Connect to ACD Server response
         *
         * @param  {String} data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'authResponseHandler',
        value: function authResponseHandler(data, isError) {
            this.agent.nonce = _Adapter2.default.get(data, 'nonce');

            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            }, isError);
        }

        /**
         * (4002) Login to ACD Server response
         *
         * @param  {String} data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'loginResponseHandler',
        value: function loginResponseHandler(data, isError) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            }, isError);
        }

        /**
         * (4003) Logout from ACD Server response
         *
         * @param  {String} data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'logoutResponseHandler',
        value: function logoutResponseHandler(data, isError) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            }, isError);
        }

        /**
         * (4010) Get agent state response
         *
         * @param  {String} data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'currentAgentStateResponseHandler',
        value: function currentAgentStateResponseHandler(data, isError) {
            var obj = _Adapter2.default.toObj(data);

            if (this.isDebug) {
                this.printAgentState(Number(obj.state));
            }

            return this.emit({
                eventName: this.cb.event,
                withData: obj
            }, isError);
        }

        /**
         * (4011) Set agent state response
         *
         * @param  {String} data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'setCurrentAgentStateResponseHandler',
        value: function setCurrentAgentStateResponseHandler(data, isError) {
            var obj = _Adapter2.default.toObj(data);

            return this.emit({
                eventName: this.cb.event,
                withData: obj
            }, isError);
        }

        /**
         * (4030) Make call response
         *
         * @param  {String} data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'makeCallResponseHandler',
        value: function makeCallResponseHandler(data, isError) {
            var obj = _Adapter2.default.toObj(data);

            this.agent.cid = obj.cid;

            return this.emit({
                eventName: this.cb.event,
                withData: obj
            }, isError);
        }

        /**
         * (4031) Dial dtmf response
         *
         * @param  {String} data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'dialDtmfResponseHandler',
        value: function dialDtmfResponseHandler(data, isError) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            }, isError);
        }

        /**
         * (4032) Call action response
         *
         * @param  {String} data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'callActionResponseHandler',
        value: function callActionResponseHandler(data, isError) {
            var obj = _Adapter2.default.toObj(data);

            if (this.isDebug) {
                switch (obj.state) {
                    case 0:
                        console.log('Call-Action =>  '.yellow + '<ANSWER>'.red);
                        break;
                    case 1:
                        console.log('Call-Action =>  '.yellow + '<HOLD>'.red);
                        break;
                    case 2:
                        console.log('Call-Action =>  '.yellow + '<DISCONNECT>'.red);
                        break;
                    case 3:
                        console.log('Call-Action =>  '.yellow + '<MUTE>'.red);
                        break;
                    case 4:
                        console.log('Call-Action =>  '.yellow + '<CANCEL>'.red);
                        break;
                }
            }

            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            }, isError);
        }

        /**
         * (4038) Get dn state response
         *
         * @param  {String} data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'getDnStateResponseHandler',
        value: function getDnStateResponseHandler(data, isError) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            }, isError);
        }

        /**
         * Query acd state response
         *
         * @param  {String} data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'queryAcdStateResponseHandler',
        value: function queryAcdStateResponseHandler(data, isError) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            }, isError);
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

    }, {
        key: 'agentStateChangeEventHandler',
        value: function agentStateChangeEventHandler(data) {
            var obj = _Adapter2.default.toObj(data);

            this.agent.state = Number(obj.state);

            if (this.isDebug) {
                this.printAgentState(Number(obj.state));
            }

            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            });
        }

        /**
         * 輸出 Agent 目前的狀態
         *
         * @param  {Number} state
         * @return {Void}
         */

    }, {
        key: 'printAgentState',
        value: function printAgentState(state) {
            switch (state) {
                case 0:
                    console.log('Agent-State >>>>  '.yellow + 'Login'.red);
                    break;

                case 1:
                    console.log('Agent-State >>>>  '.yellow + 'Logout'.red);
                    break;

                case 2:
                    console.log('Agent-State >>>>  '.yellow + 'Not Ready'.red);
                    break;

                case 3:
                    console.log('Agent-State >>>>  '.yellow + 'Ready'.green);
                    break;

                case 4:
                    console.log('Agent-State >>>>  '.yellow + 'Busy'.magenta);
                    break;

                case 5:
                    console.log('Agent-State >>>>  '.yellow + 'ACW'.magenta);
                    break;

                case 6:
                    console.log('Agent-State >>>>  '.yellow + 'Answer Abandoned'.red);
                    break;

                case 7:
                    console.log('Agent-State >>>>  '.yellow + 'Un-exclusive Busy'.magenta);
                    break;

                case 8:
                    console.log('Agent-State >>>>  '.yellow + 'Assigned'.magenta);
                    break;

                default:
                    console.log('Agent-State >>>>  '.yellow + 'Unknown'.red);
                    break;
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

    }, {
        key: 'messageReceiveEvent',
        value: function messageReceiveEvent(data) {
            var SIP_PHONE_DIALING = 98;
            var ACD_DN_QUEUE_COUNT_CHANGE = 99;

            var obj = _Adapter2.default.toObj(data);

            if (_lodash2.default.includes([SIP_PHONE_DIALING, ACD_DN_QUEUE_COUNT_CHANGE], _lodash2.default.get(obj, 'atype'))) {
                return this.emit({
                    eventName: this.cb.event,
                    withData: obj
                });
            }
        }

        /**
         * (9003) Call state change event
         *
         * @param  {String} data
         * @return {Mixed}
         */

    }, {
        key: 'callStateChangeEvent',
        value: function callStateChangeEvent(data) {
            var obj = _Adapter2.default.toObj(data);
            var DISCONNECT_STATE = 0;

            if (this.isDebug) {
                switch (Number(obj.state)) {
                    case 0x0:
                        console.log('Call-State =>  '.yellow + 'Call is disconnected and became idle'.magenta);
                        break;

                    case 0x1:
                        console.log('Call-State =>  '.yellow + 'Call is ringing'.cyan);
                        break;

                    case 0x2:
                        console.log('Call-State =>  '.yellow + 'Call is connected'.green);
                        break;

                    case 0x4:
                        console.log('Call-State =>  '.yellow + 'Agent has been coached'.blue);
                        break;

                    case 0x5:
                        console.log('Call-State =>  '.yellow + 'Agent has forced to enter conference'.blue);
                        break;

                    case 0x6:
                        console.log('Call-State =>  '.yellow + 'Agent has been monitored'.blue);
                        break;

                    case 0x7:
                        console.log('Call-State => '.yellow + 'Agent ask supervisor to enter conference'.blue);
                        break;

                    default:
                        console.log('Call-State =>  '.yellow + 'Unknown'.red);
                        break;
                }
            }

            // 掛斷時，將 cid 改為 null
            if (_lodash2.default.isEqual(Number(_lodash2.default.get(obj, 'state')), DISCONNECT_STATE)) {
                this.agent.cid = null;
            } else {
                this.agent.cid = obj.cid;
            }

            this.agent.callState = Number(_lodash2.default.get(obj, 'state'));

            return this.emit({
                eventName: this.cb.event,
                withData: obj
            });
        }

        /**
         * (9004) Incoming call event
         *
         * @param  {String} data
         * @return {Mixed}
         */

    }, {
        key: 'incomingCallEvent',
        value: function incomingCallEvent(data) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            });
        }

        /**
         * Emit to vue instance via bus
         *
         * @param  {String} options.eventName
         * @param  {Obj} options.withData
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'emit',
        value: function emit(_ref) {
            var eventName = _ref.eventName,
                withData = _ref.withData;
            var isError = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            if (this.bus) {
                return this.bus.$emit(eventName, {
                    data: withData,
                    error: true
                });
            }
        }

        /**
         * Callback mapped collection
         *
         * @return {Array} [{op:<op code> method:<callback method> event: <vue bus event-name>}]
         */

    }, {
        key: 'cbs',
        get: function get() {
            return [{
                op: _OPs2.default.CONNECT_TO_ACD_RESPONSE,
                method: 'authResponseHandler',
                event: 'auth'
            }, {
                op: _OPs2.default.AGENT_LOGIN_RESPONSE,
                method: 'loginResponseHandler',
                event: 'login'
            }, {
                op: _OPs2.default.AGENT_LOGOUT_RESPONSE,
                method: 'logoutResponseHandler',
                event: 'logout'
            }, {
                op: _OPs2.default.CURRENT_AGENT_STATE_RESPONSE,
                method: 'currentAgentStateResponseHandler',
                event: 'get-current-agent-state'
            }, {
                op: _OPs2.default.QUERY_ACD_QUEUED_RESPONSE,
                method: 'queryAcdStateResponseHandler',
                event: 'query-acd-state-response-handler'
            }, {
                op: _OPs2.default.SET_CURRNET_AGENT_STATE_RESPONSE,
                method: 'setCurrentAgentStateResponseHandler',
                event: 'set-current-agent-state-eesponse'
            }, {
                op: _OPs2.default.MAKE_CALL_RESPONSE,
                method: 'makeCallResponseHandler',
                event: 'make-call-response'
            }, {
                op: _OPs2.default.DIAL_DTMF_RESPONSE,
                method: 'dialDtmfResponseHandler',
                event: 'dial-dtmf-response'
            }, {
                op: _OPs2.default.CALL_ACTION_RESPONSE,
                method: 'callActionResponseHandler',
                event: 'call-action-response'
            }, {
                op: _OPs2.default.GET_DN_STATE_RESPONSE,
                method: 'getDnStateResponseHandler',
                event: 'get-dn-state-response'
            }, {
                op: _OPs2.default.AGENT_STATE_CHANGE_EVENT, // 9001
                method: 'agentStateChangeEventHandler',
                event: 'agent-state-change-event'
            }, {
                op: _OPs2.default.MESSAGE_RECEIVE_EVENT, // 9002
                method: 'messageReceiveEvent',
                event: 'message-receive-event'
            }, {
                op: _OPs2.default.CALL_STATE_CHANGE_EVENT, // 9003
                method: 'callStateChangeEvent',
                event: 'state-change-event'
            }, {
                op: _OPs2.default.INCOMING_CALL_EVENT, // 9004
                method: 'incomingCallEvent',
                event: 'incoming-call-event'
            }];
        }
    }]);

    return Handler;
}();

exports.default = Handler;