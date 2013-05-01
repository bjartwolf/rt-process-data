var express = require('express');
var app = express();
var jsonStream = require('JSONStream');

var stream = require('stream');
var arDrone = require('ar-drone');
var client = arDrone.createClient();

var navDataStream = new stream.Readable({objectMode: true}); 
// It's no use asking me
navDataStream._read = function () {};
client.on('navdata', function (chunk) {
    navDataStream.push({key: Date.now(), value: chunk});
});
    
// Server real-time data from the helicopter, never-ending stream
app.get('/rt', function(req, res){
  var stringify = new jsonStream.stringify();
  navDataStream.pipe(stringify).pipe(res); 
});

app.listen(3000);

// sending data when you have no chopper
var counter = 1000;
setInterval(function () {
     client.emit('navdata', {height: counter++});
}, 100);

// Creating or opening the database
var levelup = require('levelup');
var db = levelup('./navdataDB', {valueEncoding: "json"});

// write real-time data to database
navDataStream.pipe(db.createWriteStream());

app.get('/historical', function(req, res){
  var stringify = new jsonStream.stringify();
  var dbStream = db.createReadStream();
  dbStream.pipe(stringify).pipe(res); 
});

// Now real challenge - serve historical AND realtime data
app.get('/oldAndFuture', function (req, res) {
  var stringify = new jsonStream.stringify();
  var dbStream = db.createReadStream();
  dbStream.pipe(stringify).pipe(res, {end: false}); // Do not emit end, http stream will close  
  dbStream.on('end', function () { // Rather, on end, start piping the real-time data
    navDataStream.pipe(stringify).pipe(res); 
  });
});

