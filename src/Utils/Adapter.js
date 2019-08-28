import _ from 'lodash'

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

        if (! _.isEqual(-1, data.indexOf('dnlist'))) {
            return Adapter.dnListColumnHandle(obj, data)
        }

        return obj
    }

    /**
     * 特別處理 dnlist
     *
     * @param  {Object} obj 回傳物件
     * @param  {Object} data 取得的 ezvoice data
     * @return {Object}
     */
    static dnListColumnHandle(obj, data) {
        obj['dnlist'] = []

        let dnList = data.substr(data.indexOf('dnlist') + 'dnlist='.length).replace("\n", '');
        // 540939229901=Default Testing DN;0;0;100,540939229902=2nd Dev DN;0;0;100,540939229903=3rd Dev DN;0;0;100,

        let dnListArray = dnList.split(',')

        _.forEach(dnListArray, dn => {
            if (_.isEmpty(dn)) {
                return
            }

            let splitMix = dn.split('=')

            if (_.isNil(splitMix)) {
                return
            }

            let tailMix = splitMix[1].split(';')

            obj['dnlist'].push({
                dn: splitMix[0],
                dnname: tailMix[0],
                queued_calls: tailMix[1],
                queued_time: tailMix[2],
                queued_max: tailMix[3],
            })
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