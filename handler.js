'use strict';

try {
  
const port = require("./peaches/port");

module.exports.port = async event => {
// await port.run(event)
//   .then(response => response)
//   .catch(e => e);
  return event;
}
  
} catch (e) {
  
module.exports.port = async () => e.toString();
  
}
