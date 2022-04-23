const { Peach } = require("natives/peach");
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
        if(err) {
          this.next(err);
          return;
        };
        
        const collection = client.db("db").collection("sheets");
        this.next({ collection });
        client.close();
      });
      
    },
    isConnected: function() {
      this.next(!!client);
    },
    fetchCollection: function() {
      client.db("db").collection("sheets").find({}).then(res => res);
    },
    promiseResolve: function() {
      Promise.resolve().then(r => {
        this.next({ r });
      }).catch(e => {
        this.next({ e, err: e.toString() });
      });
    }
  },
  instruct: {
    init: [
      {
        if: "isConnected",
        true: ["promiseResolve", "fetchCollection"],
        false: "connect"
      }
    ]
  }
});

module.exports = db;
