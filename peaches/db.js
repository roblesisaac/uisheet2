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
      console.log({ sheetName });
      this.next({ message: "hi" });
      // dbPeach.collection(this.sheetName).find({}, (res) => {
      //   this.next({ res, sheetName: this.sheetName });
      // });
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
        false: [
          "fetchCollection"
        ]
      }
    ]
  }
});

module.exports = db;
