'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _CallAction = require('./CallAction');

var _CallAction2 = _interopRequireDefault(_CallAction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [{
    code: _CallAction2.default.ANSWER,
    desc: '接聽'
}, {
    code: _CallAction2.default.HOLD,
    desc: '保留'
}, {
    code: _CallAction2.default.DISCONNECT,
    desc: '掛斷'
}, {
    code: _CallAction2.default.MUTE,
    desc: '靜音'
}, {
    code: _CallAction2.default.CANCEL,
    desc: '取消'
}];