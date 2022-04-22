'use strict';

try {
  
const port = require("./peaches/port");

module.exports.port = function (event) {
  return port.run(event)
    .then(response => response)
    .catch(e => e);
}
  
} catch (e) {
  
module.exports.port = async () => e.toString();
  
}
