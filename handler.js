'use strict';

const Chain = require("./scripts/chain");

const handle = new Chain({
  steps: {
    respond: function(event) {
      this.next({
        time: convert.toArray("12"),
        message: "chain is running!",
        event
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
