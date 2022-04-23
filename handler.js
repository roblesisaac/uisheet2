'use strict';

try {
  
  const Port = require("./peaches/port");
  
  const port = async (event) => {
    var test = await Port.run(event)
      .then(response => response)
      .catch((e) => {
        try { return JSON.stringify(e) } catch (err) { return { err: err.toString(), keys: Object.keys(e) }}
      });
   
    return { event, test };
  }

  module.exports = { port };
  
} catch (e) {
  
  module.exports.port = async () => e.toString();
  
}
