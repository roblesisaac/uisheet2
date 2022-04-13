const { Chain, convert, obj, type } = require("scripts/chain");

var chains = {
	brain: require("./brain"),
	db: require("./db")
};

const port = new Chain({
  steps: {
    respond: (last, next) => {
      next({ last });
    }
  },
  instruct: {
	  serve: event => [
		  { event },
		  event.pathParameters,
		  {
		  	if: { has: "chain" },
			true: obj.deep(chains, event.pathParameters.chain)
		  }
	  ]	
  }
});

module.exports = port;
