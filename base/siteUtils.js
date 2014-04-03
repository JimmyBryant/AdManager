// for read site list
var client = require('../common/redisClient.js'),
	redisKey = require('./redisKeyManagement');

// get sigle site info
// f:site field
function getSite(f,callback){
	var key = redisKey.getWidgetKey();
	if(f){
		client.hget(key,f,function(err,reply){
			if(reply){
				callback(reply);
			}else{
				callback(null);
			}
		});
	}else{
		callback(null);
	}
}	
// get multiple site info
// fl:site field list
function getMultiSite(fl,callback){
	var key = redisKey.getWidgetKey(),
		result = [];
	if(fl.length){
		client.hmget(key,fl,function(err,replies){
			if(replies){
				result = replies;
				callback(result);
			}else{
				callback(result);
			}
		})
	}else{
		callback(result);
	}	
}

siteUtils = {
	getSite : getSite,
	getMultiSite : getMultiSite
}

exports = module.exports = siteUtils;