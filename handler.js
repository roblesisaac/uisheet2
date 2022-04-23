'use strict';

try {
  
  const Port = require("./peaches/port");
  
  const handleError = (e) => {
    const validKeys = [ "error", "methodName", "peachName", "_peachName" ],
          error = {};
    
    Object.keys(e).forEach(key => {
      if(validKeys.includes(key)) error[key] = e[key];
    });
    
    return error;
  }
  
  const port = event => Port.run(event)
      .then(response => response)
      .catch(handleError);

  module.exports = { port };
  
} catch (e) {
  
  module.exports.port = async () => e.toString();
  
}
