const { Chain, convert, obj, type } = require("scripts/chain");
const db = require("./db");
const brain = require("./brain");

var chains = {
	brain,
	db
};

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
      {
        if: { has: "path.chain" },
        true: obj.deep(chains, event.pathParameters.chain)
      }
    ]
  }
});

module.exports = port;
