var redisKeyManagement = {
	getWidgetKey: function(){
		return 'widget';
	},	
	getWidgetListKey: function(){
		return 'widgetlist';
	},
	getWidgetIdKey: function(){
		return 'global:widget';
	},
	getWidgetSidKey: function(){
		return 'widgetSid';
	},
	getDeliverKey: function(){
		return 'deliver';
	},
	getDeliverListKey: function(sid){
		return 'deliverlist:' + sid;
	},
	getDeliverIdKey: function(){
		return 'global:deliver';
	},
	getWidgetSearchKey: function(str){
		return 'WidgetSearch:' + str; 
	},
	getTmpSetKey: function(str){
		return 'tmpset:' + str;
	},
	getWidgetSortKey: function(id){
		return 'widgetSort:' + id;
	},
	changeLogIDKey : 'global:changeLog',
	changeLogKey : 'changeLog',
	changeLogListKey : 'changeLogList',
	changeLogSortKey : 'changeLogSort:',
	changeLogTmpKey : 'changeLogSort:',
};

module.exports = redisKeyManagement;