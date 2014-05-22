//application config file

var host="http://popup.instreet.cn:3000",
insHost = 'http://monkey.instreet.cn',
cssUrl=host+"/css/",
jsUrl=host+"/js/",
imageUrl=host+"/images/",
deliverlog=__dirname + '/log',
istclog=__dirname + '/log/istclog',
oosUrl = insHost + '/istc.json',
version = 'istc-0.3';

var config={
	host:host,
	insHost : insHost,
	cssUrl:cssUrl,
	jsUrl:jsUrl,
	imageUrl:imageUrl,
	popupUrl:jsUrl + 'instreet.popup.min.js',	
	permanentUrl : jsUrl + 'instreet.permanent.min.js',
	coupletUrl : jsUrl + 'instreet.couplet.min.js',
	bannerUrl : jsUrl + 'instreet.banner.min.js',
	deliverlog:deliverlog,
	istclog:istclog,
	version:version,
	sessionSecret:'inspopup',
	maxAge:1000*60*60*24*7,
	authCookieName:'instreet_user',
	oosCookieName:'instreet_uid',
	deliverCookieName:'istc_deliver',
	admin:{
		email:"admin@instreet.cn",
		password:"liuning"
	},
	redis:{
		host: '127.0.0.1',
		port: 6379
	},
	oosUrl:oosUrl
};

module.exports = config;
