//deliver management

var client = require('../common/redisClient');
var widget = require('./widgetManagement');
var redisKey = require('./redisKeyManagement');
var changeLog = require('./changeLog');

//return a diff array between a and b
function getDiff(a,b){
	var diff = [];
	for(var opt in b){
		if(b[opt]!=a[opt]){
			diff.push({	//oldValue and newValue
				column : opt,
				oldValue : a[opt] ,
				newValue : b[opt]
			});	
		}
	}
	return diff;
}

var deliverManagement = {
	initDeliverID : function(){
		client.setnx(redisKey.getDeliverIdKey(), 1);
	},	
	//save deliver
	createDeliver: function(obj, callback) {
		if(obj&&typeof obj=='object'){	
			var sid=obj.sid;
			client.get(redisKey.getDeliverIdKey(), function(err, reply){
				if(reply){
					obj.field = sid + ':' + reply;
					client.hset(redisKey.getDeliverKey(), obj.field, JSON.stringify(obj), function(err, result){
						if(err){
							callback({err:'广告创建失败:增加广告失败'});
						}else{
							client.lpush(redisKey.getDeliverListKey(sid), sid + ':' + reply, function(err, reply){
								if(reply){
									client.incr(redisKey.getDeliverIdKey(), function(err, reply){
										if(reply){
											callback({success:true});
										}else{
											callback({err:'广告创建失败'});
										}
									});
								}else{
									callback({err:'广告创建失败:增加广告列表失败'});
								}
							});	
						}
					});	
				}else{
					callback({err:'获取广告id失败'});
				}
			});
		}else{
			callback({err:'广告创建失败'});
		}
	},
	//edit deliver
	editDeliver: function (obj, callback) {
		if(obj&&typeof obj=='object'){
			client.hget(redisKey.getDeliverKey(), obj.field, function(err, reply){
				if(reply){									
					var deleverObj = JSON.parse(reply),
						author = obj.author;
					delete obj.author;	//delete author attribute
					obj.siteField = deleverObj.siteField;
					obj.widgetType = deleverObj.widgetType;
					obj.field = deleverObj.field;
					obj.sid = deleverObj.sid;													
									
					client.hset(redisKey.getDeliverKey(), obj.field, JSON.stringify(obj), function(err, result){
						if(err){
							callback({err:'广告更新失败'});
						}else{
							widget.widgetDetail(obj.siteField,function(result){								
								if(result){
									var w = JSON.parse(result);
									getDiff(deleverObj,obj).forEach(function(val,index){	//keep change log
										var changeObj = {
											siteField : deleverObj.siteField,											
											widgetField : deleverObj.field,
											domain : w.domain,
											author : author,
											type : 'update',
											column : val.column,
											oldValue : val.oldValue,
											newValue : val.newValue
										};
										changeLog.add(changeObj);
									});
								}
							});
							callback({
								success : true,				
							});
						}
					});
	
				}else{
					callback({err:'广告不存在'});
				}
			});
		}else{
			callback({err:'广告数据不能为空'});
		}
	},
	//delete deliver,just get rid of the record from deliverlist
	delDeliver: function(field, author,callback){
		var sid = field.split(':')[0];
		client.lrem(redisKey.getDeliverListKey(sid), 1, field, function(err, res){
			if(1 <= res){
				client.hget(redisKey.getDeliverKey(),field,function(err,reply){	//keep change log
					if(reply){
						var d = JSON.parse(reply);
						widget.widgetDetail(d.siteField,function(result){							
							var w = JSON.parse(result);
							if(result){
								var changeObj = {
									siteField : d.siteField,							
									widgetField : field,
									domain : w.domain,									
									author : author,
									type : 'delete',
									column : '',
									oldValue : '',
									newValue : ''
								};
								changeLog.add(changeObj);
							}

						});
					}
				})
				callback({success:true});
			}else{
				callback({err:'删除错误或者不存在该广告'});
			}
		});
	},
	//active deliver
	activeDeliver: function(field, callback){
		client.hget(redisKey.getDeliverKey(), field, function(err, reply){
			if(reply){
				var obj = JSON.parse(reply);
				obj.isAlive = 1;
				client.hset(redisKey.getDeliverKey(), field, JSON.stringify(obj), function(err, res){
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
	//stop deliver
	stopDeliver: function(field, callback){
		client.hget(redisKey.getDeliverKey(), field, function(err, reply){
			if(reply){
				var obj = JSON.parse(reply);
				obj.isAlive = 0;
				client.hset(redisKey.getDeliverKey(), field, JSON.stringify(obj), function(err, res){
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
	//get sum of delivers
	getDeliverCount : function(sid, callback){
		client.llen(redisKey.getDeliverListKey(sid),function(err,reply){			
			callback(reply);
		});
	},
	//get deliver list 
	listDelivers :function(sid, start, end, callback){
		client.lrange(redisKey.getDeliverListKey(sid), start, end, function(err,replies) {
			if(err){
				callback({err:err});
			}else{				
				var sid_arr=replies;				
				var multi=client.multi();	
				if(sid_arr.length>0){
					for(var i=0,len=sid_arr.length;i<len;i++){
						var sid=sid_arr[i];
						multi.hget(redisKey.getDeliverKey(),sid);
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
	//get deliver detail
	//field: 'sid:id'
	deliverDetail: function (field, callback){
		client.hget(redisKey.getDeliverKey(), field, function(err,reply) {
			if(reply){
				callback(reply);
			}else{
				callback(0);
			}
		});
	}		
}

module.exports = deliverManagement;