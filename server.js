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

setInterval(function () {
     client.emit('navdata', {height: 1000});
}, 100);

// adding express (considering append only code presentation style)
var express = require('express');
var app = express();
var jsonStream = require('JSONStream');

app.get('/historical', function(req, res){
  var stringify = new jsonStream.stringify();
  db.createReadStream({end: Date.now()}).pipe(stringify).pipe(res); 
});

app.listen(3000);


// serving real-time data (maybe this should come first. is simpler)
app.get('/rt', function(req, res){
  var stringify = new jsonStream.stringify();
  navDataStream.pipe(stringify).pipe(res); 
});


