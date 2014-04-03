//  widget.js

var widgetManagement = require('../base/deliverManagement'),
    widgetDeliver = require('../base/deliver'), 
    siteUtils = require('../base/siteUtils'),     
    crypto = require('../common/crypto');

var method = '',
    params = null,
    user = null;

function generateWidget(params,type){
  var wt = params.widgetType,
      at = params.adType,
      width = params.adSize.split('x')[0],
      height = params.adSize.split('x')[1],
      w = {};

  if(wt == 1){
        w={
          width : width,
          height : height,              
          pubID : params.pubID,
          slot : params.slot,
          dfpID : params.dfpID,
          dfpName : params.dfpName,
          closePosition : params.closePosition||'',
          showLogo : parseInt(params.showLogo),
          showReplay : parseInt(params.showReplay),
          closeReplay : parseInt(params.closeReplay),
          minitime : params.minitime
        };
     }else if(wt == 2){
        if(at == 'banner'){
            w = {
                  width : params.width,
                  height : params.height,
                  pubID1 : params.pubID1,
                  slot1 : params.slot1,
                  w1 : params.adSize1.split('x')[0]||'',
                  h1 : params.adSize1.split('x')[1]||'',
                  pubID2 : params.pubID2,
                  slot2 : params.slot2,
                  w2 : params.adSize2.split('x')[0]||'',
                  h2 : params.adSize2.split('x')[1]||''
            };
          }else{
            w = {
              width : width,
              height : height,
              pubID : params.pubID,
              slot : params.slot,
              dfpID : params.dfpID,
              dfpName : params.dfpName
            }
          }
          w.showClose = parseInt(params.showClose);
     }else if(wt == 3){
        w = {
          width : width,
          height : height,
          pubID1 : params.pubID1,
          pubID2 : params.pubID2,
          slot1 : params.slot1 || '',
          slot2 : params.slot2 || '',
          closePosition : params.closePosition || ''
        }
     }
     if(type == 'create'){
      w.siteField = params.siteField;
       w.sid = params.sid;
       w.siteName = params.siteName;
       w.widgetType = wt;
     }else if(type == 'edit'){
       w.field = params.field;
     }
     w.isAlive = params.isAlive;
     w.widgetName = params.widgetName;     
     w.adType = at;
     w.adClickProb = (params.adClickProb||0)/100;
     w.trackUrl =  params.trackUrl;  
     return w;
};

var widget = {
	create : function(req,res){
    if(user.isAdmin){
        if(method=='GET'){
          var siteField =req.query.siteField,                      
              siteName = req.query.siteName,
              widgetType = req.query.widgetType;
          res.render('widget/create',{siteField : siteField,siteName : siteName,widgetType : widgetType});
        }else if(method=='POST'){              
          var siteField = params.siteField,
              sid =siteField.split(':')[0],
              siteName = params.siteName,
              widgetType = params.widgetType,
              widgetName = params.widgetName;
              params.sid = sid;
          if(widgetType>3||widgetType<1){
            res.render('widget/create',{err : '插件类型错误',siteField : siteField,siteName : siteName,widgetType : widgetType});  
          }else if(!siteField || !siteName){
            res.render('widget/create',{err : '必须选择一个网站',siteField : siteField,siteName : siteName,widgetType : widgetType});
          }else if(!widgetName){
            res.render('widget/create',{err : '插件名称不能空',siteField : siteField,siteName : siteName,widgetType : widgetType});
          }else{
            var obj = generateWidget(params,'create');                  
            widgetManagement.createDeliver(obj,function(result){
              if(result.err){
                res.render('widget/create',{err : result.err,sid : sid,siteName : siteName,widgetType : widgetType});
              }else{
                res.redirect('/site/details?field='+siteField);
              }
            });
          }
        }
      }else{
        res.send("sorry,you have no permission to this page");
    }
  },
 edit : function(req,res){
    if(user.isAdmin){
      if(method == 'GET'){
        var field = req.query.field;
        widgetManagement.deliverDetail(field,function (result) {
          var obj = result?JSON.parse(result) : null; 
          siteUtils.getSite(obj.siteField,function(result){ //to get the siteName
            if(result){
              obj.siteName = JSON.parse(result).siteName;
            }            
            res.render('widget/edit',{widget : obj});
          });          
        });
      }else if(method == 'POST'){
         var field = params.field;
         if(field){
           var obj = generateWidget(params,'edit'); 
           if(obj.adType == 'banner'){
              if(!obj.pubID1&&!obj.pubID2){
                res.render('widget/edit',{widget : obj,log:{type : 'error',message : '抱歉，你至少得创建一个banner广告'}});
                return false;
              }else if(!obj.width || !obj.height){
                res.render('widget/edit',{widget : obj,log:{type : 'error',message : '抱歉，banner广告位尺寸不能为0或空值'}});
                return false;
              }                    
           }
           obj.author = user.email; //for changelog 
           widgetManagement.editDeliver(obj,function(result){
              if(result.err){
                res.render('widget/edit',{widget : obj , err : result.err});
              }else{
                res.redirect('/site/details?field='+params.siteField);
              }
           });
             
         }else{
          res.send("cannot find the widget");
         }        
      }
    }else{
       res.send("sorry,you have no permission to this page");        
      }
 },
       delete : function(req,res){
          if(user.isAdmin){
            var field = req.param('field');
            widgetManagement.stopDeliver(field,function(result){
              if(result.err){
                res.send({err : result.err});
              }else{
                widgetManagement.delDeliver(field,user.email,function(result){
                  if(result.err){
                    res.send({err : result.err});
                  }else{
                    res.send({success : true});
                  }
                });
              }
            });
          }else{
             res.send("sorry,you have no permission to this page");        
          }
       },
       updateState : function(req,res){
          if(user.isAdmin){
            var field = req.param('field'),
                  state = req.param('state');

              var callback = function(result){
                  if(result.err){
                    res.send({err : result.err});
                  }else{
                    res.send({success : true});
                  }
              };

              if(state){
                widgetManagement.activeDeliver(field,function(result){
                  callback(res,result);
                });
              }else{
                widgetManagement.stopDeliver(field,function(result){
                  callback(res,result);
                })
              }
          }else{
            res.send("sorry,you have no permission to this page");        
          }
       },
       code : function(req,res){
          var wt = req.param('widgetType'),
                field = req.param('field');
          res.render('widget/code',{field : field,widgetType : wt});
       },
       preview : function(req,res){
          var wt = req.param('widgetType'),
                wn = req.param('widgetName'),
                field = req.param('field');
          res.render('widget/preview',{field : field,widgetType : wt,widgetName : wn});
       },
       push : function(req,res){
           var config=res.locals.config;
           var field=req.param('field'),                 
                 url=decodeURIComponent(req.param('url')),
                 callback=req.param('callback');
           if(field&&url&&callback){
              widgetDeliver.deliver(field,url,function(result){
                if(result.err){
                  console.log(result.err)
                  res.send(callback+"()");                 
                }else{ 
                  var myDate = new Date();
                  var data=result;
                  var isNewUser = 0;
                  var cookie = req.cookies[config.deliverCookieName];
                  if(!cookie){
                    var maxAge= config.maxAge; 
                    var randNum = parseInt(63*Math.random());
                    var deliver_token = crypto.encrypt(myDate.getTime() + '\t' + '1' + '\t' + randNum, config.sessionSecret);
                    res.cookie(config.deliverCookieName, deliver_token, {path: '/',maxAge: maxAge});
                    cookie = deliver_token;
                    isNewUser = 1;
                  }                  
                  var ip = req.header('x-forwarded-for')||req.connection.remoteAddress
                  var logStr = '[istc_deliver_log]' + config.version + '\t' + myDate.getTime() + '\t' + '8' + '\t' + '13' + '\t' + 
            '\t' + '\t' + 'istc_deliver' + '\t' + isNewUser + '\t' + ip + '\t' + req.header('user-agent') + '\t' + 'zh-cn' + '\t' + 
            JSON.stringify(req.query) + '\t' + url + '\t' + '\t' + '\t' + '\t' + '\t' + field + '\t' + '\t' + '\t' + '\t' + '\t' + '\n';
                  widgetDeliver.record(cookie, config.deliverlog, logStr, function(res){
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

exports.index = function  (req,res) {
      var action=req.params.action;      
      if(action&&widget[action]){
        if(req.session.user||action == 'push'){
          method=req.method;
          params = req.body;
          user = req.session.user;
          widget[action](req,res);
        }else{
          res.redirect('/user/signin');
        }    
      }else{      
        res.send('Cannot GET  '+req.path);
      }	
}