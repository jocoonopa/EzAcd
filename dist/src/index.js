'use strict';

var _EzACDAgent = require('./EzACDAgent');

var _EzACDAgent2 = _interopRequireDefault(_EzACDAgent);

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('./bootstrap');

var commands = ['call:answer', 'call:hold', 'call:disconnect', 'call:mute', 'call:cancel', 'dial {$char}', 'get {$key}', 'get:state', 'login', 'logout', 'make:call {$dn}', 'set:state {$state}', 'restart'];

var agent = new _EzACDAgent2.default({
    port: config.port,
    domain: config.domain,
    id: config.id,
    ext: config.ext,
    password: config.password,
    centerId: config.center_id
}, null, config.isDebug);

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (data) {
    var argvs = data.replace(/(?:\r\n|\r|\n)/g, '').split(' ');

    switch (argvs[0]) {
        case 'restart':
            agent.initSocket();
            break;

        case 'login':
            agent.login();
            break;

        case 'logout':
            agent.logout();
            break;

        case 'get':
            console.log(_.get(agent, _.get(argvs, 1)).green);
            break;

        case 'get:state':
            agent.getState();
            break;

        case 'set:state':
            agent.setState(_.get(argvs, 1));
            break;

        case 'make:call':
            agent.makeCall(_.get(argvs, 1));
            break;

        case 'dial':
            agent.dialDtmf(_.get(argvs, 1));
            break;

        case 'call:answer':
            agent.answer();
            break;

        case 'call:hold':
            agent.hold();
            break;

        case 'call:disconnect':
            agent.disconnect();
            break;

        case 'call:mute':
            agent.mute();
            break;

        case 'call:cancel':
            agent.cancel();
            break;

        default:
            if (_.isNil(argvs[0]) || _.isEmpty(argvs[0])) {
                return process.stdout.write('\n>>> ');
            }

            console.log(('\u6211\u4E0D\u77E5\u9053 \'' + argvs[0] + '\' \u662F\u4EC0\u5011').red);
            console.log('以下是可用的指令:'.blue);
            console.log(_prettyjson2.default.render(commands));
            break;
    }

    process.stdout.write('\n>>> ');
});