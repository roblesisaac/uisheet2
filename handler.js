'use strict';

try {
  
  const Port = require("./peaches/port");
  
  const port = event => Port.run(event)
      .then(response => response)
      .catch(e => e);

  module.exports = { port };
  
} catch (e) {
  
  module.exports.port = async () => e.toString();
  
}
