'use strict';

var _Agent = require('../../src/Utils/EzACD/Agent');

var _Agent2 = _interopRequireDefault(_Agent);

var _Adapter = require('../../src/Utils/EzACD/Response/Adapter');

var _Adapter2 = _interopRequireDefault(_Adapter);

var _mockSocket = require('mock-socket');

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');

var assert = require('assert');

describe('Agent 單元測試', function () {
    global.config = require('../../src/config.json');
    var fakeURL = 'ws://localhost:8080';
    var mockServer = new _mockSocket.Server(fakeURL);
    var socketStub = new _mockSocket.SocketIO(fakeURL);

    socketStub.send = function (message) {
        socketStub.emit('message', message);
    };
    socketStub.connect = function () {};

    var agent = null;
    var publicMethods = ['login', 'logout', 'getState', 'setState', 'makeCall', 'dialDtmf', 'hold', 'answer', 'disconnect', 'mute', 'cancel', 'getDnState', 'getAgentGroupList', 'getAgentPerformance', 'getAgentGroupPerformance', 'getDnPerformance', 'queryAcdQueued', 'make2ndCall', 'transfer', 'conference', 'disconnectMergeCall', 'supervisorCoach', 'supervisorMonitor', 'supervisorConference', 'supervisorTransfer', 'supervisorTalkToAgent'];

    var spyAgent = null;

    before(function () {
        mockServer.on('connection', function (socket) {
            socket.on('message', function (data) {
                var obj = _Adapter2.default.toObj(data);

                assert.ok(_.has(obj, 'op'));
            });
        });

        agent = new _Agent2.default({
            port: config.port,
            domain: config.domain,
            id: config.id,
            ext: config.ext,
            password: config.password,
            centerId: config.center_id,
            ssl: config.ssl
        }, null, false, socketStub);

        spyAgent = _sinon2.default.spy(agent, 'dispatch');
    });

    describe('Socket message send', function () {
        publicMethods.forEach(function (publicMethod) {
            it('\u6E2C\u8A66 ' + publicMethod + ' \u662F\u5426\u6700\u5F8C\u6709\u628A\u8A0A\u606F\u767C\u9001\u5230 socket \u4E0A', function (done) {
                agent[publicMethod]();

                assert.equal(agent.dispatch.calledOnce, true);

                agent.dispatch.resetHistory();

                done();
            });
        });
    });

    describe('測試物件轉字串是否正確', function () {
        it('測試 genSendStr 方法', function () {
            var inputObj = {
                a: 'b',
                c: 'd',
                e: 'f'
            };

            var resultString = _Agent2.default.genSendStr(inputObj);

            assert.equal(resultString, "a=b\nc=d\ne=f\n");
        });
    });

    describe('參數屬性測試', function () {
        it('檢查 url 組合是否正確', function () {
            assert.equal(agent.url, agent.protocol + '://' + agent.domain + ':' + agent.port);
        });

        it('檢查 auth 組合是否正確', function () {
            assert.equal(agent.auth, (0, _md2.default)('' + agent.ag + agent.nonce + agent.password));
        });
    });
});