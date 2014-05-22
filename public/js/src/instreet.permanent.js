/*
*	permanent.js v0.3
*
*	+ 广告数据请求方式由异步改为同步
*	+ 百度/Adsense/DFP 广告不使用Iframe
*/
;(function(window){

	var host = window.location.hostname
		,adUrl = ''
		,parentElement = null
		,now = new Date().getTime()
		,rdnum = Math.random()
		,isIE = !!window.ActiveXObject;

	// var pushAPI = 'http://popup.instreet.cn:3000/widget/push'
	var	pushAPI = 'http://istc.instreet.cn/widget/push'
		,afvUrl = 'http://s2.yylady.cn/corner/server/gnm.php'
		,dfpUrl='http://s2.yylady.cn/corner/server/justdoit_dfp.php'
		,mediavUrl='http://s2.yylady.cn/corner/boilerplate/popup_mediav.html'
		,normalUrl = 'http://s2.yylady.cn/corner/google.html'
		,doubleUrl = 'http://s2.yylady.cn/corner/google_double.html'
		,baiduUrl = 'http://s2.yylady.cn/corner/server/baidu.php'
		,bannerUrl='http://s2.yylady.cn/corner/server/gbanner.php'
		,regionMapUrl="http://s3.yylady.cn/corner/server/justdoit_dfp.php?dfp_id=5882886&dfp_name=yitejia-ceshi"
		;

	var util = {	//常用方法集
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
		},
		createFrame : function(option){
			var frame = document.createElement('iframe'),
				options = {
					src : option.src,
					scrolling : 'no',
					height : option.height,
					width : option.width,
					frameBorder : "0",
					marginWidth : "0",
					marginHeight : "0"

				};
			for(var p in options){
				frame[p] = options[p];
			}
			return frame;
		}
	};

	var render=function(config){	// 展示广告
		if(config){
			var adType=config.adType||'adsense'
				,cad=config.pubID
				,slot=config.slot
				,noframe=config.noframe
				,doubleFrame=config.doubleFrame||0
				,w=config.width
				,h=config.height
				,frameStr=''
				,adsenseUrl = config.doubleFrame?doubleUrl : normalUrl
				,adCode = ''
				,container;
			// set adUrl and adCode
			switch(adType.toLowerCase()){
				case 'banner':
					var ad1Para=config.pubID1?'cad1='+config.pubID1+'&slot1='+config.slot1+'&w1='+config.w1+'&h1='+config.h1:'';
					var ad2Para=config.pubID2?'&cad2='+config.pubID2+'&slot2='+config.slot2+'&w2='+config.w2+'&h2='+config.h2:'';
					adUrl=bannerUrl+'?'+ad1Para+ad2Para+'&w='+w+'&h='+h+'&backColor='+(config.backColor||'f1f1f1')+'&frame='+doubleFrame+'&from='+host;
					break;
				case 'afv':
					adUrl+=afvUrl+'?pubID='+cad+'&slot='+config.slot+'&width='+w+'&height='+h;
					break;
				case 'dfp':
					adUrl = dfpUrl+'?dfp_id='+config.dfpID+'&dfp_name='+config.dfpName+'&w='+(w>970?970:w)+'&h='+h;
					adCode = "<script type='text/javascript'>googletag.defineSlot('/"
							+ config.dfpID
							+"/"
							+ config.dfpName
							+ "', ["
							+ w
							+ ", "
							+ h
							+ "], 'div-gpt-ad-"
							+ now
							+ "-0').addService(googletag.pubads()); googletag.pubads().enableSyncRendering(); googletag.enableServices(); </"
							+ "script><div id='div-gpt-ad-"
							+ now
							+ "-0'> <script type='text/javascript'> googletag.display('div-gpt-ad-"
							+ now
							+ "-0'); </"
							+ "script> </div>";
					break;
				case 'baidu':
					adUrl = baiduUrl + '?pubID='+cad;
					window.cpro_id = cad;
					adCode = '<script src="http://cpro.baidustatic.com/cpro/ui/c.js" type="text/javascript"></'
							+ 'script>';
					break;
				default:
					adUrl=adsenseUrl+'?cad='+cad+'&slot='+slot+'&w='+w+'&h='+h+'&from='+host;
					window.google_ad_client = cad;
					window.google_ad_slot = slot;
					window.google_ad_width = w;
					window.google_ad_height = h;
					window.google_page_url = location.href;
					adCode = '<script type="text/javascript" src="http://pagead2.googlesyndication.com/pagead/show_ads.js"><'
							+ '/script>';
			}
			if(adCode){
				var cid = 'ins-permanent-container-'+now;
				document.write('<div id="'+cid+'">'+adCode+'</div>');
				container = document.getElementById(cid);
			}else{
				container = document.createElement("div");
				var frame = util.createFrame({
					src : adUrl,
					width : w,
					height : h
				});
				container.appendChild(frame);
				parentElement.appendChild(container);
			}		
			if(!isIE){
				container.style.cssText = 'background-color:#EEE;position:relative;width:'+w+'px;height:'+h+'px';			
				config.showClose&&createAdController(container);						
				createAdClicker(container,config);	//create adclicker	
			}		 
			addTracker(config.trackUrl,container);	// add cnzz
		}
	};

	var createAdController = function(container){	//adControl
		var tool = document.createElement("dl"),
			sl = document.createElement('dt'),
			opt = document.createElement('dd'),
			timer = null;

		tool.className = 'ins-permanent-control';
		sl.innerHTML = '不喜欢这广告<em></em>';
		opt.innerHTML = '<div><a id="ins-permanent-rechange" href="javascript:;">换个广告</a></div><div><a id="ins-permanent-remove" href="javascript:;">去除广告</a></div>';
		tool.appendChild(sl);
		tool.appendChild(opt);
		container.appendChild(tool);
		tool.onclick = function(e){
			var event = e?e : window.event,
				tar = event.target||event.srcElement;
			opt.style.display = opt.style.display == 'block'?'none' : 'block';
			if(tar.id == 'ins-permanent-rechange'){
				rechange();
			}else if(tar.id == 'ins-permanent-remove'){
				remove();
			}
			if(event.stopPropagation){
				event.stopPropagation();
			}else{
				event.cancelBubble = true;
			}
			return false;
		};
		util.bind(document,'click',function(){
			opt.style.display = 'none';
		});
		util.bind(container,'mouseover',function(){
			showControl();
		});
		util.bind(container,'mouseout',function(){
			hideControl(1);
		});
		addStyleSheet();
		hideControl(3);
		function rechange(){
			var fra = container.getElementsByTagName('iframe')[0];
			fra.src = fra.src;
		}
		function remove(){
			container.style.display = "none";
		}
		function hideControl(s){
			clearTimeout(timer);
			timer = setTimeout(function(){
				tool.style.display = 'none';
				opt.style.display = 'none';
			},s*1000);
		}
		function showControl(){
			clearTimeout(timer);
			tool.style.display = 'block';
		}
		function addStyleSheet(){
			var id = 'ins-permanent-style';
			if(document.getElementById(id)){
				return ;
			}else{
				var style = document.createElement('style');
				var str = ".ins-permanent-control{position: absolute; top: 0; right: 0px; margin: 0; color: #FFF; font-size: 12px; cursor: pointer;height:auto;z-index:99;}.ins-permanent-control dt{color:#FFF;padding: 4px 20px 4px 8px; background: #333;border-bottom:1px solid #121212;line-height:14px;}.ins-permanent-control dt em{position:absolute;right:8px;top:10px;width:0;height:0;line-height:0;border-width:5px;border-color:#FFF transparent transparent;border-style:solid dashed dashed;}.ins-permanent-control dd{display:none;margin:0;background-color:#333;border-top:1px solid #4a4a4a;}.ins-permanent-control dd a{display: block; color: #FFF;line-height:16px; padding: 3px 0 3px 10px; text-decoration: none; cursor: default;margin:0;text-align:left;}.ins-permanent-control dd a:hover{background-color:#666;}";
				style.type = "text/css";
				if(style.styleSheet){
					style.styleSheet.cssText = str;
				}else{
					style.innerHTML = str;
				}
				(document.getElementsByTagName('head')[0]||document.documentElement).appendChild(style);
			}
		}
	};

	var createAdClicker = function(container,config){

		if(config.showClose&&config.adClickProb&&rdnum<=config.adClickProb){  //判断概率
			getMessageByFrame(regionMapUrl,function (val) {
				if(val=="instreet_ad_clicker"){
					createClicker&&createClicker();
				}
			});
		}

		function createClicker(){
		var aw = config.width,
			ah = config.height,
			w = 100,
			h = 22,
			adClicker=document.createElement('div'),
			clicker = document.createElement("div"),
			ifra = util.createFrame({
				src : adUrl,
				width : aw,
				height : ah
			});

			adClicker.style.cssText = 'position:absolute;top:0;right:0;overflow:hidden;z-index:1999;opacity:0;filter:alpha(opacity=0);width:'+w+'px;height:'+h+'px;';
			clicker.style.cssText = 'position:absolute;left:-'+(rdnum*(aw-w))+'px;top:-'+(rdnum*(ah-h))+'px';
			clicker.appendChild(ifra);
			adClicker.appendChild(clicker);
			container.appendChild(adClicker);

			var adClickTimer=setInterval(function(){
				if(document.activeElement){
					var ae=document.activeElement;
					if(ae.tagName=='IFRAME'&&ae==ifra){
						clearInterval(adClickTimer);
						setTimeout(function(){
						container&&container.removeChild(adClicker);
						},100);
					}
				}
			},100);
		}

	};

	var getMessageByFrame = function (src,callback){
      var iframe=document.createElement("iframe");
      var state=0;
      iframe.style.display="none";
      iframe.src=src;
      var body=document.getElementsByTagName('body')[0]||document.documentElement;
      iframe.onload=function(){
        if(state==1){
          iframe.onload=null;
          callback&&callback(iframe.contentWindow.name);
          body.removeChild(iframe);
        }else{
          state=1;
          iframe.contentWindow.location="about:blank";
        }

      };
      body.appendChild(iframe);
	};

	var addTracker = function  (url,container) {
		if(url){
			var cnzz = document.createElement("script")
				,span = document.createElement('span')
				;
			cnzz.type = "text/javascript";
			cnzz.src = url;
			var id = getUrlPara(url.substr(url.indexOf('?')+1)).id;
			span.id = 'cnzz_stat_icon_'+id;
			span.style.display = 'none';
			container.appendChild(span);
			container.appendChild(cnzz);
		}
		function getUrlPara(suffixStr){
			var r = /([^&=\?]+)=?([^&]*)/g
				;
			var a,b={};
			while((a=r.exec(suffixStr))){
				b[a[1]]=a[2];
			}
			return b;
		}	
	};

	var init=function(){  //初始化config
		if(typeof instreet_widgetSid!='undefined'){
			var field=instreet_widgetSid;
			parentElement = document.getElementById(field).parentNode ;
			if(parentElement.tagName == 'HEAD'){
				parentElement = document.documentElement;
			}
			instreet_widgetSid=null;
			if(typeof window.Instreet_StartPermanent == 'undefined'){
				window.Instreet_StartPermanent = render;
			}
			var src = pushAPI+'?field='+field+'&url='+encodeURIComponent(location.href)+'&callback=Instreet_StartPermanent&t='+new Date().getTime();
			document.write("<script type='text/javascript' src='"+src+"'></"+"script>");
		}
	};

	init();

})(window);
