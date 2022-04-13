const { Chain } = require("scripts/chain");

const db = new Chain({
  steps: {
    initMongo: function() {
      this.next({
        message: "mongo is running",
        path: this.path,
        event: this.event
      });
    }
  },
  instruct: {
    init: () => [
      "initMongo",
      { wait: 3 }
    ]
  }
});

module.exports = { db };
