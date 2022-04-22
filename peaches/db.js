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
    fetchCollection: function() {
      dbPeach.collection(this.sheetName).find({}).then(res => {
        this.next({res});
      });
    },
    promiseResolve: function() {
      Promise.resolve(dbPeach);
      this.next({ m: "already", dbPeach });
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
