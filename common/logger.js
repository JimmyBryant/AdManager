var log4js = require('log4js');
var config = require('../config');

log4js.configure({
  appenders: [
    { type: 'console' }, //控制台输出
    {
      type: 'file', //文件输出
      filename: config.istclog, 
      maxLogSize: 1024*2048,
      backups:3,
      category: 'istc' 
    }
  ],
  replaceConsole: true
});

exports.logger = function(name){
        var logger = log4js.getLogger(name);
        logger.setLevel('INFO');
        return logger;
};