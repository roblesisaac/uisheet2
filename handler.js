'use strict';

const { Chain, convert, obj, type } = require("./scripts/chain");

const handle = new Chain({
  steps: {
		roce: function(last, event, next) {
			var a = obj.deep(this, last);
      next({
        name: obj.deep(a, "name.first"),
        message: "chain is running!",
        event
      });
		},
    respond: function(event, next) {
      var a = {
        name: {
          first: "isaac"
        }
      };
      
      [1,2,3].loop((i, item , nx) => {
        a.name.first += item;
        nx();
      }).then(() => {
				next(a)
      });
    }
  },
  instruct: {
    serve: (event) => [{ respond: event }, {roce: ["last", event]}]
  }
});

module.exports.port = async event => handle.serve(event)
                .then(response => response)
                .catch(e => e);
