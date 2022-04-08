'use strict';

const { Chain, convert, obj, type } = require("./scripts/chain");

const handle = new Chain({
  steps: {
    respond: function(last, next) {
	next(last);
    }
  },
  instruct: {
    serve: (event) => [
	    (last, next) => { next(event) }, 
	    "respond"
    ]
  }
});

module.exports.port = async event => handle.serve(event)
                .then(response => response)
                .catch(e => e);
