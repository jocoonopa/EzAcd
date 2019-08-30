import _ from 'lodash'
import CallActionDescList from './EzACD/CallActionDescList'
import prettyjson from 'prettyjson'
import { w3cwebsocket }  from 'websocket'

export default class BridgeService
{
    initBrowserSocket() {
        this.connection = new w3cwebsocket(this.url, this.subProtocol)

        this.connection.onerror = this.onError.bind(this)

        this.connection.onopen = this.onOpen.bind(this)

        this.connection.onclose = this.onClose.bind(this)

        this.connection.onmessage = this.onMessage.bind(this)
    }

    onError(error) {
        this.emit(BridgeService.events.SOCKET_ERROR, {
            message: `Connection Error: ${error.toString()}`,
        })
    }

    onClose() {
        this.hasClosed = true

        this.emit(BridgeService.events.SOCKET_CLOSED, {
            message: 'echo-protocol Client Closed',
        })
    }

    onOpen() {}
    onMessage(message) {}

    /**
     * 向 socket 發送訊息
     *
     * @param  {Object} obj
     * @return {Mixed}
     */
    dispatch(obj, str = null) {
        this.seq ++

        if (_.isNil(obj.seq)) {
            obj.seq = this.seq
        }

        if (this.isDebug) {
            this.displayDebugMessage(obj)
        }

        str = str ? str : BridgeService.genSendStr(obj)

        return this.hasClosed ? null : this.connection.send(str)
    }

    displayDebugMessage(obj) {
        let opDesc = _.find(this.commandList, { code: obj.op })
        let tail = ''

        if (!_.isNil(obj.act)) {
            let callActionDesc = _.find(CallActionDescList, { code: Number(obj.act) })

            tail = callActionDesc ? `: ${callActionDesc.desc}` : ` Unknown`
        }

        opDesc ?
            console.log(`\n${opDesc.desc}${tail} >>>>>>>>>>>>>>`.yellow) :
            console.log(`\nUnknown: (${obj.op})${tail} >>>>>>>>>>>>>>`.red)

        console.log(prettyjson.render(obj))
    }

    destroyConnection() {
        if (_.isNil(this.connection)) {
            return
        }

        this.connection.close()
        this.connection = null
    }

    emit(eventName, withData) {
        if (this.bus) {
            this.bus.$emit(eventName, withData)
        }
    }

    static get events() {
        return {
            SOCKET_ERROR: 'socket-error',
            SOCKET_CLOSED: 'socket-closed',
            WEBRTC_OPEN: 'webrtc-opened',
        }
    }

    /**
     * 組成發送到 socket 的字串
     *
     * @param  {Object} obj
     * @return {String}
     */
    static genSendStr(obj) {
        let msg = ''

        for (let prop in obj) {
            msg += `${prop}=${_.get(obj, prop)}\n`
        }

        return msg
    }

    get url() {
        return `${this.protocol}://${this.domain}:${this.port}`
    }
}