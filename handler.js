'use strict';

try {
  
  const Port = requires("./peaches/port");
  
  const port = event => Port.run(event)
      .then(response => response)
      .catch(e => e);

  module.exports = { port };
  
} catch (e) {
  
  module.exports.port = () => e.toString();
  
}
