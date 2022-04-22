const { Peach, convert, obj, type } = require("scripts/peach");

var peaches = {
	brain: require("./brain"),
	db: require("./db")
};

module.exports = new Peach({
	steps: {
		runChain: function() {
			peaches[this.peach]()
		}
	},
	instruct: (event) => {
		const params = event.pathParameters
		
		return [
			{ event, params },
			{
				if: { has: "peach" },
				true: function() { this.next(params) }
			}
		];
	}
});
