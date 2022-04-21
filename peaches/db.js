const { Peach } = require("scripts/peach");

const db = new Peach({
  input: {
    time: Date.now()
  },
  steps: {
    initMongo: function() {
      this.next({
        message: `mongo is running ${this.sheetName} AT ${this.time}`,
        path: this.path,
        mongoUser: process.env.mongo.username
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
