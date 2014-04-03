//deliver module
//receive request,get config,return config,record deliver info

var redis = require('../common/redisClient');
var fs = require('fs');
var crypto=require('../common/crypto');
var config = require('../config');
//record deliver info
var record = function (cookie, logPath, logStr, callback){
	var date = new Date();
	var month = ((date.getMonth()+1)<10)?('0' + (date.getMonth()+1)):(date.getMonth()+1);
	var day = (date.getDate()<10)?('0' + date.getDate()):date.getDate();
	logPath = logPath + '/' + date.getFullYear() + month + day;
	if(!fs.existsSync(logPath)){
		fs.mkdirSync(logPath)
	}
	var hour = (date.getHours()<10)?('0' + date.getHours()):date.getHours();
	logPath = logPath + '/' + hour;
	if(!fs.existsSync(logPath)){
		fs.mkdirSync(logPath);
	}
	cookie = crypto.decrypt(cookie, config.sessionSecret);	console.log(cookie);

	var cookie = cookie.split('\t');
	var cookie = cookie[2];
	logPath = logPath + '/' + date.getFullYear() + '-' + month + '-' + day + '-' + hour + '-' + cookie.charAt(cookie.length - 1) + '-1-' + process.pid;
	fs.appendFile(logPath, logStr, function(err){
		if(err){
			callback(0);
		}else{
			callback(1);
		}
	});
}

var deliver = function (sid,url,callback){
	redis.hget('widget', sid, function(err, reply){
		if(reply){
			var widgetInfo = JSON.parse(reply);
			if(widgetInfo.isAlive){
				redis.hget('deliver', sid, function(err, reply){
					if(reply){
						var deliverInfo = JSON.parse(reply);
						callback(reply);						
					}else{
						callback({err:'can not find config file!'});
					}
				});
			}else{
				callback({err:'this domain is not alive!'});
			}
		}else{
			callback({err:'can not find this widget!'});
		}
	});
};

exports.deliver = deliver;
exports.record = record;