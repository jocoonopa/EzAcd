import Agent from '../../src/Utils/EzACD/Agent'
import Adapter from '../../src/Utils/EzACD/Response/Adapter'
import { SocketIO, Server } from 'mock-socket'
import sinon from 'sinon'
let _ = require('lodash')
import md5 from 'md5'
let assert = require('assert')

describe('Agent 單元測試', function () {
    global.config = require('../../src/config.json')
    let fakeURL = 'ws://localhost:8080'
    const mockServer = new Server(fakeURL)
    let socketStub = new SocketIO(fakeURL)

    socketStub.send = message => {
        socketStub.emit('message', message)
    }
    socketStub.connect = () => {}

    let agent = null
    let publicMethods = [
        'login',
        'logout',
        'getState',
        'setState',
        'makeCall',
        'dialDtmf',
        'hold',
        'answer',
        'disconnect',
        'mute',
        'cancel',
        'getDnState',
        'getAgentGroupList',
        'getAgentPerformance',
        'getAgentGroupPerformance',
        'getDnPerformance',
        'queryAcdQueued',
        'make2ndCall',
        'transfer',
        'conference',
        'disconnectMergeCall',
        'supervisorCoach',
        'supervisorMonitor',
        'supervisorConference',
        'supervisorTransfer',
        'supervisorTalkToAgent',
    ]

    let spyAgent = null

    before(() => {
        mockServer.on('connection', socket => {
            socket.on('message', data => {
                let obj = Adapter.toObj(data)

                assert.ok(_.has(obj, 'op'))
            })
        })

        agent = new Agent({
            port: config.port,
            domain: config.domain,
            id: config.id,
            ext: config.ext,
            password: config.password,
            centerId: config.center_id,
            ssl: config.ssl,
        }, null, false, socketStub)

        spyAgent = sinon.spy(agent, 'dispatch')
    })

    describe('Socket message send', () => {
        publicMethods.forEach(publicMethod => {
            it(`測試 ${publicMethod} 是否最後有把訊息發送到 socket 上`, done => {
                agent[publicMethod]()

                assert.equal(agent.dispatch.calledOnce, true)

                agent.dispatch.resetHistory()

                done()
            })
        })
    })

    describe('測試物件轉字串是否正確', () => {
        it('測試 genSendStr 方法', () => {
            let inputObj = {
                a: 'b',
                c: 'd',
                e: 'f',
            }

            let resultString = Agent.genSendStr(inputObj)

            assert.equal(resultString, "a=b\nc=d\ne=f\n")
        })
    })

    describe('參數屬性測試', () => {
        it('檢查 url 組合是否正確', () => {
            assert.equal(agent.url, `${agent.protocol}://${agent.domain}:${agent.port}`)
        })

        it('檢查 auth 組合是否正確', () => {
            assert.equal(agent.auth, md5(`${agent.ag}${agent.nonce}${agent.password}`))
        })
    })
})
