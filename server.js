var express = require('express');
var app = express();
app.listen(3000);

var stream = require('stream');
var arDrone = require('ar-drone');
var client = arDrone.createClient();
var Serializer = require('./serializer'); 

// Creating a stream that emits a timestamped navigationdata object 
var navDataStream = new stream.Readable({objectMode: true}); 
// Do nothing on underlying resource when asked for data 
navDataStream._read = function () {};
// Instead the drone pushes data into the stream when it has data 
client.on('navdata', function (chunk) {
    navDataStream.push({key: Date.now(), value: chunk});
});

// Serve real-time data from the drone in a never-ending stream
app.get('/rt', function(req, res){
  navDataStream.pipe(new Serializer()).pipe(res); 
});

// Simulates the drone creating data 
var height = 1000;
setInterval(function () {
     client.emit('navdata', {height: height++});
}, 50);

// End of example 1

var levelup = require('levelup');
// Open database, create if not exists
var db = levelup('./navdataDB', {valueEncoding: "json"});

// write real-time data to database
navDataStream.pipe(db.createWriteStream());
// end of example 2

// Serve historical data
app.get('/historical', function(req, res){
  var dbStream = db.createReadStream();
  dbStream.pipe(new Serializer()).pipe(res); 
});
// End of example 3

// Server realtime and historical data in the same request
// We buffer the realtime data until all history has been sent
var Buffer = require('./bufferStream');

app.get('/oldAndFuture', function (req, res) {
  var timeStamp = Date.now();
  var bufferStream = new Buffer(); 
  navDataStream.pipe(bufferStream);

  var dbStream = db.createReadStream( {end: timeStamp});

  // DbStream must not emit end because http stream will then be closed 
  dbStream.pipe(new Serializer()).pipe(res, {end: false});
  dbStream.on('end', function () {
    res.write('\n Switching to real-time stream \n');
    bufferStream.start();
    bufferStream.pipe(new Serializer()).pipe(res); 
  });
});

