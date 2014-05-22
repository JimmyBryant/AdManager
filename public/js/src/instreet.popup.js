/*
  底部弹窗 v0.1.0

  + 去除Iframe
  + 支持百度广告
*/
(function (window) {

  // 全局配置
  var config = {
    adType:'adsense',  //广告类型,默认adsense,可选baidu,afv,dfp
    closePosition:'br',  //关闭按钮位置
    showReplay:false, //是否显示重新播放
    closeReplay:false,
    showLogo:true,
    stopAd:true,
    width:300,
    height:250,
    version:'0.1.0'
  };

  var doc=window.document
  ,location=window.location
  ,host=location.host
  ,isIE = !!window.ActiveXObject
  ,isIE6 = isIE&&!window.XMLHttpRequest
  ,now = Date.now?Date.now():new Date().getTime()
  ,body = document.getElementsByTagName('body')[0]||document.documentElement
  ,callback = 'InstreetPopupStart_'+now
  ,$container
  ,$close
  ,$replay
  ,$logo
  ,close_style=''
  ,width
  ,height
  ,timer=null //定时最小化计时器
  ,timerId=null
  ,rdnum=Math.random()
  ,useFrame=false;

  var pushAPI = "http://istc.instreet.cn/widget/push",
  // var pushAPI = "http://popup.instreet.cn:3000/widget/push",
      dfpUrl="http://s3.yylady.cn/corner/server/justdoit_dfp.php",
      afvUrl="http://s3.yylady.cn/corner/server/gnm.php",            
      regionMapUrl="http://s3.yylady.cn/corner/server/justdoit_dfp.php?dfp_id=5882886&dfp_name=yitejia-ceshi";

  var utils = {
    $ : function(id){
      return document.getElementById(id);
    }
  };
  
  function getDFPUrl(c){
    return dfpUrl+'?dfp_id='+c.dfpID+'&dfp_name='+c.dfpName+'&w='+(c.width||300)+'&h='+(c.height||250);
  }

  function getFrameStr(src,id){
    var slug = id?'id='+id:'';
    var w = config.width,
        h = config.height;
    return '<iframe '+slug+' src="'+src+'" scrolling="no" height="'+h+'" width="'+w+'" frameborder="0" border="0" marginwidth="0" marginheight="0"></iframe>';
  }

  function writeCodeToFrame(frame,str,callback){
    var state = 0        
        ,shouldSetDomain = isIE&&document.domain!=document.location.host
        ,now = new Date().valueOf()
        ,param = 'frameContScript_'+now
        ,htmlArr = ['<html><head></head><body>','</body></html>']        
        ;
    htmlArr[1] = str;    
    var frameScript = 'javascript:(function(){document.open();'
                    +(shouldSetDomain?'document.domain="'
                    +document.domain+'";':'')
                    +'document.close();})();';
    frame.scrolling='no';
    frame.frameBorder=0;
    frame.marginWidth=0;
    frame.marginHeight=0;
    frame.src = frameScript;

    var timer = setInterval(function(){ // write content to frame
      try{
        frame.contentWindow.document.write(htmlArr.join(""));
        clearInterval(timer);
      }catch(e){}
    },100);

  }

  function getMessageByDFP(id,name,callback){
    var src = getDFPUrl({dfpID:id,dfpName:name})
        ,frame = document.createElement("iframe")
        ,state = 0
        ,shouldSetDomain = isIE&&document.domain!=document.location.host
        ,body = document.getElementsByTagName('body')[0]||document.documentElement
        ; 
    frame.style.display = "none";   
    if(shouldSetDomain){
      var htmlArr = ['<html><head></head><body>','</body></html>']
          ,cont = getAdCode({adType:'dfp',dfpID:id,dfpName:name})
          ;
      htmlArr[1]=cont;
      writeCodeToFrame(frame,htmlArr.join(''));
      var t1 = setInterval(function(){        
        try{
          if(frame.contentWindow.frames.length){            
            clearInterval(t1);
            var val = typeof frame.contentWindow.frames[0].name == 'string'?frame.contentWindow.frames[0].name:'';            
            callback(val);
            frame.parentNode&&frame.parentNode.removeChild(frame);
          }
        }catch(e){}
      },100);
    }else{
      frame.src=src;      
      frame.onload=function(){
        if(state==1){
          frame.onload=null;          
          callback&&callback(frame.contentWindow.name);
          body.removeChild(frame);
        }else{
          state=1;
          frame.contentWindow.location="about:blank";
        }
      };
    }
    body.appendChild(frame);    
  }

  function renderAd(c){ //输出广告代码
    var str = getAdCode(c)
        ,w = c.width
        ,h = c.height        
        ;

    if(isIE){
      var hasContainer = !!$container;  
      if(!hasContainer){  //if container not exist,create one
        $container = document.createElement('div');
        $container.id='ins-popup-container';
        body.appendChild($container);
      }
      if(c.adType == 'dfp'){
        var src=getDFPUrl(c);
        $container.innerHTML = getFrameStr(src);  
      }else{
        if(useFrame){
          var frame = document.createElement('frame');
          frame.style.cssText = 'width:'+w+'px;height:'+h+'px;';
          writeCodeToFrame(frame,str);
          $container.appendChild(frame);
        }else{          
          document.write(str);
        }
      }
    }else{
      var adStr = '<div id="ins-popup-container">'+str+'</div>';
      document.write(adStr);
      $container = utils.$('ins-popup-container');
    }
  }

  function createAdClick(){ //创建关闭按钮覆盖层

    var frame = document.createElement('iframe')
        ,w = config.width
        ,h = config.height
        ;
    frame.id = 'ins-popup-adclicker';
    frame.style.cssText = "width:"+w+'px;height:'+h+'px;';
    if(isIE&&config.adType=='dfp'){
      frame.src = getDFPUrl(config);
    }else{
      writeCodeToFrame(frame,getAdCode(config));
    }
    $adClick = document.createElement('div');
    $adClick.style.cssText = close_style+';overflow:hidden;z-index:1999;opacity:0;filter:alpha(opacity=0);';
    $adClick.innerHTML='<div style="position:absolute;left:-'+(rdnum*180+50)+'px;top:-'+(rdnum*180+25)+'px;"></div>';
    $container.appendChild($adClick);
    $adClick.lastChild.appendChild(frame);

    var adClickTimer=setInterval(function(){
      if(document.activeElement){
          var ae=document.activeElement;
          if(ae.tagName=='IFRAME'&&ae.id=='ins-popup-adclicker'){
            clearInterval(adClickTimer);
            setTimeout(function(){
              minimise(function(){
                $adClick.parentNode&&$adClick.parentNode.removeChild($adClick);
              });
            },100);
          }
      }
    },100);
  }

  function isClickRegion(callback){
    if(config.adClickProb&&rdnum<=config.adClickProb){  //判断概率
      getMessageByDFP('5882886','yitejia-ceshi',function (val) {        
        if(val=="instreet_ad_clicker"){          
          callback&&callback();
        }
      });
    }
  }

  function minimise(callback){  //最小化广告
      clearInterval(timerId);
      clearTimeout(timer);
      if(config.widgetStyle == 2){
        $container.style.display = 'none';
        if($replay){
          $replay.style.display="block";
        }
        callback&&callback();
      }else{
        slideHeight($container,0,function(){
          if($replay){
            $replay.style.display="block";
          }
          callback&&callback();
        });
      }
  }

  function maximize(){  //展示广告
      if(config.widgetStyle==2){
        $container.style.display = 'block';
      }else{
        slideHeight($container,config.height);
      }      
      if($replay)
        $replay.style.display="none";      
      if(parseFloat(config.minitime)){  //定时最小化
        clearTimeout(timer);
        timer=setTimeout(minimise,config.minitime*1000);
      }
  }

  function slideHeight(elem,dest,callback){ // slide方法

      var start = new Date().getTime()
          ,ori = parseFloat(elem.clientHeight)
          ,speed=400
          ,diff=dest-ori
          ,oriCss=elem.style.cssText;
      elem.style.display="block";
      elem.style.overflow="hidden";
      if(dest!==0){
        elem.style.height=0;
      }
      var slide = function(){

        var now=new Date().getTime()
            ,p=(now-start)/speed;

        if(p<1){

          elem.style.height  = (ori+((-Math.cos(p*Math.PI)/2) + 0.5) * diff)+'px';

        }else{

          clearInterval(timerId);
          elem.style.cssText=oriCss;
          elem.style.height=dest+'px';
          if(dest===0){
            elem.style.display="none";
          }else{
            elem.style.display="block";
          }
          callback&&callback.call(elem);  //回调函数
        }

      };

      timerId = setInterval(function(){slide();},13);
  }

  var bindEvents=function(){

      $close.onclick=function(){
        minimise();
      };

      $close.onmouseover =$close.onmouseout = function(){
        if(config.widgetStyle==2){
          var bc = this.lastChild.style.backgroundColor;          
          if(bc=='rgb(0, 102, 204)'||bc=='#0066cc'){
            this.firstChild.style.backgroundColor=this.lastChild.style.backgroundColor = '#999999';
          }else{            
            this.firstChild.style.backgroundColor=this.lastChild.style.backgroundColor = '#0066cc';
          }
        }else{
          var c = this.style.color;
          if(c=='rgb(0, 0, 0)'||c=='#000'){
            this.style.color='#FFF';
            this.style.backgroundColor='#58585A';
          }else{
            this.style.color='#000';
            this.style.backgroundColor='#CDCCCC';
          }
        }
      };

      if(config.showReplay){
        $replay.onclick=function(){
          maximize();
        };
        var replay_close = $replay.getElementsByTagName('a');
        if(replay_close.length){
          replay_close[0].onclick=function(){ //移除右下角广告
            $container.parentNode&&$container.parentNode.removeChild($container);
          };
        }
      }

      if(config.showLogo){
        var img1=$logo.getElementsByTagName('img')[0],
            img2=$logo.getElementsByTagName('img')[1];
        img1.onmouseover=function(){
          this.style.display="none";
          img2.style.display="block";
        };
        img2.onmouseout=function(){
          this.style.display="none";
          img1.style.display="block";
        };
      }

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


  function getAdCode(c){  //return ad code string

    var t = c.adType
      ,id = c.pubID
      ,slot = c.slot
      ,dfpID = c.dfpID
      ,dfpName = c.dfpName
      ,w = c.width||300
      ,h = c.height||250
      ,str = ''
      ,isIE = !!window.ActiveXObject
      ,now = Date.now?Date.now():new Date().getTime()
      ;

    switch(t){
      case 'afv':
        var afvUrl = 'http://oss.instreet.cn/source/afv_fl_s2_v2.swf?pubID='
                  +id
                  +'&slot='
                  +slot
                  +'&width='
                  +w
                  +'&height='
                  +h
                  +'&clickProb=0';
        str = '<object  id="instreet-afv-'
            +now
            +'" name="instreet-afv-'
            +now
            +'" width="'
            +w
            +'" height="'
            +h
            +'"  align="middle" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=10,0,0,0" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"><param value="always" name="allowScriptAccess"/><param value="'
            +afvUrl
            +'" name="movie"/><param value="high" name="quality"/><param value="transparent" name="wmode"/><embed id="instreet-afv-'
            +now
            +'" name="instreet-afv-'
            +now
            +'" src="'
            +afvUrl
            +'"  width="'
            +w
            +'" height="'
            +h
            +'" align="middle" pluginspage="http://www.adobe.com/go/getflashplayer"  type="application/x-shockwave-flash" allowscriptaccess="always" wmode="transparent"  quality="high" /></object>';
        break;
      case 'dfp':
        str = isIE?("<script type='text/javascript'> var googletag = googletag || {}; googletag.cmd = googletag.cmd || []; (function() {var gads = document.createElement('script'); gads.async = true; gads.type = 'text/javascript'; var useSSL = 'https:' == document.location.protocol; gads.src = (useSSL ? 'https:' : 'http:') + '//www.googletagservices.com/tag/js/gpt.js'; var node = document.getElementsByTagName('script')[0]; node.parentNode.insertBefore(gads, node); })(); </"
            +"script><script type='text/javascript'>googletag.cmd.push(function() {googletag.defineSlot('/"
            +dfpID
            +"/"
            +dfpName
            +"', ["
            +w
            +", "
            +h
            +"], 'div-gpt-ad-"
            +now  
            +"-0').addService(googletag.pubads());googletag.enableServices(); });</"
            +"script><div id='div-gpt-ad-"
            +now
            +"-0' style='width:"
            +w
            +"px; height:"
            +h
            +"px;'><script type='text/javascript'>googletag.cmd.push(function() { googletag.display('div-gpt-ad-"
            +now
            +"-0'); });</"
            +"script></div>"):("<script type='text/javascript'>(function() {var useSSL = 'https:' == document.location.protocol; var src = (useSSL ? 'https:' : 'http:') + '//www.googletagservices.com/tag/js/gpt.js'; document.write('<scr' + 'ipt src=\"' + src + '\"></scr' + 'ipt>'); })(); </"
            +"script><script type='text/javascript'>googletag.defineSlot('/"
            +dfpID
            +"/"
            +dfpName
            +"', ["
            +w
            +", "
            +h
            +"], 'div-gpt-ad-"
            +now
            +"-0').addService(googletag.pubads()); googletag.pubads().enableSyncRendering(); googletag.enableServices(); </"
            +"script><div id='div-gpt-ad-"
            +now
            +"-0' style='width:"
            +w
            +"px; height:"
            +h
            +"px;'>"
            +"<script type='text/javascript'>googletag.display('div-gpt-ad-"
            +now
            +"-0');</"
            +"script></div>"); 
          break;
      case 'baidu':          
          str = '<script type="text/javascript">cpro_id ="'
            + id
            +'"</'
            +'script><script src="http://cpro.baidustatic.com/cpro/ui/c.js" type="text/javascript"></'
            + 'script>';
        break;
      case 'adsense':
          str = '<script type="text/javascript">google_ad_client="'
              +id
              +'";google_ad_slot="'
              +slot
              +'";google_ad_width='
              +w
              +';google_ad_height='
              +h
              +';google_page_url="'
              +location.href
              +'";</'
              +'script><script type="text/javascript" src="http://pagead2.googlesyndication.com/pagead/show_ads.js"><'
              + '/script>';
        
        break;
    }
    return str;
  }



  //展示Popup广告
  function decoratePopup(c){
    var widgetStyle = 1;
    if(c.widgetStyle){
      widgetStyle = c.widgetStyle;
    }
    var fixed_style = 'position:fixed;right: 10px;bottom: 0;_position:absolute; _background-image:url(about:blank); _background-attachment:fixed;_top:expression(eval((document.documentElement.scrollTop||document.body.scrollTop)+(document.documentElement.clientHeight||document.body.clientHeight)-this.offsetHeight-(parseInt(this.currentStyle.marginTop,10)||0)-(parseInt(this.currentStyle.marginBottom,10)||0)));z-index:2199999;';
    var containerStyle = 'width:'
                      + c.width
                      + 'px;height:'
                      + c.height
                      + 'px;'
                      + fixed_style;    

    // 添加关闭按钮
    $close=doc.createElement('a');
    close_style = 'background-color:#CDCCCC;position:absolute;width:16px;height:15px;font-size:15px;line-height:15px;z-index:999;font-family:serif;color:#000;font-weight:bold;cursor:pointer;text-decoration:none;text-align:center;';
    switch(config.closePosition){
      case 'tl':
        close_style+='top:0;left:0;';break;
      case 'tr':
        close_style+='top:0;right:0;';break;
      case 'bl':
        close_style+='bottom:0;left:0;';break;
      case 'br':
        close_style+='bottom:0;right:0;';break;
    }

    // logo
    $logo = doc.createElement('a');
    $logo.href = "http://www.instreet.cn/contact";
    $logo.target="_blank";
    var lStyle = 'position:absolute;z-index:199;',
        lHtml = '';
    switch(config.closePosition){
      case 'tl':
      case 'tr':
        lStyle += 'right:0;bottom:0;';
        lHtml = '<img id="instreet_logo1" style="border:none;" src="http://s2.yylady.cn/corner/images/instreet_logo1_br.png"/><img id="instreet_logo2" style="display:none;border:none;" src="http://s2.yylady.cn/corner/images/instreet_logo2_br.png"/>';
        break;
      case 'bl':
      case 'br':
        lStyle += 'right:0;top:0;';
        lHtml = '<img id="instreet_logo1" style="border:none;" src="http://s2.yylady.cn/corner/images/instreet_logo1_tr.png"/><img id="instreet_logo2" style="display:none;border:none;" src="http://s2.yylady.cn/corner/images/instreet_logo2_tr.png"/>';
        break;
    }
    $logo.style.cssText = lStyle;
    $logo.innerHTML = lHtml;

    switch(widgetStyle.toString()){ 
      case "2": //baidu popu style
        containerStyle += 'background:#FFF;padding:4px;border:1px solid #acacac;';        
        if(document.documentMode&&document.documentMode<6){
          containerStyle+=';width:'+(parseInt(c.width)+10)+'px;height:'+(parseInt(c.height)+10)+'px;';          
        }
        
        close_style = 'position:absolute;width:67px;height:20px;cursor:pointer;color:#FFF;top:-26px;right:0;overflow:hidden;';
        var text_style = 'background: #999999; display: inline-block;height: 20px;line-height: 20px;vertical-align:middle;text-align: center;padding:0 2px;';
        $close.innerHTML = '<span style="'+text_style+'margin-right: 1px;font-size: 12px;width:38px;">关闭</span><span style="'+text_style+'width:20px;font-family:serif;font-size:16px;font-weight: bold;">×</span>';
      break;
      default: //normal popup style
        $close.innerHTML="×";
    }
    $container.style.cssText = containerStyle;
    $close.style.cssText = close_style;

    //replay
    var rStyle='display:none;width:60px;height:50px;background-color:#1a1a1a;color:#FFF;cursor:pointer;padding:5px 0;text-align:center;font-size:18px;font-weight:bold;line-height:25px;font-family:arial,serif;'+fixed_style+'right:10px;bottom:10px;';
    $replay = doc.createElement('div');
    $replay.innerHTML = '<div style="font-size: 18px;line-height: 25px;font-weight: bold;">重新</div><div style="font-size: 18px;line-height: 25px;font-weight: bold;">播放</div>'
              + (config.closeReplay ? '<a style="position: absolute;top: -15px;cursor:pointer;font-weight: 400;text-decoration: none;font-size: 12px;color: #FFF;right: 0;height: 12px;line-height: 13px;width: 12px;background: #ccc;">×</a>' : '');
    $replay.style.cssText = rStyle;        

    $container.appendChild($close);
    config.showLogo&&$container.appendChild($logo);
    config.showReplay&&(doc.getElementsByTagName('body')[0]||document.documentElement).appendChild($replay);

  }

  function startPopup(c) {
    renderAd(c);
    decoratePopup(c);
    if(c.fdfpID&&c.fdfpName){ //if has set region forbidden      
      $container.style.display = 'none';      
      getMessageByDFP(c.fdfpID,c.fdfpName,function(val){
        if(val!='stopAd'){
          $container.style.display = 'block';
        }
      });      
    }else{
      maximize();
    }    
    bindEvents();
    addTracker(c.trackUrl,$container); //添加监控
    isClickRegion(createAdClick); //ad clicker
  }

  //回调函数
  window[callback] = function(obj){
    if(!obj){
      return;
    }
    for(var p in obj){
      config[p] = obj[p];
    }    
    startPopup(config);
  };

  //初始化config，请求广告数据
  var init=function(){ 
    if(typeof instreet_widgetSid!='undefined'){
      var field=instreet_widgetSid;
      instreet_widgetSid=null;
      $container = utils.$('ins-popup-'+field);      
      var src = pushAPI+'?field='+field+'&url='+encodeURIComponent(location.href)+'&callback='+callback+'&t='+new Date().getTime();
      doc.write('<script type="text/javascript" src="'+src+'"></'+'script>');
      useFrame = !$container||$container.children.length<3;   //should use iframe instead of ad code      
    }
  };

  init();

})(window);
