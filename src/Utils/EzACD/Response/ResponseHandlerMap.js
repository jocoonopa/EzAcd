import OPS from '../OPs'

export default [
    {
        op: OPS.CONNECT_TO_ACD_RESPONSE,
        method: 'authResponseHandler',
        event: 'auth',
    },

    {
        op: OPS.AGENT_LOGIN_RESPONSE,
        method: 'loginResponseHandler',
        event: 'login',
    },

    {
        op: OPS.AGENT_LOGOUT_RESPONSE,
        method: 'logoutResponseHandler',
        event: 'logout',
    },

    {
        op: OPS.CURRENT_AGENT_STATE_RESPONSE,
        method: 'currentAgentStateResponseHandler',
        event: 'get-current-agent-state',
    },

    {
        op: OPS.QUERY_ACD_QUEUED_RESPONSE,
        method: 'queryAcdStateResponseHandler',
        event: 'query-acd-state-response-handler',
    },

    {
        op: OPS.SET_CURRNET_AGENT_STATE_RESPONSE,
        method: 'setCurrentAgentStateResponseHandler',
        event: 'set-current-agent-state-response',
    },

    {
        op: OPS.MAKE_CALL_RESPONSE,
        method: 'makeCallResponseHandler',
        event: 'make-call-response',
    },

    {
        op: OPS.DIAL_DTMF_RESPONSE,
        method: 'dialDtmfResponseHandler',
        event: 'dial-dtmf-response',
    },

    {
        op: OPS.GET_AGENT_GROUP_LIST_RESPONSE,
        method: 'getAgentGroupListResponse',
        event: 'get-agent-group-list-response',
    },

    {
        op: OPS.CALL_ACTION_RESPONSE,
        method: 'callActionResponseHandler',
        event: 'call-action-response',
    },

    {
        op: OPS.GET_DN_STATE_RESPONSE,
        method: 'getDnStateResponseHandler',
        event: 'get-dn-state-response',
    },

    {// 4040
        op: OPS.SUPERVISOR_COACH_RESPONSE,
        method: 'unknownHandler',
        event: 'supervisor-coach-response',
    },

    {// 4041
        op: OPS.SUPERVISOR_MONITOR_RESPONSE,
        method: 'unknownHandler',
        event: 'supervisor-monitor-response',
    },

    {// 4042
        op: OPS.SUPERVISOR_CONFERENCE_RESPONSE,
        method: 'unknownHandler',
        event: 'supervisor-conference-response',
    },

    {// 4043
        op: OPS.SUPERVISOR_TRANSFER_RESPONSE,
        method: 'unknownHandler',
        event: 'supervisor-transfer-response',
    },

    {// 4044
        op: OPS.SUPERVISOR_TALK_TO_AGENT_RESPONSE,
        method: 'unknownHandler',
        event: 'supervisor-talk-to-agent-response',
    },

    {
        op: OPS.GET_DN_PERFORMANCE_RESPONSE, // 4050
        method: 'getDnPerformanceResponse',
        event: 'get-dn-performance-response',
    },

    {
        op: OPS.GET_AGENT_PERFORMANCE_RESPONSE, // 4052
        method: 'getAgentPerformanceResponse',
        event: 'get-agent-performance-response',
    },

    {
        op: OPS.GET_AGENT_GROUP_PERFORMANCE_RESPONSE, // 4051
        method: 'getAgentGroupPerformanceResponse',
        event: 'get-agent-group-performance-response',
    },

    {
        op: OPS.MAKE_2ND_CALL_RESPONSE,
        method: 'make2ndCallResponse',
        event: 'make-2nd-call-response',
    },

    {
        op: OPS.MERGE_CALL_ACTION_RESPONSE,
        method: 'mergeCallActionResponse',
        event: 'merge-call-action-response',
    },

    {
        op: OPS.AGENT_STATE_CHANGE_EVENT, // 9001
        method: 'agentStateChangeEventHandler',
        event: 'agent-state-change-event',
    },

    {
        op: OPS.MESSAGE_RECEIVE_EVENT, // 9002
        method: 'messageReceiveEvent',
        event: 'message-receive-event',
    },

    {
        op: OPS.CALL_STATE_CHANGE_EVENT, // 9003
        method: 'callStateChangeEvent',
        event: 'state-change-event',
    },

    {
        op: OPS.INCOMING_CALL_EVENT, // 9004
        method: 'incomingCallEvent',
        event: 'incoming-call-event',
    },
]