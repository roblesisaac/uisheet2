const { Peach } = require("scripts/peach");
const mongoose = require("mongoose");

const db = new Peach({
  input: {
    time: () => Date.now()
  },
  steps: {
    connect: function() {
      var options = {
        useCreateIndex: true,
        autoIndex: true,
        keepAlive: true
      };
      
      mongoose.connect(process.env.DB, options).then(database => {
        isConnected = database.connections[0].readyState;
        this.next();
      });
    },
    promiseResolve: function() {
      Promise.resolve();
    },
    initMongo: function() {
      this.next({
        message: `mongo is running ${this.sheetName} AT ${this.time}`,
        path: this.path
      });
    }
  },
  instruct: {
    init: () => [
      {
        if: !!isConnected,
        true: "promiseResolve",
        false: "connect"
      }
    ]
  }
});

module.exports = db;
