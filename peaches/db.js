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
      
      client = new MongoClient(process.env.DB, options);
      
      client.connect(err => {
        const collection = client.db("db").collection("sheets");
        this.next({ collection });
        client.close();
      });
      
      // client.connect(err => {
      //   dbPeach = client.db("db");
      //   this.next({ message: "connected!", err: err.toString() });
      //   // perform actions on the collection object
      //   client.close();
      // });
      
    },
    isConnected: function() {
      this.next(!!client);
    },
    fetchCollection: function() {
      this.next({sheetName});
      // dbPeach.collection(this.sheetName).find({}, (res) => {
      //   this.next({ res, sheetName: this.sheetName });
      // });
    },
    promiseResolve: function() {
      Promise.resolve(client);
      this.next();
    }
  },
  instruct: {
    init: () => [
      {
        if: "isConnected",
        true: ["promiseResolve", "fetchCollection"],
        false: "connect"
      }
    ]
  }
});

module.exports = db;
