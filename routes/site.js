// site.js

var method = "",
	user = null,
	params = {};

var  siteManagement = require('../base/widgetManagement'),
	widgetManagement = require('../base/deliverManagement'),
	search = require('../base/search.js');

var site = {
	create : function  (req,res) {			
		if(user.isAdmin){
			if(method=='GET'){
				res.render('site/create');
			}else if(method=='POST'){
				var siteName = params.siteName,
  					domain = params.domain,
  					logoUrl = params.logoUrl,
  					isAlive = params.isAlive;
  				if(siteName&&domain&&logoUrl){
  					var domainReg = /^(?!http:\/\/|https:\/\/)([\w]+\.)+[\w]+$/;
  					if(domainReg.test(domain)){  						  			
	  					var obj = {
	  						siteName : siteName , 
	  						domain : domain , 
	  						logoUrl : logoUrl , 
	  						isAlive : isAlive,
	  						timestamp : new Date().getTime()
	  					};
	  					siteManagement.createWidget(obj,function(result){
	  						if(result.err){
	  							res.send({err : result.err});
	  						}else{
	  							res.send({success : true});
	  						}
	  					});
	  				}else{
	  					res.send({err : '域名不能包含http://'});	
	  				}
  				}else{
  					res.send({err:'网站信息不能为空'});
  				}
			}
			
		}else{
			res.send("sorry,you have no permission to this page!");
		}
	},
	edit : function(req,res){
		if(user.isAdmin){
			if(method == 'GET'){
				var field = req.query.field;
				siteManagement.widgetDetail(field , function(result){
					var obj = result?JSON.parse(result) : {};
					obj.field = field;					
					res.render('site/edit',{site : obj});
				});
			}else if(method == 'POST'){
 				var field = params.field,
 					oSiteName = params.oSiteName,
 					siteName = params.siteName,
 					logoUrl = params.logoUrl,
 					isAlive = params.isAlive;
 				siteManagement.widgetDetail(field,function(result){
 					var obj = null; 					
 					if(result){
 						var obj = JSON.parse(result);
 						obj.oSiteName = params.oSiteName;
 						obj.siteName = siteName;
 						obj.logoUrl = logoUrl;
 						obj.isAlive = isAlive; 						
 						obj.lastModifyDate = new Date().getTime();  						
		 				siteManagement.editWidget(obj,function(result){
		 					if(result.err){
		 						res.send({err : result.err});
		 					}else{
		 						res.send({success : true});
		 					}
	 					});
 					}else{
 						res.send({err : 'failed to edit this site'});
 					}

 				});	
			}			

		}else{
			res.send("sorry,you have no permission to this page!");
		}
	},
	details : function(req,res){		
		var field = req.param('field');
		if(field){
			siteManagement.widgetDetail(field,function(result){					
				if(result){
					var obj = JSON.parse(result);
					var sid = obj.sid;
					widgetManagement.listDelivers(sid,0,-1,function(result){	//get all widgets
						obj.widgetList = result.err ?[]:result;							
						res.render('site/details',{site : obj});
					});
				}else{
					res.send('can not find info of the site ');
				}
			});
		}else{
			res.send('cannot find the site');
		}		
	},
	updateState : function(req,res){
		if(user.isAdmin){			
			var field = req.param('field'),
				state = req.param('state');			
			function callback(result){
				if(result.err){
					res.send({err : result.err});
				}else{
					res.send({success : true});
				}
			}
			console.log(state == true,state)
			if(state == true){
				siteManagement.activeWidget(field,callback);
			}else{
				siteManagement.stopWidget(field,callback);
			}			
		}else{
			res.send("sorry,you have no permission to this page!");
		}
	},
	delete : function(req,res){
		if(user.isAdmin){
			var field = req.param('field');
			if(field){
				siteManagement.widgetDetail(field,function(result){
					if(result.err){
						res.send({err : 'can not find the site to delete'});
					}else{
						var obj = JSON.parse(result);
						siteManagement.stopWidget(field,function  (result) {
							if(result.err){
								res.send({err : result.err});
							}else{
								siteManagement.delWidget(obj,function(result){
									if(result.err){
										res.send({err : result.err});
									}else{
										res.send({success : true});
									}
								});
							}
						});		
					}
				});
			}else{
				res.send({err : 'can not delete the site'});
			}							
		}else{
			res.send("sorry,you have no permission to this page!");
		}
	},
	search : function(req,res){  
		var  config = res.locals.config,
			keywords = req.param('keywords')||'',
			str = req.cookies[config.authCookieName];

		search.analysis(str,keywords,function(num){			
			if(num>0){
				var page = req.param('page')||1,					
					pageSize=req.param('psize')||10;
				var start=(page-1)*pageSize,
					end=start+pageSize-1;
				var pager={
						curPage : parseInt(page),
						pageCount : Math.ceil(num/pageSize),
						pageSize : pageSize,
						url : '/site/search?keywords='+keywords+'&'				
				};
				search.search(str,start,end,function(result){	
					res.render('site/search',{keywords : keywords,result : result,pager : pager});	
				});
			}else{
				res.render('site/search',{keywords : keywords,result : {} });	
			}
		});

	}
}

exports.index=function(req,res){	
      var action=req.params.action; 
          
      if(action&&site[action]){
		if(req.session.user){      	
			method = req.method;
			params = req.body;
			user = req.session.user;
			site[action](req,res);  
		}else{
			res.redirect('/user/signin');
		}  
      }else{      
       	res.send('Cannot GET  '+req.path);
      }

  }