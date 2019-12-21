import _ from 'lodash'
import { client, w3cwebsocket }  from 'websocket'
import prettyjson from 'prettyjson'
import { AES_Init, AES_ExpandKey, AES_Encrypt, AES_Done } from './jsaes'
import Bridge from '../BridgeService'
import Adapter from '../Adapter'
import CommandList from './commandList'
import ResponseList from './responseList'

export default class WebPhone extends Bridge
{
    constructor({ domain, ext, password, centerId, port, isSsl }, bus = null, isDebug = false) {
        super()

        this.port = port
        this.domain = domain
        this.ext = ext
        this.password = password
        this.centerId = centerId
        this.protocol = isSsl ? 'wss' : 'ws'
        this.subProtocol = 'web-call-protocol'
        this.bus = bus
        this.seq = 0
        this.hasClosed = false

        this.nonce = null
        this.callId = null
        this.callType = ''
        this.callState = null
        this.muteState = null
        this.remoteSdp = null
        this.localSdp = null
        this.localPeerConnection = null
        this.remoteAudio = null
        this.localStream = null
        this.remoteStream = null

        this.isDebug = isDebug
        this.commandList = CommandList
        this.responseList = ResponseList

        this.initBrowserSocket()
    }

    static get CALL_STATES() {
        //0: Disconnected 1: Ring, 2: Connected  3:local hold  4:Remote Hold
        return {
            DISCONNECT: 0,
            RING: 1,
            CONNECT: 2,
            LOCAL_HOLD: 3,
            REMOTE_HOLD: 4,
        }
    }

    onClose() {
        this.hasClosed = true

        setTimeout(() => {
            this.initBrowserSocket()
        }, 300)

        this.emit(Bridge.events.SOCKET_CLOSED, {
            message: 'echo-protocol Client Closed',
        })
    }

    isIncoming() {
        return _.eq(this.callType, 'incoming')
    }

    isOutgoing() {
        return _.eq(this.callType, 'outgoing')
    }

    onMessage(event) {
        let data = event.data || event.utf8Data
        let obj = Adapter.toObj(data)
        let op = Number(_.get(obj, 'op'))
        let seq = Number(_.get(obj, 'seq'))

        if (this.isDebug) {
            let opDesc = _.find(this.responseList, { code: op })

            opDesc ?
                console.log(`\n<<<<<<<<<<<<<< ${opDesc.desc}`.cyan) :
                console.log(`\n<<<<<<<<<<<<<< Unknown (${op})`.cyan)

            console.log(prettyjson.render(obj))
        }

        switch (op) {
            /* Connected to WebRTC server */
            case 2000:
                this.connectWebRTCServerCallback(obj)
            break

            case 2006:
                this.answerCall(obj)
            break

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
                this.registerStatusCallback(obj)
            break

            case 9002:
                this.incomingCallRinging(obj)
            break

            case 9004:
                this.callStateChangeCallback(obj)
            break

            case 9008:
                this.resetChannel()
            break

            case 9009:
                this.notifyToAnswer()
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
        this.nonce = _.get(obj, 'nonce')
        let secret = 'x%6a8'
        let key = this.initEncrypt(`${secret}${this.nonce}${this.ext}`)
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

    registerStatusCallback(obj) {
        this.emit('sip-registed', obj)
    }

    incomingCallRinging(obj) {
        this.callId = _.get(obj, 'cid')
        this.callType = 'incoming'
        this.remoteSdp = this.getSdp(global.EZACD_tmp_data)

        return setTimeout(() => {
            this.dispatch({
                op: 1006,
                cid: _.get(obj, 'cid'),
                seq: this.seq,
            })
        }, 100)
    }

    resetChannel() {
        this.mutecontrol(true)
        this.mutecontrol(false)
    }

    notifyToAnswer() {
        if (_.eq(Number(this.callState), WebPhone.CALL_STATES.RING)) {
            this.answerCall()
        }
    }

    getSdp(msg) {
        let idx = msg.indexOf('sdp=')

        if (0 < idx) {
            return msg.substring(idx + 4)
        }

        return ''
    }

    gotRemoteDescription(sdp) {
        let params = {
            type: this.isOutgoing() ? 'answer' : 'offer',
            sdp,
        }

        this.localPeerConnection.setRemoteDescription(
            new RTCSessionDescription(params),
            this.setRemoteSuccess.bind(this)
        )
    }

    setRemoteSuccess() {
        if (this.isIncoming()) {
            this.localPeerConnection.createAnswer(this.setLocalDescription.bind(this), e => {
                console.log(e)
                console.log(e.message)
            })
        }
    }

    setLocalDescription(description) {
        if (this.isIncoming()) {
            description.sdp = this.replaceString(description.sdp, 'a=setup:active', 'a=setup:passive')
        }

        this.localSdp = description.sdp

        this.localPeerConnection.setLocalDescription(
            description,
            this.setLocalDescriptionSuccess.bind(this),
            e => {
                console.error(e)
                console.error(e.message)
            }
        )
    }

    setLocalDescriptionSuccess() {
        return this.isIncoming() ?
            this.answerCallCommand(this.localSdp) : this.makeCallCommand(this.localSdp)
    }

    callStateChangeCallback(obj) {
        this.callId = _.get(obj, 'cid')
        this.callState = _.get(obj, 'state')

        switch (Number(this.callState)) {
            case WebPhone.CALL_STATES.DISCONNECT:
                this.closePeerConnection()

                this.callType = null
                this.called = null
                this.localSdp = null
                this.remoteSdp = null
                this.muteState = false
            break

            case WebPhone.CALL_STATES.RING:
            break

            case WebPhone.CALL_STATES.CONNECT:
                this.mutecontrol(false)
            break

            case WebPhone.CALL_STATES.LOCAL_HOLD:
                this.mutecontrol(true)
            break

            case WebPhone.CALL_STATES.REMOTE_HOLD:
                this.mutecontrol(true)
            break
        }
    }

    closePeerConnection() {
        this.localPeerConnection.close()

        if (0 < this.localStream.getAudioTracks().length) {
            this.localStream.getAudioTracks()[0].stop()
        }

        this.localPeerConnection = null
    }

    /**
     *  answerCall setLocalDescriptionSuccess
     *
     * @param  {String} sdp
     * @return void
     */
    answerCallCommand(sdp) {
        return this.dispatch({
            op: 1004,
            cid: this.callId,
            seq: this.seq,
            sdp,
        })
    }

    /**
     * 應該用不到
     *
     * make-call 應該都是ㄧ
     */
    makeCallCommand(to, sdp) {
        return this.dispatch({
            op: 1003,
            disp: this.tel,
            from: this.tel,
            to: this.called,
            sdp,
        })
    }

    replaceString(str, repstr, repwith) {
        let idx = 0 - repstr.length
        let idx1 = 0
        let result = ''

        if (str != null) {
            while (true) {
                idx = str.indexOf(repstr,idx+repstr.length)

                if (idx >= 0) {
                    result += str.substring(idx1,idx)
                    result += repwith
                    idx1 = idx + repstr.length
                } else {
                    if (idx1 < str.length) {
                        result += str.substring(idx1)
                    }

                    break
                }
            }
        }

        return result
    }

    gotLocalIceCandidate(event) {
        if (event.candidate) {
            if (event.candidate.candidate.indexOf(' tcp ')<0) {
                this.localSdp += 'a=' + event.candidate.candidate + "\n"
            }
        }
    }

    gotRemoteStream(event) {
        this.remoteStream = event.streams ? event.streams[0] : event.stream
        this.remoteAudio = document.getElementById('remoteAudio')

        _.set(this.remoteAudio, 'srcObject', this.remoteStream)
    }

    gotStream(stream) {
        this.localStream = stream
        this.localAudio = document.getElementById('localAudio')
        this.localAudio.srcObject = stream

        let configuration = {
            iceServers: [],
        }

        let pcConstraints = {
            optional: [
                {
                    DtlsSrtpKeyAgreement: true,
                },
            ],
        }

        this.localPeerConnection = new RTCPeerConnection(configuration, pcConstraints)

        this.localPeerConnection.onicecandidate = this.gotLocalIceCandidate.bind(this)

        this.localPeerConnection.ontrack = this.gotRemoteStream.bind(this)

        this.localPeerConnection.addStream(this.localStream)

        if (this.isOutgoing()) {
            this.localPeerConnection.createOffer(this.setLocalDescription.bind(this), () => {})
        } else {
            let rtcSessionDescription = new RTCSessionDescription({
                'type': 'offer',
                'sdp': this.remoteSdp,
            })

            this.localPeerConnection.setRemoteDescription(
                rtcSessionDescription,
                this.setRemoteSuccess.bind(this),
                e => {
                    console.log(e)
                    console.error(e.message)
                }
            )
        }
    }

    answerCall() {
        navigator.mediaDevices.getUserMedia({ audio: true,video: false, })
            .then(this.gotStream.bind(this))
            .catch(e => console.error(e))
    }

    mutecontrol(muteState) {
        if (0 < this.localStream.getAudioTracks().length) {
            this.localStream.getAudioTracks()[0].enabled = ! muteState
        }

        if (0 < this.remoteStream.getAudioTracks().length) {
            this.remoteStream.getAudioTracks()[0].enabled = ! muteState
        }

        this.muteState = muteState
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