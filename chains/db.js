const { Chain } = require("scripts/chain");

const db = new Chain({
  steps: {
    initMongo: function() {
      this.next({
        oak,
        message: "mongo is running",
        path: this.path,
        event: this.event
      });
    }
  },
  instruct: {
    init: () => [
      "initMongo"
    ]
  }
});

module.exports = { db };
