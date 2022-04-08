'use strict';

const { Chain, convert, obj, type } = require("./scripts/chain");

const handle = new Chain({
  steps: {
		roce: function(a, next) {
      next({
        name: obj.deep(a, "name.first"),
        message: "chain is running!",
        event: this.event
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
    serve: (event) => [{ event }, { respond: event }, "roce"]
  }
});

module.exports.port = async event => handle.serve(event)
                .then(response => response)
                .catch(e => e);
