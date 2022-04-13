'use strict';

const { port } = require("./chains/port");

module.exports.port = async event => port.serve(event)
  .then(response => response)
  .catch(e => e);
