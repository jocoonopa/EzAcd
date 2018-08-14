'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

            var message = _.find(messages, function (message) {
                var pair = message.split('=');

                return _.isEqual(pair[0], key);
            });

            return _.isNil(message) ? null : message.split('=')[1];
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

            return _.isEqual(Number(code), 0);
        }

        /**
         * 將傳入的 response data 轉換為 Object
         *
         * @param  {String} data
         * @return {Object}
         */

    }, {
        key: 'toObj',
        value: function toObj(data) {
            var messages = data.split("\n");
            var obj = {};

            _.each(messages, function (message) {
                var pair = message.split('=');

                obj[pair[0]] = pair[1];
            });

            return obj;
        }
    }]);

    return Adapter;
}();

exports.default = Adapter;