const { Chain, convert, obj, type } = require("scripts/chain");
const { db } = require("./db");

const port = new Chain({
  steps: {
    respond: (last, next) => {
      next({ last });
    }
  },
  instruct: {
    serve: event => [
      { 
	event,
	path: event.pathParameters
      },
      db.init,
      {
        if: {
          has: "path.chain"
        },
        true: function() {
          var chain = this.path.chain;
          this.next({ chain, message: "working!" });
        }
      },
      "respond"
    ]
  }
});

module.exports = { port };
