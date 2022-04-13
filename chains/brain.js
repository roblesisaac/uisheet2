const brain = new Chain({
  input: {
    brainKey: "brain1234"
  },
  steps: {
    connectToBrain: (res, next) => {
      next("connected to brain #" + this.brainKey);
    }
  },
  instruct: {
    connect: "connectToBrain"
  }
});

module.exports = { brain };
