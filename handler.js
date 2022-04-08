'use strict';

const { Chain, convert, obj, type } = require("./scripts/chain");

const handle = new Chain({
  steps: {
    respond: function(event) {
      this.next({ event, test });
    }
  },
  instruct: {
    serve: (event) => [{ respond: event }]
  }
});

module.exports.port = async event => handle.serve(event)
                .then(response => response)
                .catch(e => e);
