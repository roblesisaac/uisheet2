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
		
    serve: function(event) {
			var path = event.pathParameters

			return [
				{ event, path	}, path,
				{
					if: { has: path.chain },
					true: obj.deep(chains, event.pathParameters.chain)
				}
			];
		
		}
	
  }
});

module.exports = port;
