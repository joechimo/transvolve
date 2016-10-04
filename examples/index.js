var engine = require('./example2');

engine.init()
  .then(() => {
    engine.start();
  });
