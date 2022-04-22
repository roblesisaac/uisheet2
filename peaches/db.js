const { Peach } = require("scripts/peach");
const { MongoClient, ServerApiVersion } = require("mongodb");
let client = null;

const db = new Peach({
  steps: {
    connect: function() {
      var options = {
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        serverApi: ServerApiVersion.v1
      };
      
      const Client = new MongoClient(process.env.DB, options);
      
      Client.connect().then(res => {
        client = res;
        this.next({ client, message: "hi" });
      });
      
      // client.connect(err => {
      //   const collection = client.db("db").collection("sheets");
      //   this.next({ message: "connected!" });
      //   // perform actions on the collection object
      //   client.close();
      // });
      
    },
    isConnected: function() {
      this.next(!!client);
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
