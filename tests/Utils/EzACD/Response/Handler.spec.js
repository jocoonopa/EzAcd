import Handler from '../../../../src/Utils/EzACD/Response/Handler'
import OPS from '../../../../src/Utils/EzACD/OPs'
import sinon from 'sinon'
let _ = require('lodash')

let assert = require('assert')

describe('Handler 單元測試', () => {
    let handableOps = [
        OPS.CONNECT_TO_ACD_RESPONSE,
        OPS.AGENT_LOGIN_RESPONSE,
        OPS.AGENT_LOGOUT_RESPONSE,
        OPS.CURRENT_AGENT_STATE_RESPONSE,
        OPS.QUERY_ACD_QUEUED_RESPONSE,
        OPS.SET_CURRNET_AGENT_STATE_RESPONSE,
        OPS.MAKE_CALL_RESPONSE,
        OPS.DIAL_DTMF_RESPONSE,
        OPS.CALL_ACTION_RESPONSE,
        OPS.GET_DN_STATE_RESPONSE,
        OPS.AGENT_STATE_CHANGE_EVENT,
        OPS.MESSAGE_RECEIVE_EVENT,
        OPS.CALL_STATE_CHANGE_EVENT,
        OPS.INCOMING_CALL_EVENT,
    ]

    let busStub = {
        '$emit': function() {}
    }

    let busSpy = sinon.spy(busStub, '$emit')

    let handlerInstance = new Handler({}, busStub)

    describe('檢查 handler 是否存在', () => {
        handableOps.forEach(op => {
            it(`${op} 確認存在對應 handler function`, () => {
                let methodName = _.find(handlerInstance.cbs, { op: Number(op) }).method

                assert.equal(_.isFunction(handlerInstance[methodName]), true)    
            })
        })
    })

    describe('檢查 handler function 內部動作', () => {
        handlerInstance.cbs.forEach(cb => {
            it(`檢查 ${cb.method} 是否有呼叫 bus.$emit()`, () => {
                let testString = "atype=98\n"

                handlerInstance[cb.method](testString)

                assert.ok(busStub.$emit.calledOnce)

                busSpy.resetHistory()
            })
        })

        it(`檢查 unknownHandler 是否有呼叫 bus.$emit()`, () => {
            let testString = 'string'

            handlerInstance.unknownHandler(testString)

            assert.ok(busStub.$emit.calledOnce)

            busSpy.resetHistory()
        })
    })
})
