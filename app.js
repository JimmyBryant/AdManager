
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var authUser=require('./routes/user').authUser;
var http = require('http');
var path = require('path');
var config = require('./config');
var log4js = require('log4js');
var logger = require('./common/logger').logger('istc');

routes.initIDKey();

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(log4js.connectLogger(logger, {level:'auto'}));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(config.sessionSecret));
app.use(express.session());
app.use(function(req, res, next){		
	res.locals.config = config;	//add config object to view   
	next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(authUser);
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler({ dumpExceptions: true }));
}

routes.index(app);

if(!module.parent){
	http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
	});
}
module.exports = http.createServer(app);

