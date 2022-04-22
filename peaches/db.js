const { Peach } = require("scripts/peach");
const { MongoClient, ServerApiVersion } = require("mongodb");
let db = null;

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
        this.next();
        // perform actions on the collection object
        client.close();
      });
      
    },
    isConnected: function() {
      this.next(!!db && !!db.serverConfig.isConnected);
    },
    promiseResolve: function() {
      Promise.resolve(db);
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
