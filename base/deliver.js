//deliver module
//receive request,get config,return config,record deliver info

var client = require('../common/redisClient');
var fs = require('fs');
var crypto=require('../common/crypto');
var config = require('../config');
var redisKey = require('./redisKeyManagement');

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
	cookie = crypto.decrypt(cookie, config.sessionSecret);
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

//field: 'sid:id'
var deliver = function (deliverfield, url, callback){
	client.hget(redisKey.getDeliverKey(), deliverfield, function(err, reply){
		if(reply){
			var deliverInfo = JSON.parse(reply);
			var widgetfield = deliverInfo.siteField;
			client.hget(redisKey.getWidgetKey(), widgetfield, function(err, reply){
				if(reply){
					var widgetInfo = JSON.parse(reply);
					if(true == widgetInfo.isAlive){
						if(true == deliverInfo.isAlive){
							callback(JSON.stringify(deliverInfo));		
						}else{
							callback({err:'广告未激活!'});
						}
					}else{
						callback({err:'网站未激活!'});
					}
				}else{
					callback({err:'未找到网站信息!'});
				}
			});
		}else{
			callback({err:'未找到广告信息!'});
		}
	});
};

exports.deliver = deliver;
exports.record = record;