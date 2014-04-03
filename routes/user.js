
var client = require('../common/redisClient');
var crypto=require('../common/crypto');
var config=require('../config');
var http = require('http');
var querystring = require('querystring');

function generateSession(user, req, res, remember){	//login cache
  var config=res.locals.config;   	
  var maxAge=config.maxAge;	
  var auth_token = crypto.encrypt(user.email + '\t' + new Date().getTime(), config.sessionSecret);
  req.session.user = user;   
  if(remember){	//keep login state
	res.cookie(config.authCookieName, auth_token, {path: '/',maxAge: maxAge});  
	req.session.cookie.maxAge = maxAge;	
   }

};

function post(url,data,fn){
      data=data||{};
      var content=require('querystring').stringify(data);      
      var parse_u=require('url').parse(url,true);
      var isHttp=parse_u.protocol=='http:';
      var options={
           hostname:parse_u.hostname,
           port:parse_u.port||(isHttp?80:443),
           path:parse_u.path,
           method:'POST',
           headers:{
                  'Content-Type':'application/x-www-form-urlencoded',
                  'Content-Length':content.length
            }
        };
        var req = require(isHttp?'http':'https').request(options,function(res){
          var _data='';
          res.on('data', function(chunk){
             _data += chunk;
          });
          res.on('end', function(){
                fn!=undefined && fn(_data);
           });
        });
	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
        req.write(content);
        req.end();
}
var admin_signup=function(){
	var email=config.admin.email;
	var psd=config.admin.password;	
	client.hexists('user', email, function(err,reply) {		
		if(!reply){
			var profile={
				password:psd,
				timestamp:new Date().getTime(),
				isAdmin:true
			};
			client.hmset('user',email,JSON.stringify(profile),function(err,replies){
				if(!err)
					console.log('admin ',email,' signup successfully');
			});
		}else{
			console.log('admin '+email+' is already existed');
		}
	});	
};

function validateUser(email, password, callback){
	if(email&&password){		
		client.hget('user',email,function(err,reply){			
			if(reply){
				var profile=JSON.parse(reply);
				if(profile.password==password){
					if(profile.isAdmin){
						callback(1);
					}else{
						callback(2);	
					}
					return false;
				}
			}
			callback(0);					
		});
	}else{
		callback(0);
	}		
}

var user = {
index:function  (req,res) {
	res.render('user/index');
},
changePassword:function(req,res){

	if(req.method=="GET"){
		res.render('user/changePassword');
	}else if(req.method=="POST"){
		var email=req.session.user.email,
			oldpsd=req.body.oldPassword,
			newpsd=req.body.newPassword,
			spsd=req.body.secondPassword;
		if(oldpsd&&newpsd&&spsd){
			if(newpsd!==spsd){
				res.send({err:'两次输入新密码不一样'});
			}else if(oldpsd==newpsd){
				res.send({err:'新密码不能和旧密码一样'});
			}else{
				client.hget('user',email,function(err,reply){
					if(reply){
						var profile=JSON.parse(reply);
						if(oldpsd==profile.password){
							profile.password=newpsd;
							client.hset('user',email,JSON.stringify(profile),function(err,reply){
								console.log(err,reply);
								if(err){
									res.send({err:'修改密码失败'});
									return;
								}else{
									res.send({success:true});
								}								
							});
						}else{	//password is not correct
							res.send({err:'输入旧密码错误'});
						}	
					}
				});
			}
		}else{
			res.send({err:'拜托，密码不能为空的，请认真填写'});
		}
	}
	
},
signin : function(req, res){	
	if(req.session.user){
		res.redirect('/');
		return false;
	}  
	if(req.method=="GET"){	  	
		res.render('user/signin');
	}else if(req.method=="POST"){
		var email=req.body.email,
		psd=req.body.password,
		rmb=req.body.remember;
		if(email&&psd){
			validateUser(email,psd, function(result){
				 if(result){			 	
				      //save userinfo to session
				      var user={
				      	email:email,
				      	password:psd,
				      	isAdmin:result==1?true:false
				      };
				      generateSession(user,req,res,rmb);
				      res.send({success:true}); 
				  }else{
			  	      res.send({err:'邮箱不存在或者密码错误'});
				  }
			});
		}else{
			res.send({err:'邮箱和密码不能为空'});	
		}				
	}
 },
signout:function(req,res){
	var config=res.locals.config;
	req.session.destroy();
	res.clearCookie(config.authCookieName, {path: '/'});
	res.redirect('/user/signin');
},
authUser : function(req,res,next){	
	var config = res.locals.config,
		cookie = req.cookies[config.oosCookieName],
		path = req.path;
	noAuthPath = ['/widget/push'];
		
	if(noAuthPath.some(function(item){if(item == path) return true;})){
		return next();
	}else if(cookie&&req.session.user&&req.session.user.cookie == cookie){ 
		res.locals.user=req.session.user;
		return next();
	}else{		
		if(cookie){					
			post(config.oosUrl,{instreet_uid : cookie},function(data){				
				if(data){
					var user = JSON.parse(data);
					if(user.email && user.email != "null"){
						user.cookie = cookie;
						req.session.user = user;
						res.locals.user = user;
						return next();
					}else{
						res.send("登录错误");
					}					
				}else{
					res.send("登录错误");
				}				
			});
		}else{
			res.send("请先登录尚街广告管理后台,否则无法访问该页内容");
		}
	}
}

}

// admin_signup();
exports.authUser=user.authUser;
exports.index=function(req,res){
        var action=req.params.action;
        if(action&&user[action]){
		if(action!='signin'&&!req.session.user){
			res.redirect('/user/signin');
			return;
		}
		user[action](req,res);	
        }else{
        	res.send('Cannot GET  '+req.path);
        }
}
