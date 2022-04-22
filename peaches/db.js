const { Peach } = require("scripts/peach");
const { MongoClient, ServerApiVersion } = require("mongodb");
let dbPeach = null;

const db = new Peach({
  steps: {
    connect: function() {
      var options = {
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        serverApi: ServerApiVersion.v1
      };
      
      const Client = new MongoClient(process.env.DB, options);
      
      Client.connect(err => {
        // if(err) {
        //   this.next({ err: err.toString() });
        //   return;
        // }
        
        dbPeach = Client.db("db");
        this.next({ message: "connected!", err: err.toString() });
        // perform actions on the collection object
        Client.close();
      });
      
    },
    isConnected: function() {
      this.next(!!dbPeach);
    },
    promiseResolve: function() {
      Promise.resolve(dbPeach);
      this.next({ m: "already" });
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
