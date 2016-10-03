var engine = require('./example1');

engine.init()
  .then(function() {
    engine.start();
  });
