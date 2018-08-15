require('./bootstrap')

import EzACDAgent from './EzACDAgent'
import prettyjson from 'prettyjson'

const commands = [
    'call:answer',
    'call:hold',
    'call:disconnect',
    'call:mute',
    'call:cancel',
    'dial {$char}',
    'get {$key}',
    'get:state',
    'login', 
    'logout',
    'make:call {$dn}',
    'set:state {$state}',
    'restart', 
]

let agent = new EzACDAgent({
    port: config.port,
    domain: config.domain,
    id: config.id,
    ext: config.ext,
    password: config.password,
    centerId: config.center_id,
}, null, config.isDebug)

process.stdin.resume()
process.stdin.setEncoding('utf8')
process.stdin.on('data', data => {
    let argvs = data.replace(/(?:\r\n|\r|\n)/g, '').split(' ')

    switch (argvs[0]) {
        case 'restart':
            agent.initSocket()
        break

        case 'login':
            agent.login()
        break

        case 'logout':
            agent.logout()
        break

        case 'get':
            console.log(_.get(agent, _.get(argvs, 1)).green)
        break

        case 'get:state':
            agent.getState()
        break

        case 'set:state':
            agent.setState(_.get(argvs, 1))
        break

        case 'make:call':
            agent.makeCall(_.get(argvs, 1))
        break

        case 'dial':
            agent.dialDtmf(_.get(argvs, 1))
        break

        case 'call:answer':
            agent.answer()
        break

        case 'call:hold':
            agent.hold()
        break

        case 'call:disconnect':
            agent.disconnect()
        break

        case 'call:mute':
            agent.mute()
        break

        case 'call:cancel':
            agent.cancel()
        break

        default:
            if (_.isNil(argvs[0]) || _.isEmpty(argvs[0]))  {
                return process.stdout.write(`\n>>> `)
            }

            console.log(`我不知道 '${argvs[0]}' 是什們`.red)
            console.log('以下是可用的指令:'.blue)
            console.log(prettyjson.render(commands))
        break
    }

    process.stdout.write(`\n>>> `)
})


 