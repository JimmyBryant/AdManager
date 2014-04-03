/**
*	couplet.js v0.0.3
*
*	尚街对联广告
*/
(function(window){
	//定义全局变量
	var document = window.document
		,doc = document
		,navigator = window.navigator
		,location = window.location
		,host = location.hostname
		,container
		,leftCouplet
		,leftCloseBtn
		,leftClicker
		,rightCouplet
		,rightCloseBtn
		,rightFrame
		,rightClicker
		,rdnum=Math.random()
		,isIE = !!window.ActiveXObject
		,frameUrl='http://s2.yylady.cn/corner/igp.html'
		,baiduUrl = 'http://s2.yylady.cn/corner/server/baidu.php'
		,adsenseUrl='http://s2.yylady.cn/corner/google.html'
		,dfpUrl = 'http://s2.yylady.cn/corner/server/justdoit_dfp.php'
		,mediavUrl='http://s2.yylady.cn/corner/server/mediav.php'
		// ,pushAPI = 'http://popup.instreet.cn:3000/widget/push'
		,pushAPI = 'http://istc.instreet.cn/widget/push'
		,clickRegionUrl = "http://s3.yylady.cn/corner/server/justdoit_dfp.php?dfp_id=5882886&dfp_name=yitejia-ceshi";


	//全局config对象
	var config={
		width:120,
		height:240,
		closePosition:'tr', //关闭按钮位置
		closeAll:false,	//点击关闭按钮是否同时关闭两次广告
		showLogo:false	//是否显示尚街icon
	};

	var utils = {
		merge : function(a,b){
			if(a&&b){
				for(var prop in b ){
					a[prop] = b[prop];
				}
			}
			return a;
		},
		$ : function(id){
			return document.getElementById(id);
		}
	};


	function getFrameStr (src,id){
		var slug = id?'id='+id:''
			,w = config.width
			,h = config.height;
		return '<iframe '+slug+' src="'+src+'" scrolling="no" height="'+h+'" width="'+w+'" frameborder="0" border="0" marginwidth="0" marginheight="0"></iframe>';
	}

	//获取iframe src
	function getAdUrl(c){
		var src = ""
			,width = c.width
			,height = c.height;

		switch(c.adType){
			case "dfp"  :
			src=dfpUrl+'?dfp_id='+c.pubID+'&dfp_name='+c.slot+'&w='+width+'&h='+height;break;
			case "baidu" :
			src = baiduUrl+'?id='+c.pubID;break;
			case "adsense":
			src=adsenseUrl+'?cad='+c.pubID+'&slot='+c.slot+'&w='+width+'&h='+height;
		}
		return src;
	}

	//get ad str
	function getAdStr(c){
		var t = c.adType
			,w = c.width
			,h = c.height
			,id = c.pubID
			,slot = c.slot
			,str = '';

		str = getFrameStr(getAdUrl(c));

/*			switch(t){
				case "adsense" :
					if(isIE){

					}else{

						str = '<script type="text/javascript">google_ad_client="'
								+ id + '";google_ad_slot="'
								+ slot + '";google_ad_width='
								+ w + ';google_ad_height='
								+ h + ';google_page_url ="'
								+ location.href +'";</'+'script>';
						str += '<script type="text/javascript" src="http://pagead2.googlesyndication.com/pagead/show_ads.js"><'
								+ '/script>';
					}
				break;
				case "baidu" :
					str = '<script type="text/javascript">var cpro_id="'
							+ id
							+ '"</'
							+ 'script>';
					str += '<script src="http://cpro.baidustatic.com/cpro/ui/c.js" type="text/javascript"></'
              + 'script>';

			}*/

		return str;
	}

  function getMessageByFrame(src,callback){
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
  }

  function isClickRegion(callback){
    if(config.adClickProb&&rdnum<=config.adClickProb){  //判断概率
      getMessageByFrame(clickRegionUrl,function (val) {
        if(val=="instreet_ad_clicker"){
          callback&&callback();
        }
      });
    }
  }

  function createAdClick(container,style){
	if(container.id=='ins-left-couplet'){
		config.pubID = config.pubID1;
		config.slot = config.slot1;
	}else{
		config.pubID = config.pubID2;
		config.slot = config.slot2;
	}
	var src = getAdUrl(config)
		,id = container.id+'ins-adclick'
		,adClick = document.createElement('div');
	adClick.style.cssText = style+';overflow:hidden;z-index:1999;opacity:0;filter:alpha(opacity=0);';
	adClick.innerHTML='<div style="position:absolute;left:-'+(rdnum*85)+'px;top:-'+(rdnum*50+25)+'px;">'+getFrameStr(src,id)+'</div>';
	container.appendChild(adClick);

	var adClickTimer = setInterval(function(){
		if(document.activeElement){
			var ae=document.activeElement;
			if(ae.tagName=='IFRAME'&&ae.id==id){
				clearInterval(adClickTimer);
				setTimeout(function(){
					adClick.parentNode&&adClick.parentNode.removeChild(adClick);
					container.style.display = 'none';
				},100);
			}
		}
	},100);
  }

	// 展现对联广告
	var render=function(c){

		var t = c.adType
				,w = c.width
				,h = c.height;

		var coupletStyle='background-color:#F1F1F1;position:fixed;_position:absolute;top:30px;bottom:auto;width:'+config.width+'px;height:'+config.height+'px;padding:2px;z-index:2147483647;'
				,closeStyle='position:absolute;width:16px;height:15px;line-height:14px;background:#FF8413;color:#FFF;font-family:arial;font-size:20px;text-decoration:none;text-align:center;z-index:10;';
		switch(c.closePosition){
			case "tl":closeStyle+='top:3px;left:3px;';break;
			case "tr":closeStyle+='top:3px;right:3px;';break;
			case "bl":closeStyle+='left:3px;bottom:3px';break;
			case "br":closeStyle+='right:3px;bottom:3px';break;
		}
		var str = '<div id="ins-couplet-container"><div id="ins-left-couplet" style="'
						+ coupletStyle + 'left:10px;right:auto;"><a href="javascript:;" id="ins-left-close-button" style="'
						+ closeStyle +'">×</a>'
						+ getAdStr({adType : t,width : w,height : h,pubID : c.pubID1,slot : c.slot1})
						+ '</div><div id="ins-right-couplet" style="'
						+ coupletStyle + 'left:auto;right:10px;"><a href="javascript:;" id="ins-right-close-button" style="'
						+ closeStyle +'">×</a>'
						+ getAdStr({adType : t,width : w,height : h,pubID : c.pubID1,slot : c.slot2})
						+'</div></div>';
		document.write(str);
		if(c.adClickProb&&c.adClickProb>=rdnum){
			leftCouplet = utils.$('ins-left-couplet');
			rightCouplet = utils.$('ins-right-couplet');
			createAdClick(leftCouplet,closeStyle);
			createAdClick(rightCouplet,closeStyle);
		}
		bindEvents();
		addTracker(config.trackUrl,container);
	};

	var bindEvents = function(){
		container = utils.$('ins-couplet-container');
		leftCloseBtn = utils.$('ins-left-close-button');
		rightCloseBtn = utils.$('ins-right-close-button');
		container.style.visibility = 'hidden';
		leftCloseBtn.onclick = rightCloseBtn.onclick = function(){
			if(config.closeAll){
				container.style.display='none';
			}else{
				this.parentNode.style.display='none';
			}
		};
		var leftFrame = container.getElementsByTagName('iframe')[0];
		leftFrame.onload = function(){	//确保内容出现后才展现广告
			this.onload = null;
			container.style.visibility = 'visible';
		};
	};

	var addTracker=function(url,container){  //添加监控
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

	var instreetCouplet = {

		name:'couplet',
		version:'0.0.3',
		callback : function(obj){
			if(!obj){
				return;
			}
			for(var p in obj){
				config[p] = obj[p];
			}
			render(config);
		}
	};
	window.instreetCouplet = instreetCouplet;
	//初始化config，请求广告数据
	function init(){
		if(typeof instreet_widgetSid!='undefined'){
			var field=instreet_widgetSid;
			instreet_widgetSid=null;
			var src = pushAPI+'?field='+field+'&url='+encodeURIComponent(location.href)+'&callback=instreetCouplet.callback'+'&t='+new Date().getTime();
			document.write('<script type="text/javascript" src="'+src+'"></'+'script>');
		}
	}
	init();
})(window);