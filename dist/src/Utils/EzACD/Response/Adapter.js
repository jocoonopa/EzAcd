'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _OPs = require('../OPs');

var _OPs2 = _interopRequireDefault(_OPs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Adapter = function () {
    function Adapter() {
        _classCallCheck(this, Adapter);
    }

    _createClass(Adapter, null, [{
        key: 'get',

        /**
         * 從傳入的 response data 取得指定欄位的值
         *
         * @param  {String}  data
         * @param  {String} key
         * @return {String|Null}
         */
        value: function get(data, key) {
            var messages = data.split("\n");

            var message = _lodash2.default.find(messages, function (message) {
                var pair = message.split('=');

                return _lodash2.default.isEqual(pair[0], key);
            });

            return _lodash2.default.isNil(message) ? null : message.split('=')[1];
        }

        /**
         * 從傳入的 response data 判斷動作是否成功
         *
         * @param  {String}  data
         * @return {Boolean}
         */

    }, {
        key: 'isSuccess',
        value: function isSuccess(data) {
            var code = Adapter.get(data, 'code');

            return !_lodash2.default.isNil(code) && _lodash2.default.isEqual(Number(code), 0);
        }

        /**
         * 將傳入的 response data 轉換為 Object
         *
         * @param  {String} data
         * @param  {Boolean} isIgnoreComma
         * @return {Object}
         */

    }, {
        key: 'toObj',
        value: function toObj(data) {
            var isIgnoreComma = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            var messages = data.split("\n");
            var obj = {};
            var filledObj = function filledObj(message) {
                var pair = message.split('=');

                return obj[pair[0]] = _lodash2.default.gt(pair.length, 2) ? Adapter.agentListStringHandle(_lodash2.default.slice(pair, 1).join('=')) : pair[1];
            };

            _lodash2.default.each(messages, function (message) {
                if (!isIgnoreComma && _lodash2.default.includes(message, ',')) {
                    var outPairs = message.split(',');

                    return _lodash2.default.each(outPairs, function (message) {
                        filledObj(message);
                    });
                }

                filledObj(message);
            });

            if (!_lodash2.default.isEqual(-1, data.indexOf('dnlist'))) {
                return Adapter.dnListColumnHandle(obj, data);
            }

            return obj;
        }

        /**
         * 特別處理 dnlist
         *
         * @param  {Object} obj 回傳物件
         * @param  {Object} data 取得的 ezvoice data
         * @return {Object}
         */

    }, {
        key: 'dnListColumnHandle',
        value: function dnListColumnHandle(obj, data) {
            obj['dnlist'] = [];

            var dnList = data.substr(data.indexOf('dnlist') + 'dnlist='.length).replace("\n", '');
            // 540939229901=Default Testing DN;0;0;100,540939229902=2nd Dev DN;0;0;100,540939229903=3rd Dev DN;0;0;100,

            var dnListArray = dnList.split(',');

            _lodash2.default.forEach(dnListArray, function (dn) {
                if (_lodash2.default.isEmpty(dn)) {
                    return;
                }

                var splitMix = dn.split('=');

                if (_lodash2.default.isNil(splitMix)) {
                    return;
                }

                var tailMix = splitMix[1].split(';');

                obj['dnlist'].push({
                    dn: splitMix[0],
                    dnname: tailMix[0],
                    queued_calls: tailMix[1],
                    queued_time: tailMix[2],
                    queued_max: tailMix[3]
                });
            });

            return obj;
        }

        /**
         * 不得已的特例處理, 因為格式就是非常特別
         *
         * @param  {String} str
         * @return {Array}
         */

    }, {
        key: 'agentListStringHandle',
        value: function agentListStringHandle(str) {
            var arr = [];
            var agentStrs = str.split(',');

            _lodash2.default.each(agentStrs, function (agentStr) {
                var obj = {};
                var agentPair = agentStr.split('=');

                obj[agentPair[0].split(' ')[1]] = agentPair[1];

                arr.push(obj);
            });

            return arr;
        }
    }]);

    return Adapter;
}();

exports.default = Adapter;