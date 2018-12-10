'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _OPs = require('../OPs');

var _OPs2 = _interopRequireDefault(_OPs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [{
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
    op: _OPs2.default.QUERY_ACD_QUEUED_RESPONSE,
    method: 'queryAcdStateResponseHandler',
    event: 'query-acd-state-response-handler'
}, {
    op: _OPs2.default.SET_CURRNET_AGENT_STATE_RESPONSE,
    method: 'setCurrentAgentStateResponseHandler',
    event: 'set-current-agent-state-response'
}, {
    op: _OPs2.default.MAKE_CALL_RESPONSE,
    method: 'makeCallResponseHandler',
    event: 'make-call-response'
}, {
    op: _OPs2.default.DIAL_DTMF_RESPONSE,
    method: 'dialDtmfResponseHandler',
    event: 'dial-dtmf-response'
}, {
    op: _OPs2.default.GET_AGENT_GROUP_LIST_RESPONSE,
    method: 'getAgentGroupListResponse',
    event: 'get-agent-group-list-response'
}, {
    op: _OPs2.default.CALL_ACTION_RESPONSE,
    method: 'callActionResponseHandler',
    event: 'call-action-response'
}, {
    op: _OPs2.default.GET_DN_STATE_RESPONSE,
    method: 'getDnStateResponseHandler',
    event: 'get-dn-state-response'
}, { // 4040
    op: _OPs2.default.SUPERVISOR_COACH_RESPONSE,
    method: 'unknownHandler',
    event: 'supervisor-coach-response'
}, { // 4041
    op: _OPs2.default.SUPERVISOR_MONITOR_RESPONSE,
    method: 'unknownHandler',
    event: 'supervisor-monitor-response'
}, { // 4042
    op: _OPs2.default.SUPERVISOR_CONFERENCE_RESPONSE,
    method: 'unknownHandler',
    event: 'supervisor-conference-response'
}, { // 4043
    op: _OPs2.default.SUPERVISOR_TRANSFER_RESPONSE,
    method: 'unknownHandler',
    event: 'supervisor-transfer-response'
}, { // 4044
    op: _OPs2.default.SUPERVISOR_TALK_TO_AGENT_RESPONSE,
    method: 'unknownHandler',
    event: 'supervisor-talk-to-agent-response'
}, {
    op: _OPs2.default.GET_DN_PERFORMANCE_RESPONSE, // 4050
    method: 'getDnPerformanceResponse',
    event: 'get-dn-performance-response'
}, {
    op: _OPs2.default.GET_AGENT_PERFORMANCE_RESPONSE, // 4052
    method: 'getAgentPerformanceResponse',
    event: 'get-agent-performance-response'
}, {
    op: _OPs2.default.GET_AGENT_GROUP_PERFORMANCE_RESPONSE, // 4051
    method: 'getAgentGroupPerformanceResponse',
    event: 'get-agent-group-performance-response'
}, {
    op: _OPs2.default.MAKE_2ND_CALL_RESPONSE,
    method: 'make2ndCallResponse',
    event: 'make-2nd-call-response'
}, {
    op: _OPs2.default.MERGE_CALL_ACTION_RESPONSE,
    method: 'mergeCallActionResponse',
    event: 'merge-call-action-response'
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