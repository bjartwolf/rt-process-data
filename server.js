// Creating a webserver
var express = require('express');
var Buffer = require('./bufferStream');
var app = express();
app.listen(3000);

// We need to stringify JSON to send objects over HTTP
var stream = require('stream');
var arDrone = require('ar-drone');
var client = arDrone.createClient();

var Serializer = require('./serializer'); 

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
  navDataStream.pipe(new Serializer()).pipe(res); 
});

// Simulates the helicopter creating some data 
var height = 1000;
setInterval(function () {
     client.emit('navdata', {height: height++});
}, 1);

// Creating or opening the database
var levelup = require('levelup');
var db = levelup('./navdataDB', {valueEncoding: "json"});

// write real-time data to database
navDataStream.pipe(db.createWriteStream());

// Service historical data
app.get('/historical', function(req, res){
  var dbStream = db.createReadStream();
  dbStream.pipe(new Serializer()).pipe(res); 
});

app.get('/oldAndFuture', function (req, res) {
  // Adding false here makes the stream not end properly too...
  // this causes some issues.
  var timeStamp = Date.now();
  var bufferStream = new Buffer(); 
  navDataStream.pipe(bufferStream); //Takes all events from now on into buffer

  var dbStream = db.createReadStream( {end: timeStamp});

  dbStream.pipe(new Serializer()).pipe(res, {end: false}); // Do not emit end, http stream will close  
  dbStream.on('end', function () { // Rather, on end, switch stream and start piping the real-time data
    bufferStream.start();
    bufferStream.pipe(new Serializer()).pipe(res); 
    res.write('\nswitching \n');
  });
});
