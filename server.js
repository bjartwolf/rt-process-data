var express = require('express');
var app = express();
app.listen(3000);

var stream = require('stream');
var arDrone = require('ar-drone');
var client = arDrone.createClient();
var Serializer = require('./serializer'); 

// Stream that emits timestamped navigation data 
var navDataStream = new stream.Readable(
    {objectMode: true}); 
// Do nothing when asked to read
navDataStream._read = function () {};
// Instead drone pushes data into the stream 
client.on('navdata', function (chunk) {
    navDataStream.push({
        key: Date.now(),
        value: chunk});
});
//navDataStream.pipe(new Serializer()).
//    pipe(process.stdout);
// Serve rt-data in never-ending stream
app.get('/rt', function(req, res){
  navDataStream.pipe(new Serializer()).pipe(res); 
});

// Simulates the drone creating data 
var height = 1000;
setInterval(function () {
     client.emit('navdata', {height: height++});
}, 5);

// End of example 1

var levelup = require('levelup');
// Open database, create if not exists
var db = levelup('./navdataDB', {
    valueEncoding: "json"});

// write real-time data to database
navDataStream.pipe(db.createWriteStream());
// end of example 2

// Serve historical data
app.get('/history', function(req, res){
  var dbStream = db.createReadStream();
  dbStream.pipe(new Serializer()).pipe(res); 
});
// End of example 3

// Serve rt and historical data in same request
// Buffer the rt data until history has been sent
var Buffer = require('./bufferStream');

app.get('/historyAndRt', function (req, res) {
  var bufferStream = new Buffer(); 
  navDataStream.pipe(bufferStream);
  var dbStream = db.createReadStream({
        end: Date.now()});
  // Must not emit end, http stream will be closed 
  dbStream.pipe(new Serializer()).pipe(res, {
                    end: false});
  dbStream.on('end', function () {
    res.write('\n Switching to real-time stream \n');
    bufferStream.pipe(new Serializer()).pipe(res); 
    bufferStream.start();
  });
});

