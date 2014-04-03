//widget management
var crypto = require('../common/crypto');
var client = require('../common/redisClient.js');
var redisKey = require('./redisKeyManagement');
var logger = require('../common/logger').logger('widgetManage');
var search = require('./search');

var widgetManagement = {
	initWidgetID : function(){
		client.setnx(redisKey.getWidgetIdKey(), 1);
	},
	//create widget
	createWidget: function(obj, callback) {
		var sid=crypto.md5(obj.domain);
		obj.sid = sid;
		//can not create widget with the same sid
		client.get(redisKey.getWidgetIdKey(), function(err, reply){
			if(reply){
				var field = sid + ':' +reply;
				obj.field = field;
				search.addkeys(obj.domain, reply, function(res){
					if(!res.success){
						logger.error("addkeys domain failed when create! widgetfield:" + field);
					}
				});
				search.addkeys(obj.siteName, reply, function(res){
					if(!res.success){
						logger.error("addkeys name failed when create! widgetfield:" + field);
					}
				});
				client.set(redisKey.getWidgetSortKey(reply), field, function(err, res){
					if(!res){
						logger.error("set WidgetSortKey failed! widgetfield:" + field);
					}
				});
				client.sismember(redisKey.getWidgetSidKey(), sid, function(err, res){
					if(res){
						callback({err:'网站已存在'});
					}else{
						client.hset(redisKey.getWidgetKey(), field, JSON.stringify(obj), function(err, result){
							if(err){
								callback({err:'网站创建失败:增加网站失败'});
							}else{
								client.lpush(redisKey.getWidgetListKey(), field, function(err, reply){
									if(reply){
										client.incr(redisKey.getWidgetIdKey(), function(err, reply){
											if(reply){
												//保证widget唯一性
												client.sadd(redisKey.getWidgetSidKey(), sid, function(err, res){
													if(!res){
														logger.error("add widgetsid failed! widgetfield:" + field);
													}
													callback({success:true});
												});
												
											}else{
												callback({err:'网站创建失败'});
											}
										});
									}else{
										callback({err:'网站创建失败:增加网站列表失败'});
									}
								});	
							}
						});	
					}
				});
			}else{
				callback({err:'获取网站id失败'});
			}
		});
	},
	//edit widget
	editWidget: function(obj,callback) {
		var field=obj.field;
		id = field.split(':')[1];
		search.delkeys(obj.oSiteName, id, function(res){
			if(!res.success){
				logger.error("delkeys onamesite failed when edit! widgetfield:" + field);
			}
			delete obj.oSiteName;
			if(field){
				client.hset(redisKey.getWidgetKey(), field, JSON.stringify(obj),function(err,reply){
					if(err){
						callback({err:'更新网站出错'});
					}else{					
						callback({success:true});
					}
				})
			}else{
				callback({err:'不存在该网站'});
			}
		});
		search.addkeys(obj.siteName, id, function(res){
			if(!res.success){
				logger.error("addkeys namesite failed when edit! widgetfield:" + field);
			}
		});
	},
	//delete widget,just get rid of the record from widgetlist
	delWidget: function(obj, callback){
		var field = obj.field;
		var sid = field.split(':')[0];
		var id = field.split(':')[1];
		search.delkeys(obj.siteName, id, function(res){
			if(!res.success){
				logger.error("delkeys sitename failed when del! widgetfield:" + field);
			}
		});
		search.delkeys(obj.domain, id, function(res){
			if(!res.success){
				logger.error("delkeys domain failed when del! widgetfield:" + field);
			}
		});
		client.del(redisKey.getWidgetSortKey(id), function(err, res){
			if(!res){
				logger.error("del WidgetSortKey failed! widgetfield:" + field);
			}
		});
		client.del(redisKey.getDeliverListKey(sid) ,function(err, res){
			if(!res){
				logger.error("del DeliverList failed! widgetfield:" + field);
			}
		});	
		client.srem(redisKey.getWidgetSidKey(), sid, function(err, res){
			if(!res){
				logger.error("del widgetsid failed! widgetfield:" + field);
			}
		});
		client.lrem(redisKey.getWidgetListKey(), 1, field, function(err, result){
			if(1 <= result){
				callback({success:true});
			}else{
				callback({err:'删除错误或者不存在该网站'});
			}
		});
	},
	//active widget
	activeWidget: function(field, callback){
		client.hget(redisKey.getWidgetKey(), field, function(err, reply){
			if(reply){
				var obj = JSON.parse(reply);
				obj.isAlive = 1;
				client.hset(redisKey.getWidgetKey(), field, JSON.stringify(obj), function(err, res){
					if(err){
						callback({err:'激活广告失败'});
					}else{
						callback({success:true});
					}
				});
			}else{
				callback({err:'未找到该广告'});
			}
		});
	},
	//stop widget
	stopWidget: function(field, callback){
		client.hget(redisKey.getWidgetKey(), field, function(err, reply){
			if(reply){
				var obj = JSON.parse(reply);
				obj.isAlive = 0;
				client.hset(redisKey.getWidgetKey(), field, JSON.stringify(obj), function(err, res){
					if(err){
						callback({err:'暂停广告失败'});
					}else{
						callback({success:true});
					}
				});
			}else{
				callback({err:'未找到该广告'});
			}
		});
	},
	//get sum of widgets
	getWidgetCount : function(callback){
		client.llen(redisKey.getWidgetListKey(),function(err,reply){			
			callback(reply);
		});
	},
	//get widget list 
	listWidgets :function(start, end, callback){
		client.lrange(redisKey.getWidgetListKey(), start, end, function(err,replies) {
			if(err){
				callback({err:err});
			}else{				
				var sid_arr=replies;				
				var multi=client.multi();	
				if(sid_arr.length>0){
					for(var i=0,len=sid_arr.length;i<len;i++){
						var sid=sid_arr[i];
						multi.hget(redisKey.getWidgetKey(), sid);
					}		
					multi.exec(function(err,replies){
						if(err){
							callback({err:err});
						}else{
							callback(replies);
						}
					});	
				}else{
					callback({err:'widget list is empty'});
				}
			}
		});
	},
	//get widget detail
	widgetDetail:function (field, callback){
		client.hget(redisKey.getWidgetKey(), field, function(err,reply) {
			if(reply){
				callback(reply);
			}else{
				callback(0);
			}
		});
	}
}

module.exports = widgetManagement;