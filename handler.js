'use strict';

import Chain from "/srcipts/chain.js";

module.exports.port = async (event) => {

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  return { message: 'Go Serverless v3.0! Your function executed successfully!', event };
};
