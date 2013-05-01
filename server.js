// Creating or opening the database
var levelup = require('levelup');
var db = levelup('./navdataDB', {valueEncoding: "json"});

// Creating a readable stream from the ar-drone
var stream = require('stream');
var arDrone = require('ar-drone');
var client = arDrone.createClient();

var navDataStream = new stream.Readable(); 
// It's no use asking me
navDataStream._read = function () {};
client.on('navdata', function (chunk) {
    navDataStream.push(chunk);
});
    
navDataStream.pipe(db.createWriteStream());
navDataStream.pipe(process.stdout);

setInterval(function () {
     client.emit('navdata', '1');
}, 1000);
