'use strict';

try {

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
    },
		runChain: function() {
			this.next({ chainIs: this.params.chain });
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

} catch (err) {
module.exports.port = async () => {
	return { err };
}
}
