var config = require('../config.js');
var PORT = config.redis.port;
var HOST = config.redis.host;

var redis = require("redis"),
client = redis.createClient(PORT,HOST);

client.on("error", function (err) {
    console.log("Error " + err);
});

module.exports= client;

