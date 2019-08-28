'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _websocket = require('websocket');

var _jsaes = require('./jsaes');

var _BridgeService = require('../BridgeService');

var _BridgeService2 = _interopRequireDefault(_BridgeService);

var _Adapter = require('../Adapter');

var _Adapter2 = _interopRequireDefault(_Adapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WebPhone = function (_Bridge) {
    _inherits(WebPhone, _Bridge);

    function WebPhone(_ref) {
        var domain = _ref.domain,
            ext = _ref.ext,
            password = _ref.password,
            centerId = _ref.centerId,
            isSsl = _ref.isSsl;
        var bus = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var isDebug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        _classCallCheck(this, WebPhone);

        var _this = _possibleConstructorReturn(this, (WebPhone.__proto__ || Object.getPrototypeOf(WebPhone)).call(this));

        _this.port = isSsl ? 2081 : 2082;
        _this.domain = domain;
        _this.ext = ext;
        _this.password = password;
        _this.centerId = centerId;
        _this.protocol = isSsl ? 'wss' : 'ws';
        _this.subProtocol = 'web-call-protocol';
        _this.bus = bus;
        _this.seq = 0;
        _this.hasClosed = false;

        _this.initBrowserSocket();
        return _this;
    }

    _createClass(WebPhone, [{
        key: 'onMessage',
        value: function onMessage(event) {
            var data = event.data || event.utf8Data;
            var obj = _Adapter2.default.toObj(data);
            var op = Number(_lodash2.default.get(obj, 'op'));
            var seq = Number(_lodash2.default.get(obj, 'seq'));

            switch (op) {
                case 2000:
                    this.connectWebRTCServerCallback(obj);
                    break;

                // Register Status Event
                // Proxy Register Status Event:
                //
                // op=9001
                // seq=xxx
                // state=xxxx
                // (0: Registered, -1: Unregistered, -2: Request Timeout, -3: Contact Updated, -xxx: sip
                // reason code)
                case 9001:
                    this.registerSipCallback(obj);
                    break;
            }
        }
    }, {
        key: 'onOpen',
        value: function onOpen() {
            this.emit(WebPhone.events.WEBRTC_OPEN);

            this.connectWebRTCServer();
        }
    }, {
        key: 'connectWebRTCServer',
        value: function connectWebRTCServer(seq) {
            return this.dispatch({
                op: 1000,
                seq: seq
            });
        }
    }, {
        key: 'connectWebRTCServerCallback',
        value: function connectWebRTCServerCallback(obj) {
            var nonce = _lodash2.default.get(obj, 'nonce');
            var secret = 'x%6a8';
            var key = this.initEncrypt('' + secret + nonce + this.ext);
            var pwd = this.encryptLongString(this.password, key);

            (0, _jsaes.AES_Done)();

            this.dispatch({
                op: 1001,
                seq: this.seq,
                usr: this.ext,
                tel: this.ext,
                pwd: pwd
            });
        }
    }, {
        key: 'registerSipCallback',
        value: function registerSipCallback(obj) {
            this.emit('sip-registed', obj);
        }
    }, {
        key: 'initEncrypt',
        value: function initEncrypt(myKey) {
            myKey = WebPhone.encryptLength < myKey.length ? myKey.substring(0, WebPhone.encryptLength) : myKey = _lodash2.default.padEnd(myKey, WebPhone.encryptLength, ' ');

            var key = this.string2Bin(myKey);

            (0, _jsaes.AES_Init)();
            (0, _jsaes.AES_ExpandKey)(key);

            return key;
        }
    }, {
        key: 'encrypt',
        value: function encrypt(inputStr, key) {
            var block = this.string2Bin(inputStr);
            var data = '';

            (0, _jsaes.AES_Encrypt)(block, key);

            for (var i = 0; i < block.length; i++) {
                data += this.formatHexStr(block[i]);
            }

            return data;
        }
    }, {
        key: 'formatHexStr',
        value: function formatHexStr(num) {
            var str = num.toString(WebPhone.encryptLength);

            return _lodash2.default.padStart(str, 2, 0);
        }
    }, {
        key: 'encryptLongString',
        value: function encryptLongString(orgStr, key) {
            if (WebPhone.encryptLength > orgStr.length) {
                return this.encrypt(orgStr, key);
            }

            var data = '';

            for (var i = 0; i < orgStr.length; i = i + 16) {
                data += this.encrypt(orgStr.substr(i, WebPhone.encryptLength), key);
            }

            return data;
        }
    }, {
        key: 'string2Bin',
        value: function string2Bin(str) {
            var result = [];

            for (var i = 0; i < str.length; i++) {
                result.push(str.charCodeAt(i));
            }

            return result;
        }
    }], [{
        key: 'encryptLength',
        get: function get() {
            return 16;
        }
    }]);

    return WebPhone;
}(_BridgeService2.default);

exports.default = WebPhone;