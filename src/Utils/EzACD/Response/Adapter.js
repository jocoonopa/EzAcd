import _ from 'lodash'
import OPs from '../OPs'

export default class Adapter
{
    /**
     * 從傳入的 response data 取得指定欄位的值
     *
     * @param  {String}  data
     * @param  {String} key
     * @return {String|Null}
     */
    static get(data, key) {
        let messages = data.split("\n")

        let message = _.find(messages, message => {
            let pair = message.split('=')

            return _.isEqual(pair[0], key)
        })

        return _.isNil(message) ? null : message.split('=')[1]
    }

    /**
     * 從傳入的 response data 判斷動作是否成功
     *
     * @param  {String}  data
     * @return {Boolean}
     */
    static isSuccess(data) {
        let code = Adapter.get(data, 'code')

        return !_.isNil(code) && _.isEqual(Number(code), 0)
    }

    /**
     * 將傳入的 response data 轉換為 Object
     *
     * @param  {String} data
     * @param  {Boolean} isIgnoreComma
     * @return {Object}
     */
    static toObj(data, isIgnoreComma = false) {
        let messages = data.split("\n")
        let obj = {}
        let filledObj = message => {
            let pair = message.split('=')

            return obj[pair[0]] = _.gt(pair.length, 2) ? Adapter.agentListStringHandle(_.slice(pair, 1).join('=')) : pair[1]
        }

        _.each(messages, message => {
            if (!isIgnoreComma && _.includes(message, ',')) {
                let outPairs = message.split(',')

                return _.each(outPairs, message => {
                    filledObj(message)
                })
            }

            filledObj(message)
        })

        return obj
    }

    /**
     * 不得已的特例處理, 因為格式就是非常特別
     *
     * @param  {String} str
     * @return {Array}
     */
    static agentListStringHandle(str) {
        let arr = []
        let agentStrs = str.split(',')

        _.each(agentStrs, agentStr => {
            let obj = {}
            let agentPair = agentStr.split('=')

            obj[agentPair[0].split(' ')[1]] = agentPair[1]

            arr.push(obj)
        })

        return arr
    }
}