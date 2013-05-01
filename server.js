// Creating or opening the database
var levelup = require('levelup');
var db = levelup('./navdataDB', {valueEncoding: "json"});

// Creating a readable stream from the ar-drone
var stream = require('stream');
var arDrone = require('ar-drone');
var client = arDrone.createClient();
NavDataStream.prototype = Object.create(stream.Read.prototype, {
  constructor: { value: NavDataStream}}
});
function NavDataStream() {
    stream.Readable.call(this, {objectMode: true});
} 
var navDataStream = new NavDataStream(); 
client.on('navdata', function (data) {
    navDataStream.push(data);
});
    
navDataStream(db.createWriteStream()).
