const { Chain, convert, obj, type } = require("scripts/chain");
const { db } = require("./db");

Chain.prototype.addGlobalSteps({
  has: function(props) {
    var item = obj.deep(this, props);
    this.next(!!item || item === 0);
  }
});

const port = new Chain({
  steps: {
    respond: (last, next) => {
      next({ last });
    }
  },
  instruct: {
    serve: (event) => [
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
