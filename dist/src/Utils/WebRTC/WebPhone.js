'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _websocket = require('websocket');

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

var _jsaes = require('./jsaes');

var _BridgeService = require('../BridgeService');

var _BridgeService2 = _interopRequireDefault(_BridgeService);

var _Adapter = require('../Adapter');

var _Adapter2 = _interopRequireDefault(_Adapter);

var _commandList = require('./commandList');

var _commandList2 = _interopRequireDefault(_commandList);

var _responseList = require('./responseList');

var _responseList2 = _interopRequireDefault(_responseList);

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
            port = _ref.port,
            isSsl = _ref.isSsl;
        var bus = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var isDebug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        _classCallCheck(this, WebPhone);

        var _this = _possibleConstructorReturn(this, (WebPhone.__proto__ || Object.getPrototypeOf(WebPhone)).call(this));

        _this.port = port;
        _this.domain = domain;
        _this.ext = ext;
        _this.password = password;
        _this.centerId = centerId;
        _this.protocol = isSsl ? 'wss' : 'ws';
        _this.subProtocol = 'web-call-protocol';
        _this.bus = bus;
        _this.seq = 0;
        _this.hasClosed = false;

        _this.nonce = null;
        _this.callId = null;
        _this.callType = '';
        _this.callState = null;
        _this.muteState = null;
        _this.remoteSdp = null;
        _this.localSdp = null;
        _this.localPeerConnection = null;
        _this.remoteAudio = null;
        _this.localStream = null;
        _this.remoteStream = null;

        _this.isDebug = isDebug;
        _this.commandList = _commandList2.default;
        _this.responseList = _responseList2.default;

        _this.initBrowserSocket();
        return _this;
    }

    _createClass(WebPhone, [{
        key: 'onError',
        value: function onError(error) {
            this.connection.close();

            this.emit(_BridgeService2.default.events.WEBRTC_SOCKET_ERROR, {
                message: 'Webrtc connection Error: ' + error.toString()
            });
        }
    }, {
        key: 'onClose',
        value: function onClose() {
            this.hasClosed = true;

            this.emit(_BridgeService2.default.events.WEBRTC_SOCKET_CLOSED, {
                message: 'Webrtc client closed'
            });
        }
    }, {
        key: 'isIncoming',
        value: function isIncoming() {
            return _lodash2.default.eq(this.callType, 'incoming');
        }
    }, {
        key: 'isOutgoing',
        value: function isOutgoing() {
            return _lodash2.default.eq(this.callType, 'outgoing');
        }
    }, {
        key: 'onMessage',
        value: function onMessage(event) {
            var data = event.data || event.utf8Data;
            var obj = _Adapter2.default.toObj(data);
            var op = Number(_lodash2.default.get(obj, 'op'));
            var seq = Number(_lodash2.default.get(obj, 'seq'));

            if (this.isDebug) {
                var opDesc = _lodash2.default.find(this.responseList, { code: op });

                opDesc ? console.log(('\n<<<<<<<<<<<<<< ' + opDesc.desc).cyan) : console.log(('\n<<<<<<<<<<<<<< Unknown (' + op + ')').cyan);

                console.log(_prettyjson2.default.render(obj));
            }

            switch (op) {
                /* Connected to WebRTC server */
                case 2000:
                    this.connectWebRTCServerCallback(obj);
                    break;

                case 2006:
                    this.answerCall(obj);
                    break;

                /**
                 * Register Status Event
                 * Proxy Register Status Event:
                 *
                 * op=9001
                 * seq=xxx
                 * state=xxxx
                 * (0: Registered, -1: Unregistered, -2: Request Timeout, -3: Contact Updated, -xxx: sip
                 * reason code)
                 *
                **/
                case 9001:
                    this.registerStatusCallback(obj);
                    break;

                case 9002:
                    this.incomingCallRinging(obj);
                    break;

                case 9004:
                    this.callStateChangeCallback(obj);
                    break;

                case 9008:
                    this.resetChannel();
                    break;

                case 9009:
                    this.notifyToAnswer();
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
            this.nonce = _lodash2.default.get(obj, 'nonce');
            var secret = 'x%6a8';
            var key = this.initEncrypt('' + secret + this.nonce + this.ext);
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
        key: 'registerStatusCallback',
        value: function registerStatusCallback(obj) {
            this.emit('sip-registed', obj);
        }
    }, {
        key: 'incomingCallRinging',
        value: function incomingCallRinging(obj) {
            var _this2 = this;

            this.callId = _lodash2.default.get(obj, 'cid');
            this.callType = 'incoming';
            this.remoteSdp = this.getSdp(global.EZACD_tmp_data);

            return setTimeout(function () {
                _this2.dispatch({
                    op: 1006,
                    cid: _lodash2.default.get(obj, 'cid'),
                    seq: _this2.seq
                });
            }, 100);
        }
    }, {
        key: 'resetChannel',
        value: function resetChannel() {
            this.mutecontrol(true);
            this.mutecontrol(false);
        }
    }, {
        key: 'notifyToAnswer',
        value: function notifyToAnswer() {
            if (_lodash2.default.eq(Number(this.callState), WebPhone.CALL_STATES.RING)) {
                this.answerCall();
            }
        }
    }, {
        key: 'getSdp',
        value: function getSdp(msg) {
            var idx = msg.indexOf('sdp=');

            if (0 < idx) {
                return msg.substring(idx + 4);
            }

            return '';
        }
    }, {
        key: 'gotRemoteDescription',
        value: function gotRemoteDescription(sdp) {
            var params = {
                type: this.isOutgoing() ? 'answer' : 'offer',
                sdp: sdp
            };

            this.localPeerConnection.setRemoteDescription(new RTCSessionDescription(params), this.setRemoteSuccess.bind(this));
        }
    }, {
        key: 'setRemoteSuccess',
        value: function setRemoteSuccess() {
            if (this.isIncoming()) {
                this.localPeerConnection.createAnswer(this.setLocalDescription.bind(this), function (e) {
                    console.log(e);
                    console.log(e.message);
                });
            }
        }
    }, {
        key: 'setLocalDescription',
        value: function setLocalDescription(description) {
            if (this.isIncoming()) {
                description.sdp = this.replaceString(description.sdp, 'a=setup:active', 'a=setup:passive');
            }

            this.localSdp = description.sdp;

            this.localPeerConnection.setLocalDescription(description, this.setLocalDescriptionSuccess.bind(this), function (e) {
                console.error(e);
                console.error(e.message);
            });
        }
    }, {
        key: 'setLocalDescriptionSuccess',
        value: function setLocalDescriptionSuccess() {
            return this.isIncoming() ? this.dispatchAnswerCallCommand(this.localSdp) : this.dispatchMakeCallCommand(this.localSdp);
        }
    }, {
        key: 'callStateChangeCallback',
        value: function callStateChangeCallback(obj) {
            this.callId = _lodash2.default.get(obj, 'cid');
            this.callState = _lodash2.default.get(obj, 'state');

            switch (Number(this.callState)) {
                case WebPhone.CALL_STATES.DISCONNECT:
                    this.closePeerConnection();

                    this.callType = null;
                    this.called = null;
                    this.localSdp = null;
                    this.remoteSdp = null;
                    this.muteState = false;
                    break;

                case WebPhone.CALL_STATES.RING:
                    break;

                case WebPhone.CALL_STATES.CONNECT:
                    this.mutecontrol(false);
                    break;

                case WebPhone.CALL_STATES.LOCAL_HOLD:
                    this.mutecontrol(true);
                    break;

                case WebPhone.CALL_STATES.REMOTE_HOLD:
                    this.mutecontrol(true);
                    break;
            }
        }
    }, {
        key: 'closePeerConnection',
        value: function closePeerConnection() {
            this.localPeerConnection.close();

            if (0 < this.localStream.getAudioTracks().length) {
                this.localStream.getAudioTracks()[0].stop();
            }

            this.localPeerConnection = null;
        }

        /**
         *  answerCall setLocalDescriptionSuccess
         *
         * @param  {String} sdp
         * @return void
         */

    }, {
        key: 'dispatchAnswerCallCommand',
        value: function dispatchAnswerCallCommand(sdp) {
            return this.dispatch({
                op: 1004,
                cid: this.callId,
                seq: this.seq,
                sdp: sdp
            });
        }

        /**
         * 應該用不到
         *
         * make-call 應該都是ㄧ
         */

    }, {
        key: 'dispatchMakeCallCommand',
        value: function dispatchMakeCallCommand(to, sdp) {
            return this.dispatch({
                op: 1003,
                disp: this.tel,
                from: this.tel,
                to: this.called,
                sdp: sdp
            });
        }
    }, {
        key: 'replaceString',
        value: function replaceString(str, repstr, repwith) {
            var idx = 0 - repstr.length;
            var idx1 = 0;
            var result = '';

            if (str != null) {
                while (true) {
                    idx = str.indexOf(repstr, idx + repstr.length);

                    if (idx >= 0) {
                        result += str.substring(idx1, idx);
                        result += repwith;
                        idx1 = idx + repstr.length;
                    } else {
                        if (idx1 < str.length) {
                            result += str.substring(idx1);
                        }

                        break;
                    }
                }
            }

            return result;
        }
    }, {
        key: 'gotLocalIceCandidate',
        value: function gotLocalIceCandidate(event) {
            if (event.candidate) {
                if (event.candidate.candidate.indexOf(' tcp ') < 0) {
                    this.localSdp += 'a=' + event.candidate.candidate + "\n";
                }
            }
        }
    }, {
        key: 'gotRemoteStream',
        value: function gotRemoteStream(event) {
            this.remoteStream = event.streams ? event.streams[0] : event.stream;
            this.remoteAudio = document.getElementById('remoteAudio');

            _lodash2.default.set(this.remoteAudio, 'srcObject', this.remoteStream);
        }
    }, {
        key: 'gotStream',
        value: function gotStream(stream) {
            this.localStream = stream;
            this.localAudio = document.getElementById('localAudio');

            // Samuel:
            //
            // Hi Karick:
            // 新版 Firefox WebRTC 在webrtc 會出現沒有聲音的問題,
            // 如果你們有客戶需要使用Firefox Webrtc, 你們改寫的webrtc 需要修改如下:
            // 要取得本地端媒體(mic，camera)的時候會呼叫navigator.mediaDevices.getUserMedia，
            // 取得成功之後會呼叫gotStream function,在gotStream function裡面會有
            // localAudio.srcObject = stream;
            //
            // 將這一行移除即可
            // 我建議依此修改會比較沒有相容性的問題
            //
            // @jocoonopa 2020-06-12
            // this.localAudio.srcObject = stream

            var configuration = {
                iceServers: []
            };

            var pcConstraints = {
                optional: [{
                    DtlsSrtpKeyAgreement: true
                }]
            };

            this.localPeerConnection = new RTCPeerConnection(configuration, pcConstraints);

            this.localPeerConnection.onicecandidate = this.gotLocalIceCandidate.bind(this);

            this.localPeerConnection.ontrack = this.gotRemoteStream.bind(this);

            this.localPeerConnection.addStream(this.localStream);

            if (this.isOutgoing()) {
                this.localPeerConnection.createOffer(this.setLocalDescription.bind(this), function () {});
            } else {
                var rtcSessionDescription = new RTCSessionDescription({
                    'type': 'offer',
                    'sdp': this.remoteSdp
                });

                this.localPeerConnection.setRemoteDescription(rtcSessionDescription, this.setRemoteSuccess.bind(this), function (e) {
                    console.log(e);
                    console.error(e.message);
                });
            }
        }
    }, {
        key: 'answerCall',
        value: function answerCall() {
            navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(this.gotStream.bind(this)).catch(function (e) {
                return console.error(e);
            });
        }
    }, {
        key: 'mutecontrol',
        value: function mutecontrol(muteState) {
            if (0 < this.localStream.getAudioTracks().length) {
                this.localStream.getAudioTracks()[0].enabled = !muteState;
            }

            if (0 < this.remoteStream.getAudioTracks().length) {
                this.remoteStream.getAudioTracks()[0].enabled = !muteState;
            }

            this.muteState = muteState;
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
        key: 'CALL_STATES',
        get: function get() {
            //0: Disconnected 1: Ring, 2: Connected  3:local hold  4:Remote Hold
            return {
                DISCONNECT: 0,
                RING: 1,
                CONNECT: 2,
                LOCAL_HOLD: 3,
                REMOTE_HOLD: 4
            };
        }
    }, {
        key: 'encryptLength',
        get: function get() {
            return 16;
        }
    }]);

    return WebPhone;
}(_BridgeService2.default);

exports.default = WebPhone;