
/*
 * GET users listing.
 */
var client = require('../common/redisClient');

exports.useradd = function(req, res){
  if(req.param('email') && req.param('password')){
     global.redisClient.hset('user', req.param('email'), req.param('password'), function(error, result){
         res.redirect('/admin');
     })
  }else{
     res.redirect('/admin');
  }
};

var admin={
  index:function(req,res){
    client.hgetall('user',function(err,replies){       
      res.render('admin/index',{userList:replies});
    });
  },
  addUser:function(req,res){
    if(req.method=="GET"){
      res.render('admin/add');
    }else if(req.method=="POST"){
      var email=req.body.email,
            psd=req.body.password,
            spsd=req.body.secondPassword;
      if(email&&psd&&spsd){
          if(psd!==spsd){
            res.send({err:'两次输入密码不相同'});
          }else{
            client.hexists('user',email,function  (err,reply) {
              if(reply){
                res.send({err:'该邮箱已被使用，换一个吧'});
              }else{
                var profile={
                  password:psd,
                  timestamp:new Date().getTime(),
                  isAdmin:false
                };
                client.hset('user',email,JSON.stringify(profile),function(err,reply){
                  if(err){
                    res.send({err:'what ??'});
                  }else if(reply){
                    res.send({success:true});
                  }
                });
              } 
            });
          }
      }else{
        res.send({err:'邮箱和密码不能为空'});
      }
    }
  }
}

exports.index=function(req,res){
      var action=req.params.action;
      if(action&&admin[action]){
        if(req.session.user&&req.session.user.isAdmin){
          admin[action](req,res);   
        }else{
          res.send('sorry,you are not permited to this page');
        }       
      }else{      
        res.send('404 NOT FIND');
      }
  }
