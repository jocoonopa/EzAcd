'use strict';

global._ = require('lodash');

global.config = require('./config.json');
global.title = 'EzACD Shell (v.0.0.1 beta) (Node ' + process.version + ')  by jocoonopa';
global.protocol = config.ssl ? 'https' : 'http';
global.url = protocol + '://' + _.get(config, 'acd_svr') + ':' + _.get(config, 'acd_port');