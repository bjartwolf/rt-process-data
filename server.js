// Creating or opening the database
var levelup = require('levelup');
var db = levelup('./navdataDB', {valueEncoding: "json"});

// Creating a readable stream from the ar-drone
var stream = require('stream');
var arDrone = require('ar-drone');
var client = arDrone.createClient();

var navDataStream = new stream.Readable({objectMode: true}); 
// It's no use asking me
navDataStream._read = function () {};
client.on('navdata', function (chunk) {
    navDataStream.push({key: Date.now(), value: chunk});
});
    
navDataStream.pipe(db.createWriteStream());
//navDataStream.pipe(process.stdout);

setInterval(function () {
     client.emit('navdata', '1');
}, 1000);

// adding express (considering append only code presentation style)
var express = require('express');
var app = express();

app.get('/', function(req, res){
  res.write('here comes the data');
//  db.createReadStream().pipe(res); // need to json serialize for http
  db.createKeyStream().pipe(res);
});

app.listen(3000);

