'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _OPs = require('./OPs');

var _OPs2 = _interopRequireDefault(_OPs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [{
    code: _OPs2.default.CONNECT_TO_ACD,
    desc: 'CONNECT-TO-ACD'
}, {
    code: _OPs2.default.CONNECT_TO_ACD_RESPONSE,
    desc: 'CONNECT-TO-ACD-RESPONSE'
}, {
    code: _OPs2.default.AGENT_LOGIN,
    desc: 'AGENT-LOGIN'
}, {
    code: _OPs2.default.AGENT_LOGIN_RESPONSE,
    desc: 'AGENT-LOGIN-RESPONSE'
}, {
    code: _OPs2.default.AGENT_LOGOUT,
    desc: 'AGENT-LOGOUT'
}, {
    code: _OPs2.default.AGENT_LOGOUT_RESPONSE,
    desc: 'AGENT-LOGOUT-RESPONSE'
}, {
    code: _OPs2.default.GET_CURRENT_AGENT_STATE,
    desc: 'GET-CURRENT-AGENT-STATE'
}, {
    code: _OPs2.default.CURRENT_AGENT_STATE_RESPONSE,
    desc: 'CURRENT-AGENT-STATE-RESPONSE'
}, {
    code: _OPs2.default.SET_CURRNET_AGENT_STATE,
    desc: 'SET-CURRNET-AGENT-STATE'
}, {
    code: _OPs2.default.SET_CURRNET_AGENT_STATE_RESPONSE,
    desc: 'SET-CURRNET-AGENT-STATE-RESPONSE'
}, {
    code: _OPs2.default.MAKE_CALL,
    desc: 'MAKE-CALL'
}, {
    code: _OPs2.default.MAKE_CALL_RESPONSE,
    desc: 'MAKE-CALL-RESPONSE'
}, {
    code: _OPs2.default.DIAL_DTMF,
    desc: 'DIAL-DTMF'
}, {
    code: _OPs2.default.DIAL_DTMF_RESPONSE,
    desc: 'DIAL-DTMF-RESPONSE'
}, {
    code: _OPs2.default.CALL_ACTION,
    desc: 'CALL-ACTION'
}, {
    code: _OPs2.default.CALL_ACTION_RESPONSE,
    desc: 'CALL-ACTION-RESPONSE'
}, {
    code: _OPs2.default.AGENT_STATE_CHANGE_EVENT,
    desc: 'AGENT-STATE-CHANGE-EVENT'
}, {
    code: _OPs2.default.MESSAGE_RECEIVE_EVENT,
    desc: 'MESSAGE-RECEIVE-EVENT'
}, {
    code: _OPs2.default.CALL_STATE_CHANGE_EVENT,
    desc: 'CALL-STATE-CHANGE-EVENT'
}, {
    code: _OPs2.default.INCOMING_CALL_EVENT,
    desc: 'INCOMING-CALL-EVENT'
}];