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
    },
		serveEvent: function() {
			this.next({ event: this.event, path: this.path });
		}
  },
  instruct: {
    serve: (event) => [
			{ event },
			{ path: "event.pathParameters" },
			{
				if: { has: "path.chain" },
				true: function() {
					var chain = this.path.chain;
					this.next({ chain });
				}
			}
    ]
  }
});

module.exports.port = async event => handle.serve(event)
                .then(response => response)
                .catch(e => e);
