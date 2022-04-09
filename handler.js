'use strict';

const { Chain, convert, obj, type } = require("./scripts/chain");

const db = new Chain({
	steps: {
		initMongo: function() {
			this.next("mongo is running");
		}
	},
	instruct: {
		init: () => [
			"initMongo"
		]	
	}
});

const handle = new Chain({
  steps: {
    respond: (last, next) => {
			next(last);
    }
  },
  instruct: {
    serve: (event) => [
    	db.init, "respond"
    ]
  }
});

module.exports.port = async event => handle.serve(event)
                .then(response => response)
                .catch(e => e);
