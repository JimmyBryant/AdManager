//  utils.js

//get date form Date object ,return str accroding to the format given
function getDateStr(date,format){
	var y = date.getFullYear(),
		m = date.getMonth()+1,
		d = date.getDate();
	format = format || 'yyyy-mm-dd';	
	return format.replace('yyyy',y)
				    .replace('mm',m)
				    .replace('dd',d);
}
//get all the date between start date and end date,like  2013-10-12 to 2013-11-23
//return  date str array,include start and end date 
function getAllDate(s,e){	
	var start = s.split('-'),
		end = e.split('-'),
		sd = new Date(),
		ed = new Date(),
		dateArr = [];
	sd.setFullYear(start[0],start[1]-1,start[2]);	//get start date object
	ed.setFullYear(end[0],end[1]-1,end[2]);
	for(var t=sd;t<=ed;){
		dateArr.push(getDateStr(t));
		t.setTime(t.getTime()+24*60*60*1000);		
	}
	return dateArr;
}
function isArray(arr){
	return Object.prototype.toString.call(arr).slice(8,-1) == 'Array';
}
function toArray(s){
	var res = [];
	if(s){
		if(typeof s == 'string'){
			res.push(s);
		}else if(isArray(s)){
			res = s;
		}	
	}
	return res;
}
var utils = {
	getDateStr : getDateStr,
	getAllDate : getAllDate,
	isArray : isArray,
	toArray : toArray
};

exports = module.exports = utils;