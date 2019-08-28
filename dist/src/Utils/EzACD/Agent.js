'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _BridgeService = require('../BridgeService');

var _BridgeService2 = _interopRequireDefault(_BridgeService);

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

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Agent = function (_Bridge) {
    _inherits(Agent, _Bridge);

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
    function Agent(_ref) {
        var port = _ref.port,
            domain = _ref.domain,
            id = _ref.id,
            ext = _ref.ext,
            password = _ref.password,
            centerId = _ref.centerId,
            ssl = _ref.ssl,
            subProtocol = _ref.subProtocol;
        var bus = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var isDebug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var mockConnection = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

        _classCallCheck(this, Agent);

        var _this = _possibleConstructorReturn(this, (Agent.__proto__ || Object.getPrototypeOf(Agent)).call(this));

        _this.port = port;
        _this.domain = domain;
        _this.id = id;
        _this.password = password;
        _this.centerId = centerId;
        _this.ext = ext;
        _this.cid = null;
        _this.protocol = ssl ? 'wss' : 'ws';
        _this.isDebug = isDebug;
        _this.subProtocol = subProtocol;

        _this.initSocket(mockConnection);

        /* init by self */
        _this.seq = 0;
        _this.state = null;
        _this.callState = null;
        _this.hasClosed = false;
        _this.bus = bus;

        _this.handler = new _Handler2.default(_this, bus, isDebug);
        return _this;
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
            var _this2 = this;

            this.connection = mockConnection;

            this.connection.on('message', function (message) {
                return _this2.handler.receive(message);
            });
        }
    }, {
        key: 'initNodeSocket',
        value: function initNodeSocket() {
            var _this3 = this;

            this.socket = new _websocket.client();

            if (this.isDebug) {
                console.log(('\n' + this.url + '\n\n').yellow);
            }

            this.socket.connect(this.url, this.subProtocol);

            this.socket.on('connect', function (connection) {
                _this3.connection = connection;

                connection.on('message', function (message) {
                    _this3.handler.receive(message);
                });

                connection.on('error', function (error) {
                    if (_this3.isDebug) {
                        console.log(('Connection Error: ' + error.toString()).red);
                    }

                    _this3.emit(_BridgeService2.default.events.SOCKET_ERROR, {
                        message: 'Connection Error: ' + error.toString()
                    });
                });

                connection.on('close', function () {
                    _this3.hasClosed = true;

                    if (_this3.isDebug) {
                        console.log('echo-protocol Client Closed'.cyan);
                    }

                    _this3.emit(_BridgeService2.default.events.SOCKET_CLOSED, {
                        message: 'echo-protocol Client Closed'
                    });
                });

                _this3.authorize();
            });
        }
    }, {
        key: 'onOpen',
        value: function onOpen() {
            this.authorize();
        }
    }, {
        key: 'onMessage',
        value: function onMessage(message) {
            this.handler.receive(message);
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
         * @param  {String}  cdata  [CTI data for this call, this CTI data will overwrite the
        existing one)]
         * @return {Void}
         */

    }, {
        key: 'make2ndCall',
        value: function make2ndCall(tel, cid, cdata) {
            return this.dispatch({
                op: _OPs2.default.MAKE_2ND_CALL,
                tel: tel,
                cid: cid,
                cdata: cdata
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
         * @param  {Number} type [0 ~ 6 p23]
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
        value: function mergeCallAction(act, cid, cdata) {
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
         * Supervisor Coach (3040)
         *
         * This command is for supervisor only.
         * It will start the coach with the selected agent.
         * This command is normally used after [Supervisor Monitor Request].
         *
         * @param  {String} agext
         * @return {Void}
         */

    }, {
        key: 'supervisorCoach',
        value: function supervisorCoach(agext) {
            return this.dispatch({
                op: _OPs2.default.SUPERVISOR_COACH,
                agext: agext
            });
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

    }, {
        key: 'supervisorMonitor',
        value: function supervisorMonitor(agext) {
            return this.dispatch({
                op: _OPs2.default.SUPERVISOR_MONITOR,
                agext: agext
            });
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

    }, {
        key: 'supervisorConference',
        value: function supervisorConference(agext) {
            return this.dispatch({
                op: _OPs2.default.SUPERVISOR_CONFERENCE,
                agext: agext
            });
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

    }, {
        key: 'supervisorTransfer',
        value: function supervisorTransfer(agext) {
            return this.dispatch({
                op: _OPs2.default.SUPERVISOR_TRANSFER,
                agext: agext
            });
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

    }, {
        key: 'supervisorTalkToAgent',
        value: function supervisorTalkToAgent(agext) {
            return this.dispatch({
                op: _OPs2.default.SUPERVISOR_TALK_TO_AGENT,
                agext: agext
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
                op: _OPs2.default.GET_AGENT_GROUP_PERFORMANCE,
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
    }]);

    return Agent;
}(_BridgeService2.default);

exports.default = Agent;