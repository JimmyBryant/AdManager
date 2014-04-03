//recode the action of update or delete widget 

var redisKey = require('./redisKeyManagement'),
	client = require('../common/redisClient.js'),
	utils = require('../common/utils');

// params = {sDate : [string],eDate : [string],site : [array]} 
// callback can get the key of cached data
function search(params,callback){	
		var dateArr = params.sDate?utils.getAllDate(params.sDate,params.eDate) : [],
			siteArr = utils.toArray(params.site),
			widgetArr = utils.toArray(params.widget), 
			authorArr = utils.toArray(params.author), 			
			dateKeyArr = siteKeyArr = [],
			multi  = client.multi(),
			interKeyArr = [],
			siteTmpKey = redisKey.changeLogTmpKey + 'site:' + siteArr.join(':'),
			widgetTmpKey = redisKey.changeLogTmpKey + 'widget:' + widgetArr.join(':'),
			authorTmpKey = redisKey.changeLogTmpKey + 'author:' + authorArr.join(':'),
			dateTmpKey = redisKey.changeLogTmpKey + 'date:' + (dateArr.length? ':'+params.sDate+':'+params.eDate: ''),
			searchTmpKey = redisKey.changeLogTmpKey  
							+ (params.site? 'site:' + siteArr.join(':') : '')
							+ (params.widget? 'widget:' + widgetArr.join(':') : '')
							+ (params.author? 'author:' + authorArr.join(':') : '') 
							+ (params.sDate? 'date:' + params.sDate +':'+params.eDate : '');

		//cache the search result and expire it when time out
		var expire = 60*60;

		function getUnionKeys(type,arr,tmpKey){	//return array for sunion
			var keyArr = [];			
 			arr.forEach(function(val,index){
				keyArr.push(redisKey.changeLogSortKey+type+':'+val);
			});
			keyArr.unshift(tmpKey);
			return keyArr;
		};

		if(dateArr.length){
			dateKeyArr =  getUnionKeys('date',dateArr,dateTmpKey);
			interKeyArr.push(dateTmpKey);
			multi.sunionstore(dateKeyArr).expire(dateTmpKey,expire);		
		} 
		if(siteArr.length>0){	
			interKeyArr.push(siteTmpKey);
			if(siteArr.length>1){	//if only one site,the key is existed
				siteKeyArr =  getUnionKeys('site',siteArr,siteTmpKey);				
				multi.sunionstore(siteKeyArr).expire(siteTmpKey,expire);
			}
		}
		if(widgetArr.length>0){	
			interKeyArr.push(widgetTmpKey);
			if(widgetArr.length>1){	//if only one widget,the key is existed
				siteKeyArr =  getUnionKeys('widget',widgetArr,widgetTmpKey);				
				multi.sunionstore(siteKeyArr).expire(widgetTmpKey,expire);
			}
		}
		if(authorArr.length>0){	
			interKeyArr.push(authorTmpKey);
			if(authorArr.length>1){	//if only one author,the key is existed
				authorKeyArr =  getUnionKeys('author',authorArr,authorTmpKey);				
				multi.sunionstore(authorKeyArr).expire(authorTmpKey,expire);
			}
		}
	
		multi.exec(function(err , replies){
			if(err){
				callback({err : err});
			}else{
				interKeyArr.unshift(searchTmpKey);		//get intersection array				
				client.sinterstore(interKeyArr,function(err,replies){
					if(err){
						callback({err : err});
					}else{
						client.expire(searchTmpKey,expire,function(err,reply){	//set expire time 								
							callback({key : searchTmpKey});
						}); 							
					}
				});				

			}			
		});

}

var changeLog = {
	//add change log
	add : function  (obj,callback) {	
		if(obj&&typeof obj == 'object'){
			var date = new Date(),
				idKey =  redisKey.changeLogIDKey,
				key = redisKey.changeLogKey,
				listKey = redisKey.changeLogListKey,				
				sortAuthorKey = redisKey.changeLogSortKey+'author:'+obj.author,
				sortSiteKey = redisKey.changeLogSortKey + 'site:' + obj.domain,
				sortWidgetKey = redisKey.changeLogSortKey + 'widget:' + obj.widgetField,
				sortDateKey = redisKey.changeLogSortKey + 'date:' + utils.getDateStr(date);

			
			obj.timestamp = date.getTime();	//set timestamp
			client.incr(idKey,function(err,reply){
				var id = reply,
					value = JSON.stringify(obj),
					multi = client.multi();
				key+=':'+id;
				multi.set(key,value)
					.lpush(listKey,id)
					.sadd(sortDateKey,id)
					.sadd(sortAuthorKey,id)
					.sadd(sortWidgetKey,id)
					.sadd(sortSiteKey,id);
				multi.exec(function(err,reply){
					if(err){
						callback&&callback({err : err});
					}else{
						callback&&callback({success : true});
					}
				});
			});	
		}else{
			callback&&callback({err : 'the param is not a object'});
		}
	},
	//get change log list
	// params = {sDate : [string],eDate : [string],site : [array],offset : [int],count : [int]}
	getList : function(params,callback){
		var multi = client.multi(),
			offset = params.offset,
			count = params.count;

		if(!params.sDate&&!params.site&&!params.author&&!params.widget){	//get list from changeLogList
			multi.llen(redisKey.changeLogListKey)
				.sort(redisKey.changeLogListKey,'desc','get',redisKey.changeLogKey+':*','limit',offset,count)
				.exec(function(err,replies){
					if(err){
						callback({err : err});
					}else{																
						callback({list : replies[1],length : replies[0]});
					}			
				})
		}else{	

			var searchTmpKey = redisKey.changeLogTmpKey  
								+ (params.site? 'site:' + params.site.join(':') : '')
								+ (params.widget? 'widget:' + params.widget.join(':') : '')
								+ (params.author? 'author:' + params.author.join(':') : '') 
								+ (params.sDate? 'date:' + params.sDate +':'+params.eDate : '');
			function getSortResult(key){
				multi.scard(key)
					.sort(key,'desc','get',redisKey.changeLogKey+':*','limit',offset,count)
					.exec(function(err,replies){
						if(replies){							
							callback({list : replies[1],length : replies[0]});
						}else{
							callback({err : err});
						}	
					})
			}
			client.exists(searchTmpKey,function(err,reply){	//first check the key is exist or not				
				if(reply){					
					getSortResult(searchTmpKey);
				}else{					
					search(params,function(result){
						if(result.err){
							callback({ err : result.err});
						}else{
							getSortResult(result.key);
						}
					})
				}
			})
		}
	}
}
exports = module.exports = changeLog;
