var stream = require('stream');
// Creates a paused stream.
// var Buffer = require('./buffer');
// var buffer = new Buffer();
// Call buffer.start() to start streaming out data

buffer.prototype = Object.create(stream.Transform.prototype, {
  constructor: { value: buffer}
});

function buffer() {
   stream.Transform.call(this, {objectMode: true}); 
}

buffer.prototype._transform = function(chunk, encoding, done) { 
    this.push(chunk); 
    if (!this.start) {
        this.start = done;
    } else {
        done();
    }
};
module.exports = buffer; 
