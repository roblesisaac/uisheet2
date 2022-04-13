'use strict';

try {
  
const port = require("./chains/port");

module.exports.port = async event => port.run(event)
  .then(response => response)
  .catch(e => e);
  
} catch (e) {
  
module.exports.port = async () => e.toString();
  
}
