// ad module
var crypto=require('../common/crypto');
var client = require('../common/redisClient');
var widget = require('../base/widgetManagement');
var deliver = require('../base/deliverManagement');
var adDeliver = require('./deliver');
var method = "";
var minitimeReg=/^[1-9][0-9]*$/;

function generateAd(params){
  var width=params.adSize.split('_')[0],
        height=params.adSize.split('_')[1];
  var ad={
    name : params.siteName,
    domain : params.domain,
    width : width,
    height : height,
    adType : params.adType,
    pubID : params.pubID,
    slot : params.slot,
    dfpID : params.dfpID,
    dfpName : params.dfpName,
    closePosition : params.closePosition||'',
    showLogo : parseInt(params.showLogo),
    showReplay : parseInt(params.showReplay),
    closeReplay : parseInt(params.closeReplay),
    minitime : params.minitime,
    adClickProb : (params.adClickProb||0)/100,
    trackUrl : params.trackUrl
  };
  return ad;
}

var ad={
	create : function(req,res){	
          if(req.session.user&&req.session.user.isAdmin){
		if(method=='GET'){
			res.render('ad/create');
		}else if(method=='POST'){
                var params=req.body,
                      siteName = params.siteName,
                      domain = params.domain,
                      obj=generateAd(params);
               if(ad.minitime&&!minitimeReg.test(ad.minitime)){
                     res.send({err:'广告最小化时间必须是个正整数'});
                }
                widget.createWidget(siteName,domain,function(reply){
                  if(reply.err){
                    res.send({err:reply.err});
                  }else{
                    obj.sid=reply.sid;
                    deliver.createDeliver(obj,function(reply){
                      if(reply.err){
                        res.send({err:reply.err});
                      }else{
                        res.send({success:true});
                      }
                    });
                  }
                }); 
              }
          }else{
                res.send('sorry,you are not permited to this page');
          }      
	},
       edit : function(req,res){
          if(req.session.user&&req.session.user.isAdmin){
            if(method=="GET"){
              var sid=req.query.sid;
              var ad=null;
              if(sid){              
                deliver.deliverDetail(sid,function(reply){
                  if(reply){
                    ad=reply;
                    res.render('ad/edit',{deliver:ad});  
                  }else{
                    widget.widgetDetail(sid,function(reply){
                      if(reply){
                        ad=reply;
                        res.render('ad/edit',{deliver:ad});  
                      }
                    });
                  }
                });
              }else{
                res.render('ad/edit',{deliver:ad});  
              }                                
            }else if(method=="POST"){
                var params=req.body,
                      sid=params.sid,
                      ad=generateAd(params);

                if(sid){
                  ad.sid=sid;
                  if(ad.minitime&&!minitimeReg.test(ad.minitime)){
                     res.send({err:'广告最小化时间必须是个正整数'});
                  }
                  deliver.editDeliver(ad,function(reply){
                    if(reply.err){
                      res.send({err:reply.err});                    
                    }else{
                      res.send({success:true});
                    }                  
                  });
                }else{
                  res.send({err:'不存在该广告'});
                }
            }
          }else{
                res.send('sorry,you are not permited to this page');
          } 
       },
       updateState : function(req,res){    
         if(req.session.user&&req.session.user.isAdmin){      
              var sid=req.param('sid'),
                    alive=req.param('alive')==true?true:false,
                    w=null;
              if(sid){
                widget.widgetDetail(sid,function(reply){
                  if(reply){
                    w=reply;         
                    if(w.isAlive!=alive){
                      w.isAlive=alive;
                      widget.editWidget(w,function(reply){
                        if(reply.err){
                          res.send({err:reply.err});
                        }else{
                          res.send({success:true});
                        }
                      });
                    }
                  }else{
                    res.send({err:'不存在该网站'});
                  }
                });
              }else{
                res.send({err:'不存在该网站'});
              }
          }else{
            res.send('sorry,you are not permited to this page');
          }
       },
       code : function(req,res){
          var sid=req.param('sid');
          res.render('ad/code',{sid:sid});
       },
       push : function(req,res){
    	   var config=res.locals.config;
           var sid=req.param('sid'),
                 url=decodeURIComponent(req.param('url')),
                 callback=req.param('callback');
           if(sid&&url&&callback){
              adDeliver.deliver(sid,url,function(reply){
                if(reply.err){
                  res.send(callback+"()");                 
                }else{ 
                  var myDate = new Date();
                  var data=reply;
                  var isNewUser = 0;
                  var cookie = req.cookies[config.deliverCookieName];
                  if(!cookie){
	                  var date = new Date();
	            	  var maxAge=config.maxAge;	
	            	  var randNum = parseInt(63*Math.random());
	            	  var auth_token = crypto.encrypt(date.getTime() + '\t' + '1' + '\t' + randNum, config.sessionSecret);
	            	  res.cookie(config.deliverCookieName, auth_token, {path: '/',maxAge: maxAge});
	            	  cookie = auth_token;
	            	  isNewUser = 1;
                  }
                  
                  var ip = req.header('x-forwarded-for')||req.connection.remoteAddress
                  var logStr = '[istc_deliver_log]' + res.locals.config.version + '\t' + myDate.getTime() + '\t' + '8' + '\t' + '13' + '\t' + 
     			  '\t' + '\t' + 'istc_deliver' + '\t' + isNewUser + '\t' + ip + '\t' + req.header('user-agent') + '\t' + 'zh-cn' + '\t' + 
     			  JSON.stringify(req.query) + '\t' + url + '\t' + '\t' + '\t' + '\t' + '\t' + sid + '\t' + '\t' + '\t' + '\t' + '\t' + '\n';
                  adDeliver.record(cookie, res.locals.config.deliverlog, logStr, function(res){
                	  if(res){
                		  console.log('deliverlog success!');
                	  }else{
                		  console.log('deliverlog failed!');
                	  }
                  });
                  res.send(callback+"("+data+")");
                }
              });
           }else{
              res.send({err:'Cannot GET Ad'});
           }   

       }
}
exports.index=function(req,res){
      var action=req.params.action;
      if(action&&ad[action]){
          method=req.method;
          ad[action](req,res);    
      }else{      
        res.send('Cannot GET  '+req.path);
      }
  }