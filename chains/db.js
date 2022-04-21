const { Chain } = require("scripts/chain");

const db = new Chain({
  input: {
    time: () => Date.now()
  },
  steps: {
    initMongo: function() {
      this.next({
        message: "mongo is running "+ this.sheetName,
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

module.exports = db;
