'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _OPs = require('../OPs');

var _OPs2 = _interopRequireDefault(_OPs);

var _Adapter = require('./Adapter');

var _Adapter2 = _interopRequireDefault(_Adapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Handler = function () {
    /**
     * @param  {Object} agent [Adapter]
     * @param  {Object|Null} bus   [Vue instance]
     */
    function Handler(agent, bus) {
        _classCallCheck(this, Handler);

        this.agent = agent;
        this.bus = bus;
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

            this.cb = _.find(this.cbs, {
                op: Number(_Adapter2.default.get(data, 'op'))
            });

            if (!_Adapter2.default.isSuccess(data)) {
                return this.emit({
                    eventName: _.isNil(this.cb) ? 'Unknown' : this.cb.event,
                    withData: _Adapter2.default.toObj(data),
                    error: true
                });
            }

            return !_.isNil(this.cb) && _.isFunction(this[this.cb.method]) ? this[this.cb.method](data) : null;
        }

        /**
         * (4001) Connect to ACD Server response
         *
         * @param  {String} data
         * @return {Mixed}
         */

    }, {
        key: 'authResponseHandler',
        value: function authResponseHandler(data) {
            this.agent.nonce = _Adapter2.default.get(data, 'nonce');

            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            });
        }

        /**
         * (4002) Login to ACD Server response
         *
         * @param  {String} data
         * @return {Mixed}
         */

    }, {
        key: 'loginResponseHandler',
        value: function loginResponseHandler(data) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            });
        }

        /**
         * (4003) Logout from ACD Server response
         *
         * @param  {String} data
         * @return {Mixed}
         */

    }, {
        key: 'logoutResponseHandler',
        value: function logoutResponseHandler(data) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            });
        }

        /**
         * (4010) Get agent state response
         *
         * @param  {String} data
         * @return {Mixed}
         */

    }, {
        key: 'currentAgentStateResponseHandler',
        value: function currentAgentStateResponseHandler(data) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            });
        }

        /**
         * (4011) Set agent state response
         *
         * @param  {String} data
         * @return {Mixed}
         */

    }, {
        key: 'setCurrentAgentStateResponseHandler',
        value: function setCurrentAgentStateResponseHandler(data) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            });
        }

        /**
         * (4030) Make call response
         *
         * @param  {String} data
         * @return {Mixed}
         */

    }, {
        key: 'makeCallResponseHandler',
        value: function makeCallResponseHandler(data) {
            var obj = _Adapter2.default.toObj(data);

            this.agent.cid = obj.cid;

            return this.emit({
                eventName: this.cb.event,
                withData: obj
            });
        }

        /**
         * (4031) Dial dtmf response
         *
         * @param  {String} data
         * @return {Mixed}
         */

    }, {
        key: 'dialDtmfResponseHandler',
        value: function dialDtmfResponseHandler(data) {
            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            });
        }

        /**
         * (4032) Call action response
         *
         * @param  {String} data
         * @return {Mixed}
         */

    }, {
        key: 'callActionResponseHandler',
        value: function callActionResponseHandler(data) {
            var obj = _Adapter2.default.toObj(data);

            console.log('========= Call State ========='.blue);
            console.log(prettyjson.render(obj));

            switch (obj.state) {
                case 0:
                    console.log('Call-State >>>>>  '.yellow + '<ANSWER>'.red);
                    break;
                case 1:
                    console.log('Call-State >>>>>  '.yellow + '<HOLD>'.red);
                    break;
                case 2:
                    console.log('Call-State >>>>>  '.yellow + '<DISCONNECT>'.red);
                    break;
                case 3:
                    console.log('Call-State >>>>>  '.yellow + '<MUTE>'.red);
                    break;
                case 4:
                    console.log('Call-State >>>>>  '.yellow + '<CANCEL>'.red);
                    break;
            }

            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            });
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

            console.log('========= Agent State ========='.yellow);
            console.log(prettyjson.render(obj));

            switch (Number(obj.state)) {
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
                    console.log('Agent-State >>>>  '.yellow + 'Ready'.red);
                    break;

                case 4:
                    console.log('Agent-State >>>>  '.yellow + 'Busy'.red);
                    break;

                case 5:
                    console.log('Agent-State >>>>  '.yellow + 'ACW'.red);
                    break;

                case 6:
                    console.log('Agent-State >>>>  '.yellow + 'Answer Abandoned'.red);
                    break;

                case 7:
                    console.log('Agent-State >>>>  '.yellow + 'Busy'.red);
                    break;

                case 8:
                    console.log('Agent-State >>>>  '.yellow + 'Assigned'.red);
                    break;
            }

            return this.emit({
                eventName: this.cb.event,
                withData: _Adapter2.default.toObj(data)
            });
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

            if (_.includes([SIP_PHONE_DIALING, ACD_DN_QUEUE_COUNT_CHANGE], _.get(obj, 'atype'))) {
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

            console.log('========= Call State ========='.pink);

            console.log(prettyjson.render(obj));

            // 掛斷時，將 cid 改為 null
            if (_.isEqual(Number(_.get(obj, 'state')), DISCONNECT_STATE)) {
                this.agent.cid = null;
            }

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
         * @return {Mixed}
         */

    }, {
        key: 'emit',
        value: function emit(_ref) {
            var eventName = _ref.eventName,
                withData = _ref.withData;

            if (this.bus) {
                return this.bus.emit(eventName, withData);
            }
        }
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