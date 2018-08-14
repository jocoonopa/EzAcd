'use strict';

var _EzACDAgent = require('./EzACDAgent');

var _EzACDAgent2 = _interopRequireDefault(_EzACDAgent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('./bootstrap');

var agent = new _EzACDAgent2.default({
    port: config.port,
    domain: config.domain,
    id: config.id,
    ext: config.ext,
    password: config.password,
    centerId: config.center_id
});

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (data) {
    var argvs = data.replace(/(?:\r\n|\r|\n)/g, '').split(' ');

    switch (argvs[0]) {
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
            console.log('No command founded'.red);
            break;
    }

    //----------------------------------

    process.stdout.write('>>> ');
});