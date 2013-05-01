// Creating a webserver
var express = require('express');
var app = express();
app.listen(3000);

// We need to stringify JSON to send objects over HTTP
var jsonStream = require('JSONStream');

var stream = require('stream');
var arDrone = require('ar-drone');
var client = arDrone.createClient();

// Creating a stream that emits a timestamped navigationdata object 
var navDataStream = new stream.Readable({objectMode: true}); 
// I do nothing on underlying resource when asked for data 
navDataStream._read = function () {};
// But the drone pushes data into the stream when it has data 
client.on('navdata', function (chunk) {
    navDataStream.push({key: Date.now(), value: chunk});
});
    
// Server real-time data from the helicopter, never-ending stream
app.get('/rt', function(req, res){
  // The stringify(false) is a configuration to only have newline separation between elements
  var stringify = new jsonStream.stringify(false);
  navDataStream.pipe(stringify).pipe(res); 
});

// Simulates the helicopter creating some data 
var height = 1000;
setInterval(function () {
     client.emit('navdata', {height: height++});
}, 100);

// Creating or opening the database
var levelup = require('levelup');
var db = levelup('./navdataDB', {valueEncoding: "json"});

// write real-time data to database
navDataStream.pipe(db.createWriteStream());

// Service historical data
app.get('/historical', function(req, res){
  var stringify = new jsonStream.stringify(false);
  var dbStream = db.createReadStream();
  dbStream.pipe(stringify).pipe(res); 
});

// Now real challenge - serve historical AND realtime data
app.get('/oldAndFuture', function (req, res) {
  var stringify = new jsonStream.stringify(false);
  var dbStream = db.createReadStream();
  dbStream.pipe(stringify).pipe(res, {end: false}); // Do not emit end, http stream will close  
  dbStream.on('end', function () { // Rather, on end, switch stream and start piping the real-time data
    navDataStream.pipe(stringify).pipe(res); 
  });
});

