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
    
// serving real-time data (maybe this should come first. is simpler)
app.get('/rt', function(req, res){
  var stringify = new jsonStream.stringify();
  navDataStream.pipe(stringify).pipe(res); 
});

app.listen(3000);

// sending data when you have no chopper
setInterval(function () {
     client.emit('navdata', {height: 1000});
}, 100);

// Creating or opening the database
var levelup = require('levelup');
var db = levelup('./navdataDB', {valueEncoding: "json"});

navDataStream.pipe(db.createWriteStream());

app.get('/historical', function(req, res){
  var stringify = new jsonStream.stringify();
  db.createReadStream({end: Date.now()}).pipe(stringify).pipe(res); 
});



// Now real challenge - serve historical AND realtime data
app.get('/oldAndFuture', function (req, res) {
  var stringify = new jsonStream.stringify();
  var dbStream = db.createReadStream({end: Date.now()});
  dbStream.pipe(stringify).pipe(res, {end: false}); 
  dbStream.on('end', function () { 
    //might not be perfect just yet... Need to pipe it somewhere first where it can buffer
    navDataStream.pipe(stringify).pipe(res); 
  });
});

