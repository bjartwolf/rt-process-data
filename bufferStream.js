var stream = require('stream');
//Takes a steam of object and selects one key in the objectream and
//prints that key's value.
//Could throw an error... but it doesn't

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
