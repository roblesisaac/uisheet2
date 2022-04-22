const { Peach } = require("scripts/peach");
const { MongoClient, ServerApiVersion } = require("mongodb");
let connection = null;

const db = new Peach({
  steps: {
    connect: function() {
      var options = {
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        serverApi: ServerApiVersion.v1
      };
      
      const client = new MongoClient(process.env.DB, options);
      
      client.connect(err => {
        const collection = client.db("db").collection("sheets");
        this.next({ message: "connected!" });
        // perform actions on the collection object
        client.close();
      });
      
    },
    isConnected: function() {
      this.next(!!connection && !!connection.serverConfig.isConnected);
    },
    promiseResolve: function() {
      Promise.resolve(connection);
    }
  },
  instruct: {
    init: () => [
      {
        if: "isConnected",
        true: "promiseResolve",
        false: "connect"
      }
    ]
  }
});

module.exports = db;
