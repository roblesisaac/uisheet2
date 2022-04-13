const { Chain, convert, obj, type } = require("scripts/chain");

var chains = {
	brain: require("./brain"),
	db: require("./db")
};

const getPath = event => event.pathParametersl

const port = new Chain({
	instruct: event => [
	  { event },
	  getPath(event),
	  {
		if: { has: "chain" },
		true: obj.deep(chains, getPath(event).chain)
	  }
	]
});

module.exports = port;
