import prettyjson from 'prettyjson'
import _ from 'lodash'
import Adapter from 'Adapter'

export default class ResponseHandler
{
    /**
     * @param  {Object}      agent    [Adapter]
     * @param  {Object|Null} bus      [Vue instance]
     * @param  {Boolean}     isDebug  [是否啟用除錯]
     */
    constructor(agent, bus, isDebug = false) {
        this.agent = agent
        this.bus = bus
        this.isDebug = isDebug
    }

    /**
     * 接收 socket message
     *
     * @param  {Object} evt
     * @return {Mixed}
     */
    receive(evt) {
        let data = evt.data || evt.utf8Data
        let obj = Adapter.toObj(data)
        let op = Number(_.get(obj, 'op'))

        this.unknownHandler(data)
    }

    /**
     * Unknown handler
     *
     * @param  {String}  data
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    unknownHandler(data, isError) {
        return this.emitViaBus(Adapter.toObj(data), isError)
    }

    /**
     * Emit via bus
     *
     * @param  {Object} obj
     * @return {Void}
     */
    emitViaBus(obj, isError = false) {
        return this.emit({
            eventName: _.get(this.cb, 'event', 'Unknown'),
            withData: obj,
        }, isError)
    }

    /**
     * Emit to vue instance via bus
     *
     * @param  {String} options.eventName
     * @param  {Obj} options.withData
     * @param  {Boolean} isError
     * @return {Mixed}
     */
    emit({ eventName, withData }, isError = false) {
        if (this.bus) {
            return this.bus.$emit(eventName, {
                data: withData,
                error: true,
            })
        }
    }
}