var client = require('../common/redisClient');
var redisKey = require('./redisKeyManagement');
var logger = require('../common/logger').logger('search');


var search = { 
	//写入key
	addkeys:  function(string, id, callback) {
		var len = string.length;
		var multi=client.multi();	
		for(var i=1; i<=len; i++){
			for(var j=0; i+j<=len; j++){
				var sstr = string.substr(j, i);
				multi.sadd(redisKey.getWidgetSearchKey(sstr), id);
			}
		}
		multi.exec(function(err, res){
			if(err){
				callback({err:err});
			}else{
				callback({success:true});
			}
		});
	},
	//删除key
	delkeys:  function(string, id, callback) {
		var len = string.length;
		var multi=client.multi();	
		for(var i=1; i<=len; i++){
			for(var j=0; i+j<=len; j++){
				var sstr = string.substr(j, i);
				multi.srem(redisKey.getWidgetSearchKey(sstr), id);
			}
		}
		multi.exec(function(err, res){
			if(err){
				callback({err:err});
			}else{
				callback({success:true});
			}
		});
	},
	//关键字分析
	analysis: function(str, keys, callback){
		var sets = new Array();
		sets.push(redisKey.getTmpSetKey(str));
		keys = keys.split(' ');
		var len = keys.length;
		var j = 0
		var multi = client.multi();
		for(var i=0; i<len; i++){
			multi.exists(redisKey.getWidgetSearchKey(keys[i]));
		}
		multi.exec(function(err, replies){
			if(replies){
				for(var i=0; i<replies.length; i++){
					if(1 == replies[i]){
						sets.push(redisKey.getWidgetSearchKey(keys[i]));
					}
				}				
				if(1 == sets.length){
					callback({err:'关键字不存在'});
				}else{
					client.sunionstore(sets , function(err, res){
						if(res){
							client.expire(redisKey.getTmpSetKey(str), (60 * 10), function(err, res){
								if(!res){
									logger.error('set expire failed!key:' + redisKey.getTmpSetKey(str));
								}
							});
							callback(res);
						}else{
							callback({err:'关键字不存在'});
						}
					});
				}
			}
		});
	},
	//取出结果
	search:  function(str, start, end, callback){
		client.sort(redisKey.getTmpSetKey(str), 'get', redisKey.getWidgetSortKey('*'), 'limit', start, end, function(err, replies){			
			if(replies){
				client.hmget(redisKey.getWidgetKey(), replies, function(err, replies){
					if(replies){
						callback(replies);
					}else{
						callback({err:'获取网站信息失败'});
					}
				});
			}else{
				callback({err:'获取网站field失败'});
			}
		});
	}
}

module.exports = search;