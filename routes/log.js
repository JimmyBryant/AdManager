// Module dependencies

var  changeLog = require('../base/changeLog'),
	siteUtils = require('../base/siteUtils'),	
	utils = require('../common/utils'),
	logBook = require('../common/logBook').logBook,
	logValueBook = require('../common/logBook').logValueBook;

var method = '',
	user = null,
	params = {},
	query = {},
	dateReg = /^([\d]{4})-([\d]{1,2})-([\d]{1,2})$/;

var log = {
	all : function  (req,res) {		
		var page = query.page||1;
			pageSize = query.psize||10,
			ll = [],
			fl = [],
			sDate = query.sDate&&dateReg.test(query.sDate)?query.sDate : '',
			eDate = query.eDate&&dateReg.test(query.eDate)?query.eDate : '',	
			domain =  query.domain?query.domain.split(' ') : '',
			author =  query.author?query.author.split(' ') : '',		
			params = {				
				author : query.author?query.author.split(' ') : null,
				site : domain,
				sDate : sDate,
				eDate : eDate,
				offset : (page-1)*pageSize,
				count : pageSize
			};
			
		changeLog.getList(params,function(result){
			if(result.err){
				res.render('log/all',{list : [],sDate : sDate,eDate : eDate, domain : domain});					
			}else{
				var pager={
					curPage : parseInt(page),
					pageCount : Math.ceil(result.length/pageSize),
					pageSize : pageSize,
					url : '/log/all?'	
						+(domain?'domain='+domain+'&':'')
						+(author?'author='+author+'&':'')				
						+(sDate&&eDate?'&sDate='+sDate+'&eDate='+eDate+'&':'')			
				};
				ll = result.list;
				ll.forEach(function(val,index){
					var l = JSON.parse(val);
					ll[index] = l;
					fl.push(l.siteField);
					if(logBook[l.column]){						
						if(logValueBook[l.column]){								
							l.oldValue = logValueBook[l.column][l.oldValue];
							l.newValue = logValueBook[l.column][l.newValue];
						}
						l.column = logBook[l.column];
					}
						
				});
				siteUtils.getMultiSite(fl,function(replies){
					if(replies.length){						
						replies.forEach(function(val,index){
							var site = JSON.parse(val);
							ll[index]['siteName'] = site.siteName;
						});
					}
					res.render('log/all',{list : ll,pager : pager,sDate : sDate,eDate : eDate, domain : domain});					
				});			
			}
		});
	},
	// view all logs of the widget	
	widget : function(req,res){
		var field = query.f,
			siteField = query.sf||'',
			siteName = query.sn||'',
			widgetName = query.wn||'',
			page = query.page || 1,
			pageSize = query.pageSize || 10,
			sDate = query.sDate&&dateReg.test(query.sDate)?query.sDate : '',
			eDate = query.eDate&&dateReg.test(query.eDate)?query.eDate : '',			
			ll = [],
			data = {
					list : [],
					sDate : sDate,
					eDate : eDate,
					field : field,
					widgetName : widgetName,
					siteName : siteName,
					siteField : siteField
				};

		if(field){									
			var	params = {				
				widget : field.split(' '),
				sDate : sDate,
				eDate : eDate,
				offset : (page-1)*pageSize,
				count : pageSize
			};

			changeLog.getList(params,function(result){				
				if(result.err){
					res.render('log/widget', data);
				}else{
					ll = result.list;
					ll.forEach(function(val,index){
						var l = JSON.parse(val);
						ll[index] = l;
						if(logBook[l.column]){	//convert the value to a easy understanding str														
							if(logValueBook[l.column]){								
								l.oldValue = logValueBook[l.column][l.oldValue];
								l.newValue = logValueBook[l.column][l.newValue];
							}
							l.column = logBook[l.column];
						}							
					});
					data.list = ll;				
					data.pager={
						curPage : parseInt(page),
						pageCount : Math.ceil(result.length/pageSize),
						pageSize : pageSize,
						url : '/log/widget?'
							+'sn='+siteName
							+'&wn='+widgetName
							+'&f='+field
							+ '&sf='+siteField				
							+(sDate&&eDate?'&sDate='+sDate+'&eDate='+eDate+'&':'&')			
					};								
					res.render('log/widget',data);		
				}

			});
		}else{
			res.render('log/widget',data);
		}
		
	}
}

exports.index=function(req,res){	
      var action=req.params.action;           
      if(action&&log[action]){
		if(req.session.user){      	
			method = req.method;
			query = req.query;
			params = req.body;
			user = req.session.user;
			log[action](req,res);  
		}else{
			res.send('you are not permit to visit this page');
		}  
      }else{      
       		res.send('Cannot GET  '+req.path);
      }
 }