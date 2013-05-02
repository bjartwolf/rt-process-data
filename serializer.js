var stream = require('stream');
//Takes a steam of object and selects one key in the objectream and
//prints that key's value.
//Could throw an error... but it doesn't

serializer.prototype = Object.create(stream.Transform.prototype, {
  constructor: { value: serializer}
});

function serializer() {
   stream.Transform.call(this, {objectMode: true}); 
}

serializer.prototype._transform = function(chunk, encoding, done) { 
   this.push(JSON.stringify(chunk)); 
   done();
};
module.exports = serializer; 
