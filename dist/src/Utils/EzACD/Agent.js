'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Adapter = require('./Response/Adapter');

var _Adapter2 = _interopRequireDefault(_Adapter);

var _Handler = require('./Response/Handler');

var _Handler2 = _interopRequireDefault(_Handler);

var _websocket = require('websocket');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _OPs = require('./OPs');

var _OPs2 = _interopRequireDefault(_OPs);

var _CallAction = require('./CallAction');

var _CallAction2 = _interopRequireDefault(_CallAction);

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
    * @param  {Object} bus              [Vue instance]
    * @return {Void}
    */
    function Agent(_ref, bus) {
        var port = _ref.port,
            domain = _ref.domain,
            id = _ref.id,
            ext = _ref.ext,
            password = _ref.password,
            centerId = _ref.centerId;

        _classCallCheck(this, Agent);

        this.port = port;
        this.domain = domain;
        this.id = id;
        this.password = password;
        this.centerId = centerId;
        this.ext = ext;
        this.state = null;
        this.cid = null;

        this.initSocket();

        /* init by self */
        this.seq = 0;
        this.handler = new _Handler2.default(this, bus);
    }

    /**
     * 建立 websocket
     *
     * @return {Void}
     */


    _createClass(Agent, [{
        key: 'initSocket',
        value: function initSocket() {
            var _this = this;

            this.socket = new _websocket.client();

            this.socket.connect(this.url, 'cti-agent-protocol');

            this.socket.on('connect', function (connection) {

                _this.connection = connection;

                connection.on('message', function (message) {
                    _this.handler.receive(message);
                });

                connection.on('error', function (error) {
                    console.log("Connection Error: " + error.toString());
                });

                connection.on('close', function () {
                    console.log('echo-protocol Connection Closed');
                });

                _this.authorize();
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
                //dn: this.ext,
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
            return this.callAction(_CallAction2.default.HILD);
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

            console.log(prettyjson.render(obj));

            console.log("send:  \n".yellow + Agent.genSendStr(obj));

            return this.connection.send(Agent.genSendStr(obj));
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
            return md5('' + this.ag + this.nonce + this.password);
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
    }]);

    return Agent;
}();

exports.default = Agent;