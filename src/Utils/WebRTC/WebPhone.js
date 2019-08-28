import _ from 'lodash'
import { client, w3cwebsocket }  from 'websocket'
import { AES_Init, AES_ExpandKey, AES_Encrypt, AES_Done } from './jsaes'
import Bridge from '../BridgeService'
import Adapter from '../Adapter'

export default class WebPhone extends Bridge
{
    constructor({ domain, ext, password, centerId, isSsl }, bus = null, isDebug = false) {
        super()

        this.port = isSsl ? 2081 : 2082
        this.domain = domain
        this.ext = ext
        this.password = password
        this.centerId = centerId
        this.protocol = isSsl ? 'wss' : 'ws'
        this.subProtocol = 'web-call-protocol'
        this.bus = bus
        this.seq = 0
        this.hasClosed = false

        this.initBrowserSocket()
    }

    onMessage(event) {
        let data = event.data || event.utf8Data
        let obj = Adapter.toObj(data)
        let op = Number(_.get(obj, 'op'))
        let seq = Number(_.get(obj, 'seq'))

        switch (op) {
            case 2000:
                this.connectWebRTCServerCallback(obj)
            break

            // Register Status Event
            // Proxy Register Status Event:
            //
            // op=9001
            // seq=xxx
            // state=xxxx
            // (0: Registered, -1: Unregistered, -2: Request Timeout, -3: Contact Updated, -xxx: sip
            // reason code)
            case 9001:
                this.registerSipCallback(obj)
            break
        }
    }

    onOpen() {
        this.emit(WebPhone.events.WEBRTC_OPEN)

        this.connectWebRTCServer()
    }

    connectWebRTCServer(seq) {
        return this.dispatch({
            op: 1000,
            seq
        })
    }

    connectWebRTCServerCallback(obj) {
        let nonce = _.get(obj, 'nonce')
        let secret = 'x%6a8'
        let key = this.initEncrypt(`${secret}${nonce}${this.ext}`)
        let pwd = this.encryptLongString(this.password, key)

        AES_Done()

        this.dispatch({
            op: 1001,
            seq: this.seq,
            usr: this.ext,
            tel: this.ext,
            pwd,
        })
    }

    registerSipCallback(obj) {
        this.emit('sip-registed', obj)
    }

    initEncrypt(myKey) {
        myKey = WebPhone.encryptLength < myKey.length ?
            myKey.substring(0, WebPhone.encryptLength) :
            myKey = _.padEnd(myKey, WebPhone.encryptLength, ' ')

        let key = this.string2Bin(myKey)

        AES_Init()
        AES_ExpandKey(key)

        return key
    }

    encrypt(inputStr, key) {
        let block = this.string2Bin(inputStr)
        let data = ''

        AES_Encrypt(block, key)

        for (let i = 0; i < block.length; i ++) {
            data += this.formatHexStr(block[i])
        }

        return data
    }

    formatHexStr(num) {
        let str = num.toString(WebPhone.encryptLength)

        return _.padStart(str, 2, 0)
    }

    encryptLongString(orgStr, key) {
        if (WebPhone.encryptLength > orgStr.length) {
            return this.encrypt(orgStr, key)
        }

        let data = ''

        for (let i = 0; i < orgStr.length; i = i + 16) {
            data += this.encrypt(orgStr.substr(i, WebPhone.encryptLength), key)
        }

        return data
    }

    string2Bin(str) {
        let result = []

        for (let i = 0; i < str.length; i ++) {
            result.push(str.charCodeAt(i))
        }

        return result
    }

    static get encryptLength() {
        return 16
    }
}