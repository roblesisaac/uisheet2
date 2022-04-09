'use strict';

const { Chain, convert, obj, type } = require("./scripts/chain");

Chain.prototype.addGlobalSteps({
	has: function(props) {
		var item = obj.deep(this, props);
		this.next(!!item || item === 0);
	}
});

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
			{ event },
			{ path: "event" },
    	db.init,
			(res, next) => { next(this.path) }
    ]
  }
});

module.exports.port = async event => handle.serve(event)
                .then(response => response)
                .catch(e => e);
