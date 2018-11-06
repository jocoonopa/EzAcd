'use strict';

var _Handler = require('../../../../src/Utils/EzACD/Response/Handler');

var _Handler2 = _interopRequireDefault(_Handler);

var _OPs = require('../../../../src/Utils/EzACD/OPs');

var _OPs2 = _interopRequireDefault(_OPs);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');

var assert = require('assert');

/**
 * Handler 處理的項目
 * 
 * @type {Array}
 */
var handableOps = [_OPs2.default.CONNECT_TO_ACD_RESPONSE, _OPs2.default.AGENT_LOGIN_RESPONSE, _OPs2.default.AGENT_LOGOUT_RESPONSE, _OPs2.default.CURRENT_AGENT_STATE_RESPONSE, _OPs2.default.MAKE_2ND_CALL_RESPONSE, _OPs2.default.MERGE_CALL_ACTION_RESPONSE, _OPs2.default.QUERY_ACD_QUEUED_RESPONSE, _OPs2.default.SET_CURRNET_AGENT_STATE_RESPONSE, _OPs2.default.MAKE_CALL_RESPONSE, _OPs2.default.DIAL_DTMF_RESPONSE, _OPs2.default.CALL_ACTION_RESPONSE, _OPs2.default.GET_AGENT_GROUP_LIST_RESPONSE, _OPs2.default.GET_DN_STATE_RESPONSE, _OPs2.default.GET_DN_PERFORMANCE_RESPONSE, _OPs2.default.GET_AGENT_PERFORMANCE_RESPONSE, _OPs2.default.GET_AGENT_GROUP_PERFORMANCE_RESPONSE, _OPs2.default.AGENT_STATE_CHANGE_EVENT, _OPs2.default.MESSAGE_RECEIVE_EVENT, _OPs2.default.CALL_STATE_CHANGE_EVENT, _OPs2.default.INCOMING_CALL_EVENT, _OPs2.default.SUPERVISOR_COACH_RESPONSE, _OPs2.default.SUPERVISOR_MONITOR_RESPONSE, _OPs2.default.SUPERVISOR_CONFERENCE_RESPONSE, _OPs2.default.SUPERVISOR_TRANSFER_RESPONSE, _OPs2.default.SUPERVISOR_TALK_TO_AGENT_RESPONSE];

describe('Handler 單元測試', function () {
    var busStub = {
        '$emit': function $emit() {}
    };

    var busSpy = _sinon2.default.spy(busStub, '$emit');

    var handlerInstance = new _Handler2.default({}, busStub);

    describe('檢查 handler 是否存在', function () {
        handableOps.forEach(function (op) {
            it(op + ' \u78BA\u8A8D\u5B58\u5728\u5C0D\u61C9 handler function', function () {
                var methodName = _.find(handlerInstance.cbs, { op: Number(op) }).method;

                assert.equal(_.isFunction(handlerInstance[methodName]), true);
            });
        });
    });

    describe('檢查 handler function 內部動作', function () {
        handlerInstance.cbs.forEach(function (cb) {
            it('\u6AA2\u67E5 ' + cb.method + ' \u662F\u5426\u6709\u547C\u53EB bus.$emit()', function () {
                var testString = "atype=98\n";

                handlerInstance[cb.method](testString);

                assert.ok(busStub.$emit.calledOnce);

                busSpy.resetHistory();
            });
        });

        it('\u6AA2\u67E5 unknownHandler \u662F\u5426\u6709\u547C\u53EB bus.$emit()', function () {
            var testString = 'string';

            handlerInstance.unknownHandler(testString);

            assert.ok(busStub.$emit.calledOnce);

            busSpy.resetHistory();
        });
    });
});