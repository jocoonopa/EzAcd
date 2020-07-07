'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _CallActionDescList = require('./EzACD/CallActionDescList');

var _CallActionDescList2 = _interopRequireDefault(_CallActionDescList);

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

var _websocket = require('websocket');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BridgeService = function () {
    function BridgeService() {
        _classCallCheck(this, BridgeService);
    }

    _createClass(BridgeService, [{
        key: 'initBrowserSocket',
        value: function initBrowserSocket() {
            this.connection = new _websocket.w3cwebsocket(this.url, this.subProtocol);

            this.connection.onerror = this.onError.bind(this);

            this.connection.onopen = this.onOpen.bind(this);

            this.connection.onclose = this.onClose.bind(this);

            this.connection.onmessage = this.onMessage.bind(this);
        }
    }, {
        key: 'onError',
        value: function onError(error) {
            this.connection.close();

            this.emit(BridgeService.events.SOCKET_ERROR, {
                message: 'Connection Error: ' + error.toString()
            });
        }
    }, {
        key: 'onClose',
        value: function onClose() {
            this.hasClosed = true;

            this.emit(BridgeService.events.SOCKET_CLOSED, {
                message: 'echo-protocol Client Closed'
            });
        }
    }, {
        key: 'onOpen',
        value: function onOpen() {}
    }, {
        key: 'onMessage',
        value: function onMessage(message) {}

        /**
         * 向 socket 發送訊息
         *
         * @param  {Object} obj
         * @return {Mixed}
         */

    }, {
        key: 'dispatch',
        value: function dispatch(obj) {
            var str = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            this.seq++;

            if (_lodash2.default.isNil(obj.seq)) {
                obj.seq = this.seq;
            }

            if (this.isDebug) {
                this.displayDebugMessage(obj);
            }

            str = str ? str : BridgeService.genSendStr(obj);

            return this.hasClosed ? null : this.connection.send(str);
        }
    }, {
        key: 'displayDebugMessage',
        value: function displayDebugMessage(obj) {
            var opDesc = _lodash2.default.find(this.commandList, { code: obj.op });
            var tail = '';

            if (!_lodash2.default.isNil(obj.act)) {
                var callActionDesc = _lodash2.default.find(_CallActionDescList2.default, { code: Number(obj.act) });

                tail = callActionDesc ? ': ' + callActionDesc.desc : ' Unknown';
            }

            opDesc ? console.log(('\n' + opDesc.desc + tail + ' >>>>>>>>>>>>>>').yellow) : console.log(('\nUnknown: (' + obj.op + ')' + tail + ' >>>>>>>>>>>>>>').red);

            console.log(_prettyjson2.default.render(obj));
        }
    }, {
        key: 'destroyConnection',
        value: function destroyConnection() {
            if (_lodash2.default.isNil(this.connection)) {
                return;
            }

            this.connection.close();
            this.connection = null;
        }
    }, {
        key: 'emit',
        value: function emit(eventName, withData) {
            if (this.bus) {
                this.bus.$emit(eventName, withData);
            }
        }
    }, {
        key: 'url',
        get: function get() {
            return this.protocol + '://' + this.domain + ':' + this.port;
        }
    }], [{
        key: 'genSendStr',


        /**
         * 組成發送到 socket 的字串
         *
         * @param  {Object} obj
         * @return {String}
         */
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
                ACD_SOCKET_ERROR: 'acd-socket-error',
                ACD_SOCKET_CLOSED: 'acd-socket-closed',
                WEBRTC_SOCKET_ERROR: 'webrtc-socket-error',
                WEBRTC_SOCKET_CLOSED: 'webrtc-socket-closed',
                WEBRTC_OPEN: 'webrtc-opened'
            };
        }
    }]);

    return BridgeService;
}();

exports.default = BridgeService;