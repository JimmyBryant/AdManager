
/*
 * GET home page.
 */
var user = require('./user');
var admin = require('./admin');
var ad = require('./ad');
var site = require('./site');
var widget = require('./widget');
var log = require('./log');
var widgetManagement = require('../base/widgetManagement');

var index=function(req,res){	
	if(req.session.user){		
		var page=req.query.page||1;
		var pageSize=req.query.psize||10;
		var start=(page-1)*pageSize,
			end=start+pageSize-1;
		widgetManagement.getWidgetCount(function(count){
			var widgeCount=count,
				pageCount=Math.ceil(count/pageSize);
			var pager={
				curPage : parseInt(page),
				pageCount : pageCount,
				pageSize : pageSize,
				url : '/?'				
			};
			widgetManagement.listWidgets(start,end,function(siteList){				
				siteList=siteList.err?[]:siteList;				
				res.render('index',{siteList:siteList,pager:pager});
			});
		});		
	}else{
		res.redirect('/user/signin');
	}
};

exports.index = function(app){	

	app.get('/log/:action', log.index);	

	app.get('/site/:action',site.index);
	app.post('/site/:action',site.index);

	app.get('/widget/:action',widget.index);
	app.post('/widget/:action',widget.index);
	
	// app.get('/user/:action',user.index);
	// app.post('/user/:action', user.index);

	app.get('/admin/:action', admin.index);
	app.post('/admin/:action', admin.index);

	app.get('/',index);
};

exports.initIDKey = function(){	
	require('../base/deliverManagement').initDeliverID();
	require('../base/widgetManagement').initWidgetID();
};

