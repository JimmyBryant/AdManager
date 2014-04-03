var logBook = {
	"siteName" : "网站名称",
	"widgetName" :"插件名称" ,
	"adType" :"广告类型" ,
	"adSize" : "广告尺寸",
	"dfpName" : "DFP Name",
	"dfpID" : "DFP ID",
	"closePosition" :"关闭按钮位置" ,
	"showLogo" : "显示Logo",
	"showClose" : "显示关闭按钮",
	"showReplay" : "显示重新播放",
	"closeReplay" : "重新播放可关闭",
	"minitime"	: "广告最小化时间",
	"adClickProb" : "广告点击概率",
	"trackUrl"	: "第三方监控地址",
	"w1" : 'banner1宽度',
	"h1" : 'banner1高度',
	"w2" : 'banner2宽度',
	"h2" : 'banner2高度',
	"width"	: '广告位宽度',
	"height" : '广告位高度',
    "isAlive"	: "是否激活",
}
var vl = ['否','是'];
var logValueBook = {
	"closePosition" : {'tl':'左上角','tr':'右上角','bl':'左下角','br':'右下角'},
	"showLogo"	: vl,
	"showClose" : vl,
	"showClose" : vl,
	"showReplay" : vl,
	"closeReplay" : vl,
	"isAlive" : vl
}
exports.logBook = logBook;
exports.logValueBook = logValueBook;
