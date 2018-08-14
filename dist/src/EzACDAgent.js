'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Agent2 = require('../Utils/EzACD/Agent');

var _Agent3 = _interopRequireDefault(_Agent2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EzACDAgent = function (_Agent) {
  _inherits(EzACDAgent, _Agent);

  function EzACDAgent() {
    _classCallCheck(this, EzACDAgent);

    return _possibleConstructorReturn(this, (EzACDAgent.__proto__ || Object.getPrototypeOf(EzACDAgent)).apply(this, arguments));
  }

  return EzACDAgent;
}(_Agent3.default);

exports.default = EzACDAgent;