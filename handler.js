'use strict';

const { Chain, convert, obj, type } = require("./scripts/chain");

const handle = new Chain({
  steps: {
    respond: function(event) {
      var a = {
        name: {
          first: "isaac"
        }
      };
      
      [1,2,3].loop((i, item , nx) => {
        a.name.first += item;
        nx();
      }).then(() => {
        this.next({
          name: obj.deep(a, "name.first"),
          message: "chain is running!",
          event
        });
      });
    }
  },
  instruct: {
    serve: (event) => [{ respond: event }]
  }
});

module.exports.port = async (event) => {
  return await handle.serve(event)
                .then(response => response)
                .catch(e => e);
};
