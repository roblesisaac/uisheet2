const { Peach, convert, obj, type } = require("scripts/chain");

var peaches = {
	brain: require("./brain"),
	db: require("./db")
};

const getPath = event => event.pathParameters;

module.exports = new Peach({
	instruct: event => [
	  { event },
	  getPath(event),
	  {
		if: { has: "chain" },
		true: obj.deep(peaches, getPath(event).peach)
	  }
	]
});
