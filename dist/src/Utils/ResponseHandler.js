'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Adapter = require('Adapter');

var _Adapter2 = _interopRequireDefault(_Adapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ResponseHandler = function () {
    /**
     * @param  {Object}      agent    [Adapter]
     * @param  {Object|Null} bus      [Vue instance]
     * @param  {Boolean}     isDebug  [是否啟用除錯]
     */
    function ResponseHandler(agent, bus) {
        var isDebug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        _classCallCheck(this, ResponseHandler);

        this.agent = agent;
        this.bus = bus;
        this.isDebug = isDebug;
    }

    /**
     * 接收 socket message
     *
     * @param  {Object} evt
     * @return {Mixed}
     */


    _createClass(ResponseHandler, [{
        key: 'receive',
        value: function receive(evt) {
            var data = evt.data || evt.utf8Data;
            var obj = _Adapter2.default.toObj(data);
            var op = Number(_lodash2.default.get(obj, 'op'));

            this.unknownHandler(data);
        }

        /**
         * Unknown handler
         *
         * @param  {String}  data
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'unknownHandler',
        value: function unknownHandler(data, isError) {
            return this.emitViaBus(_Adapter2.default.toObj(data), isError);
        }

        /**
         * Emit via bus
         *
         * @param  {Object} obj
         * @return {Void}
         */

    }, {
        key: 'emitViaBus',
        value: function emitViaBus(obj) {
            var isError = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            return this.emit({
                eventName: _lodash2.default.get(this.cb, 'event', 'Unknown'),
                withData: obj
            }, isError);
        }

        /**
         * Emit to vue instance via bus
         *
         * @param  {String} options.eventName
         * @param  {Obj} options.withData
         * @param  {Boolean} isError
         * @return {Mixed}
         */

    }, {
        key: 'emit',
        value: function emit(_ref) {
            var eventName = _ref.eventName,
                withData = _ref.withData;
            var isError = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            if (this.bus) {
                return this.bus.$emit(eventName, {
                    data: withData,
                    error: true
                });
            }
        }
    }]);

    return ResponseHandler;
}();

exports.default = ResponseHandler;