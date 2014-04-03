define(function(require, exports, module){
	var $=jQuery=require('jquery');	
	require('easyform');
	var mesTimer=null;
	var logMessage=function(type,mes){
		clearTimeout(mesTimer);
		$alert=$('.alert');
		$alert[0].className="alert alert-"+type;
		if(type=="success"){
			$('strong',$alert).html("Success:");
		}else if(type=="error"){
			$('strong',$alert).html("Error:");
		}
		$('.mes',$alert).html(mes);
		if(type=="success"){
			$alert.fadeIn(function(){
				mesTimer=setTimeout(function(){
					$alert.fadeOut();
				},5000);
			});			
		}else{
			$alert.fadeIn();
		}

	};
	var validate={
		validateSite : function(type){
			$('form.required-form').easyform({
				fields : {
					'#siteName' : {
						error : '网站名称不能为空'
					},
					'#domain' : {
						error : '网站域名不能为空',
						notUrl : {
							test : /^(?!http:\/\/|https:\/\/)([\w]+\.)+[\w]+$/,
							message : '网站域名不能包含http://'
						}
					},
					'#logoUrl' : {
						error : '网站Logo不能为空'
					},
					'#isAlive' : {

					}
				},
				success : function(){
					var siteName = $.trim($('#siteName').val()),
						domain = $('#domain').val(),
						logoUrl = $('#logoUrl').val(),
						isAlive = $('#isAlive').val(),
						oSiteName = $.trim($('#oSiteName').val()),
						API = '',
						mes = '',
						createAPI = '/site/create',
						editAPI = '/site/edit';	
					var obj = {
						siteName : siteName,
						domain : domain ,
						logoUrl : logoUrl ,
						isAlive : isAlive,
						oSiteName : oSiteName
					};
					if(type == 'edit'){
						obj.field = $('#siteField').val();
						API = editAPI;
						mes = '修改网站成功';
					}else{
						API = createAPI;	
						mes = '创建网站成功';			
					}	
					$.post(API,obj,function(result){
						if(result){
							if(result.err){
								logMessage('error',result.err);
							}else{
								logMessage('success',mes);
							}
						}
						return false;
					});	
					return false;		
				}
			});
		},
		validateWidget:function(type){
			var isCouplet = $('.ad-couplet').length;
			var fields = ['#widgetName','#adType','#adSize','#isAlive'];
			(isCouplet?fields.concat(['#pubID1','#slot1','#pubID2','#slot2']) : fields.concat(['#pubID','#slot']));
			var wf = $('#widget-data-form').easyform({
				fields : fields
			});
			return wf;
		}
	};
	module.exports=validate;
});