const { Peach } = require("natives/peach");

const brain = new Peach({
  input: {
    brainKey: "brain1234"
  },
  steps: {
    connectToBrain: function(res, next) {
      next("connected to brain #" + this.brainKey);
    }
  },
  instruct: {
    connect: "connectToBrain"
  }
});

module.exports = brain;
