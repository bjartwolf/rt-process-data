// Creating a webserver
var express = require('express');
var app = express();
app.listen(3000);

// We need to stringify JSON to send objects over HTTP
var stream = require('stream');
var arDrone = require('ar-drone');
var client = arDrone.createClient();

var serializer = new stream.Transform({objectMode: true}); 
serializer._transform = function (chunk, encoder, done) {
    this.push(JSON.stringify(chunk));
    done();
};
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
  navDataStream.pipe(serializer).pipe(res); 
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
  dbStream.pipe(serializer).pipe(res); 
});

app.get('/oldAndFuture', function (req, res) {
  // Adding false here makes the stream not end properly too...
  // this causes some issues.
  var timeStamp = Date.now();
  var bufferStream = new stream.Transform({objectMode: true}); 
  var resume; 
  bufferStream._transform = function (chunk, encoding, done ) { 
      this.push(chunk); 
      if (!resume) {
          resume = done;
      } else {
          done();
      }
  };
  var dbStream = db.createReadStream( {end: timeStamp});
  navDataStream.pipe(bufferStream); //Takes all events from now on into buffer
  dbStream.pipe(serializer, {end:false}).pipe(res); // Do not emit end, http stream will close  
  dbStream.on('end', function () { // Rather, on end, switch stream and start piping the real-time data
    resume();
    res.write('\nswitching \n');
    bufferStream.pipe(serializer).pipe(res); 
  });
});
