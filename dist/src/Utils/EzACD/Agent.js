'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Adapter = require('./Response/Adapter');

var _Adapter2 = _interopRequireDefault(_Adapter);

var _Handler = require('./Response/Handler');

var _Handler2 = _interopRequireDefault(_Handler);

var _OpDescList = require('./OpDescList');

var _OpDescList2 = _interopRequireDefault(_OpDescList);

var _CallActionDescList = require('./CallActionDescList');

var _CallActionDescList2 = _interopRequireDefault(_CallActionDescList);

var _websocket = require('websocket');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _OPs = require('./OPs');

var _OPs2 = _interopRequireDefault(_OPs);

var _CallAction = require('./CallAction');

var _CallAction2 = _interopRequireDefault(_CallAction);

var _MergeCallAction = require('./MergeCallAction');

var _MergeCallAction2 = _interopRequireDefault(_MergeCallAction);

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Agent = function () {
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
    function Agent(_ref) {
        var port = _ref.port,
            domain = _ref.domain,
            id = _ref.id,
            ext = _ref.ext,
            password = _ref.password,
            centerId = _ref.centerId,
            ssl = _ref.ssl;
        var bus = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var isDebug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var mockConnection = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

        _classCallCheck(this, Agent);

        this.port = port;
        this.domain = domain;
        this.id = id;
        this.password = password;
        this.centerId = centerId;
        this.ext = ext;
        this.cid = null;
        this.protocol = ssl ? 'wss' : 'ws';
        this.isDebug = isDebug;

        this.initSocket(mockConnection);

        /* init by self */
        this.seq = 0;
        this.state = null;
        this.callState = null;

        this.handler = new _Handler2.default(this, bus, isDebug);
    }

    /**
     * 建立 websocket
     *
     * @param  {Object} mockConnection
     * @return {Void}
     */


    _createClass(Agent, [{
        key: 'initSocket',
        value: function initSocket() {
            var mockConnection = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            if (this.connection) {
                return;
            }

            if (mockConnection) {
                return this.initTestSocket(mockConnection);
            }

            return 'undefined' !== typeof window ? this.initBrowserSocket() : this.initNodeSocket();
        }
    }, {
        key: 'initTestSocket',
        value: function initTestSocket(mockConnection) {
            var _this = this;

            this.connection = mockConnection;

            this.connection.on('message', function (message) {
                return _this.handler.receive(message);
            });
        }
    }, {
        key: 'initBrowserSocket',
        value: function initBrowserSocket() {
            var _this2 = this;

            this.connection = new _websocket.w3cwebsocket(this.url, 'cti-agent-protocol');

            this.connection.onerror = function (error) {
                _this2.emit(Agent.events.SOCKET_ERROR, {
                    message: 'Connection Error: ' + error.toString()
                });
            };

            this.connection.onopen = function () {
                return _this2.authorize();
            };

            this.connection.onclose = function () {
                _this2.emit(Agent.events.SOCKET_CLOSED, {
                    message: 'echo-protocol Client Closed'
                });
            };

            this.connection.onmessage = function (message) {
                return _this2.handler.receive(message);
            };
        }
    }, {
        key: 'initNodeSocket',
        value: function initNodeSocket() {
            var _this3 = this;

            this.socket = new _websocket.client();

            if (this.isDebug) {
                console.log(('\n' + this.url + '\n\n').yellow);
            }

            this.socket.connect(this.url, 'cti-agent-protocol');

            this.socket.on('connect', function (connection) {
                _this3.connection = connection;

                connection.on('message', function (message) {
                    _this3.handler.receive(message);
                });

                connection.on('error', function (error) {
                    if (_this3.isDebug) {
                        console.log(('Connection Error: ' + error.toString()).red);
                    }

                    _this3.emit(Agent.events.SOCKET_ERROR, {
                        message: 'Connection Error: ' + error.toString()
                    });
                });

                connection.on('close', function () {
                    if (_this3.isDebug) {
                        console.log('echo-protocol Client Closed'.cyan);
                    }

                    _this3.emit(Agent.events.SOCKET_CLOSED, {
                        message: 'echo-protocol Client Closed'
                    });
                });

                _this3.authorize();
            });
        }

        /**
         * This command start the AP level communication to ACD server after you successfully connect to webosocket server.
         * The server will return an nonce value for authentication.
         *
         * @param  {Number} seq  [Unique command sequence]
         * @return {Void}
         */

    }, {
        key: 'authorize',
        value: function authorize(seq) {
            return this.dispatch({
                op: _OPs2.default.CONNECT_TO_ACD,
                seq: seq,
                ag: this.ag
            });
        }

        /**
         * After receive 4001 form server,
         * agent desktop use the receive nonce and password for the agent to calculate the auth header.
         * And send this command to start the login procedure.
         *
         * @param  {Number} seq  [Unique command sequence]
         * @return {Void}
         */

    }, {
        key: 'login',
        value: function login(seq) {
            return this.dispatch({
                op: _OPs2.default.AGENT_LOGIN,
                seq: seq,
                ag: this.ag,
                auth: this.auth,
                agext: this.ext
            });
        }

        /**
         * Logout agent from ACD server
         *
         * @param  {Number} seq  [Unique command sequence]
         * @return {Void}
         */

    }, {
        key: 'logout',
        value: function logout(seq) {
            return this.dispatch({
                op: _OPs2.default.AGENT_LOGOUT,
                seq: seq
            });
        }

        /**
         * This command can be used to retrieve the current agent state,
         * supported DN and enabled skill
         *
         * @param  {Number} seq  [Unique command sequence]
         * @return {Void}
         */

    }, {
        key: 'getState',
        value: function getState(seq) {
            return this.dispatch({
                op: _OPs2.default.GET_CURRENT_AGENT_STATE,
                seq: seq
            });
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

    }, {
        key: 'setState',
        value: function setState(state, seq) {
            return this.dispatch({
                op: _OPs2.default.SET_CURRNET_AGENT_STATE,
                seq: seq,
                state: state
            });
        }

        /**
         * 取得話機狀態
         *
         * @param  {Number} seq [Unique command sequence]
         * @return {Void}
         */

    }, {
        key: 'getDnState',
        value: function getDnState(seq) {
            return this.dispatch({
                op: _OPs2.default.GET_DN_STATE,
                seq: seq
            });
        }

        /**
         * Query ACD Queued
         *
         * @param  {Number} seq   [Unique command sequence]
         * @param  {Number} dn [ACD DN to be queried]
         * @return {Void}
         */

    }, {
        key: 'queryAcdQueued',
        value: function queryAcdQueued(dn, seq) {
            return this.dispatch({
                op: _OPs2.default.QUERY_ACD_QUEUED,
                seq: seq,
                dn: dn
            });
        }

        /**
         * Make call
         *
         * @param  {Number} options.dn   [Dial Number]
         * @param  {Number} seq  [Unique command sequence]
         * @return {Void}
         */

    }, {
        key: 'makeCall',
        value: function makeCall(dn, seq) {
            return this.dispatch({
                op: _OPs2.default.MAKE_CALL,
                seq: seq,
                tel: dn
            });
        }

        /**
         * This command is used to send DTMF to remote party.
         *
         * @param  {Number} dtmf  [digit to be dialed, 1 digit can be send for each command]
         * @param  {Number} seq   [Unique command sequence]
         * @return {Void}
         */

    }, {
        key: 'dialDtmf',
        value: function dialDtmf(dtmf, seq) {
            return this.dispatch({
                op: _OPs2.default.DIAL_DTMF,
                seq: seq,
                dtmf: dtmf
            });
        }
    }, {
        key: 'answer',
        value: function answer() {
            return this.callAction(_CallAction2.default.ANSWER);
        }
    }, {
        key: 'disconnect',
        value: function disconnect() {
            return this.callAction(_CallAction2.default.DISCONNECT);
        }
    }, {
        key: 'hold',
        value: function hold() {
            return this.callAction(_CallAction2.default.HOLD);
        }
    }, {
        key: 'mute',
        value: function mute() {
            return this.callAction(_CallAction2.default.MUTE);
        }
    }, {
        key: 'cancel',
        value: function cancel() {
            return this.callAction(_CallAction2.default.CANCEL);
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

    }, {
        key: 'callAction',
        value: function callAction(act, seq) {
            return this.dispatch({
                op: _OPs2.default.CALL_ACTION,
                seq: seq,
                act: act,
                cid: this.cid // [cid 可以從 4030 (Make Call Response)取得]
            });
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

    }, {
        key: 'make2ndCall',
        value: function make2ndCall(tel, cid) {
            return this.dispatch({
                op: _OPs2.default.MAKE_2ND_CALL,
                tel: tel,
                cid: cid
            });
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

    }, {
        key: 'getAgentGroupList',
        value: function getAgentGroupList(agroup, type) {
            return this.dispatch({
                op: _OPs2.default.GET_AGENT_GROUP_LIST,
                agroup: agroup,
                type: type
            });
        }

        /**
         * 轉接
         *
         * Disconnect agent's call leg and transfer it to 2nd call
         *
         * @param  {String} cid [call id]
         * @return {Void}
         */

    }, {
        key: 'transfer',
        value: function transfer(cid) {
            return this.mergeCallAction(_MergeCallAction2.default.TRANSFER, cid);
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

    }, {
        key: 'conference',
        value: function conference(cid) {
            return this.mergeCallAction(_MergeCallAction2.default.CONFERENCE, cid);
        }

        /**
         * Disconnect 2nd call and back to talk to customer (1st call)
         *
         * @param  {String} cid [call id]
         * @return {Void}
         */

    }, {
        key: 'disconnectMergeCall',
        value: function disconnectMergeCall(cid) {
            return this.mergeCallAction(_MergeCallAction2.default.DISCONNECT, cid);
        }

        /**
         * This command is used to merge second call into first call.
         * The action indicate the merge behavior to be done.
         *
         * @param  {Number} act [act code]
         * @param  {String} cid [call id]
         * @return {Void}
         */

    }, {
        key: 'mergeCallAction',
        value: function mergeCallAction(act, cid) {
            return this.dispatch({
                op: _OPs2.default.MERGE_CALL_ACTION,
                act: act,
                cid: cid
            });
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

    }, {
        key: 'getDnPerformance',
        value: function getDnPerformance(dn) {
            var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
            var fmt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            return this.dispatch({
                op: _OPs2.default.GET_DN_PERFORMANCE,
                type: type,
                fmt: fmt
            });
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

    }, {
        key: 'getAgentGroupPerformance',
        value: function getAgentGroupPerformance(agroup) {
            var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
            var fmt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            return this.dispatch({
                op: _OPs2.default.GET_AGENT_GROUP_PERFORMANCE_RESPONSE,
                agroup: agroup,
                type: type,
                fmt: fmt
            });
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

    }, {
        key: 'getAgentPerformance',
        value: function getAgentPerformance() {
            var ag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
            var type = arguments[1];

            return this.dispatch({
                op: _OPs2.default.GET_AGENT_PERFORMANCE,
                ag: ag ? ag : this.id,
                type: type
            });
        }

        /**
         * 向 socket 發送訊息
         *
         * @param  {Object} obj
         * @return {Mixed}
         */

    }, {
        key: 'dispatch',
        value: function dispatch(obj) {
            this.seq++;

            if (_lodash2.default.isNil(obj.seq)) {
                obj.seq = this.seq;
            }

            if (this.isDebug) {
                var opDesc = _lodash2.default.find(_OpDescList2.default, { code: obj.op });
                var tail = '';

                if (!_lodash2.default.isNil(obj.act)) {
                    var callActionDesc = _lodash2.default.find(_CallActionDescList2.default, { code: Number(obj.act) });

                    tail = callActionDesc ? ': ' + callActionDesc.desc : ' Unknown';
                }

                opDesc ? console.log(('\n' + opDesc.desc + tail + ' >>>>>>>>>>>>>>').yellow) : console.log(('\nUnknown: (' + obj.op + ')' + tail + ' >>>>>>>>>>>>>>').red);

                console.log(_prettyjson2.default.render(obj));
            }

            return this.connection.send(Agent.genSendStr(obj));
        }
    }, {
        key: 'emit',
        value: function emit(eventName, withData) {
            if (this.bus) {
                this.bus.$emit(eventName, withData);
            }
        }

        /**
         * 組成發送到 socket 的字串
         *
         * @param  {Object} obj
         * @return {String}
         */

    }, {
        key: 'url',
        get: function get() {
            return this.protocol + '://' + this.domain + ':' + this.port;
        }
    }, {
        key: 'ag',
        get: function get() {
            return this.id + '@' + this.centerId;
        }
    }, {
        key: 'auth',
        get: function get() {
            return (0, _md2.default)('' + this.ag + this.nonce + this.password);
        }
    }], [{
        key: 'genSendStr',
        value: function genSendStr(obj) {
            var msg = '';

            for (var prop in obj) {
                msg += prop + '=' + _lodash2.default.get(obj, prop) + '\n';
            }

            return msg;
        }
    }, {
        key: 'events',
        get: function get() {
            return {
                SOCKET_ERROR: 'socket-error',
                SOCKET_CLOSED: 'socket-closed'
            };
        }
    }]);

    return Agent;
}();

exports.default = Agent;