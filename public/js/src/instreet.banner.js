/* 
*	instreet banner widget
*	v0.0.1
*/
!(function(window){
	var document = window.document
		,doc = document
		,navigator = window.navigator
		,location = window.location
		,host = location.hostname
		;
	
	// var pushAPI = 'http://popup.instreet.cn:3000/widget/push'
	var pushAPI = 'http://istc.instreet.cn/widget/push'
		;

	//if exist banner widget then return	
	if(typeof window.InstreetBannerWidget!='undefined'&&typeof window.InstreetBannerWidget=='object'){		
		return;
	}

	//常用方法集
	var util = {	
		bind : function(elem,e,fn){
			if(elem.addEventListener){
				elem.addEventListener(e,fn,false);
			}else if(elem.attachEvent){
				elem.attachEvent("on"+e,fn);
			}else{
				elem["on"+e] = fn;
			}
		},
		importFile  :function(type,name){
			var link,script,
			head=document.getElementsByTagName( "head" )[0] || document.documentElement;
			switch(type){
			case "js":
				script=document.createElement('script');
				script.async="async";
				script.charset="utf-8";
				script.type="text/javascript";
				script.onload=script.onreadystatechange=function() {
					if(!script.readyState || script.readyState === "loaded" || script.readyState === "complete"){
						script.onload = script.onreadystatechange = null;
						if ( head && script.parentNode ) {
						head.removeChild( script );
						}
					}
				};
				script.src=name;
				head.appendChild(script);
				break;
			case "css":
				link = document.createElement("link");link.type = "text/css";link.rel = "stylesheet";
				link.href=name;
				head.appendChild(link);
				break;
			}
		}
	};
	
	var $ = function(id){
		return document.getElementById(id);
	};

	var InstreetBannerWidget = {
		name:'bannerWidget',
		version:'0.0.1',
		config : {},
		callback : function(obj){
			if(!obj){
				return;
			}
			var c = InstreetBannerWidget.config;
			for(var p in obj){
				c[p] = obj[p];
			}
			render(c);
		}
	};	
	window.InstreetBannerWidget = InstreetBannerWidget;

	var render = function(c){
		var container = InstreetBannerWidget.container
			,adBox = document.createElement('div')
			,closeBtn = document.createElement('a')
			,type = c.adType
			;
		closeBtn.id = 'ins-banner-close-btn';		
		closeBtn.innerHTML = 'close';
		if(type=='adsense'){
			writeCodeStr(adBox,c);			
			adBox.appendChild(closeBtn);			
			container.appendChild(adBox);
			setBannerStyle(adBox,c);
			bindEvents(adBox);
		}else{
			return;
		}

		function writeCodeStr(adBox,c){
			var str = ''
				,t = c.adType
				,pubID = c.pubID
				,slot = c.slot
				,w = c.width
				,h = c.height
				;
			switch(t){			
				default :
				if(!window.adsbygoogle){
					adsenseJsUrl = 'http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
					util.importFile('js',adsenseJsUrl);
				}
				str = '<ins class="adsbygoogle"style="display:inline-block;width:'
					+w
					+'px;height:'
					+
					h
					+'px"data-ad-client="'
					+pubID
					+'"data-ad-slot="'
					+slot
					+'"></ins>';
				(adsbygoogle = window.adsbygoogle || []).push({});
				break;
			}
			adBox.innerHTML = str;						
		}

		function setBannerStyle(adBox,c){
			var fixedStyle = ';position:fixed;left:0;right: 0;bottom:0;_position:absolute; _background-image:url(about:blank); _background-attachment:fixed;_top:expression(eval((document.documentElement.scrollTop||document.body.scrollTop)+(document.documentElement.clientHeight||document.body.clientHeight)-this.offsetHeight-(parseInt(this.currentStyle.marginTop,10)||0)-(parseInt(this.currentStyle.marginBottom,10)||0)));z-index:2199999;';
			var bannerStyle = ';width:100%;_width:expression(eval(document.body.clientWidth));background-color:'+c.bgColor+';height:'+c.height+'px;border-top:4px solid #999;text-align:center;';
			var closeStyle = 'position:absolute;display:block;top:5px;right:10px;background:url(http://note.youdao.com/yws/public/resource/1f9b12f0097fd4a8c8badffac3dfdd5d/4B80EB883764433CA9F5AF195811FB06) no-repeat;font-size:0;width:16px;height:16px;cursor:pointer;';
			var closeBtn = adBox.lastChild;
			adBox.style.cssText = fixedStyle+bannerStyle;
			closeBtn.style.cssText = closeStyle;
			
		}

		function bindEvents(adBox){
			var closeBtn = adBox.lastChild;
			closeBtn.onclick = function(){
				adBox.style.display = 'none';
			};
		}		
	};

	//初始化config，请求广告数据
	function init(){
		if(typeof instreet_widgetSid!='undefined'){
			var field=instreet_widgetSid;
			instreet_widgetSid=null;
			InstreetBannerWidget.container = $('ins-banner-'+field);
			var src = pushAPI+'?field='+field+'&url='+encodeURIComponent(location.href)+'&callback=InstreetBannerWidget.callback'+'&t='+new Date().getTime();
			util.importFile('js',src);
			// document.write('<script type="text/javascript" src="'+src+'"></'+'script>');
		}
	}
	init();	
})(window);