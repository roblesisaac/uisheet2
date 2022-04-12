const { convert, obj, type } = require("./utils");
const { Memory } = require("./memory");

function Chain(blueprint) {
  var instruct = blueprint.instruct;

  var natives = {
    _blueprint: obj.copy(blueprint),
    _steps: Object.assign({}, this._library.steps, blueprint.steps)
  };

  Object.keys(natives).forEach((prop) => {
    obj.assignNative(this, prop, natives[prop])
  });

  if (!type.isObject(instruct)) {
    buildChain(instruct, this, "run");
    return;
  }

  for (var vName in instruct) {
    buildChain(instruct[vName], this, vName);
  }
}

Chain.prototype._library = {
  chains: {},
  specials: ["if", "each", "setup"],
  steps: {
    "&": function(last) {
      if (!this._conditions) {
        this._addTools({
          _conditions: [last]
        });
      }
    },
    alert: function(messageProp) {
      var message = obj.deep(this, messageProp);
      alert(message || messageProp);
    },
    each: function(notSure, next) {
      var each = this._step.each,
          getData = each.each,
          iteration = each.run || each.async;

      var methodForEach = (i, item, nxt) => {
        this._remember({ i, item });
        iteration.method(this, nxt);
      };

      getData.method(this, (data) => {
        if (!Array.isArray(data)) {
          console.error({ notAnArray: data });
          return;
        }

        if (each.async) {
          data.loop(methodForEach).then(next);
          return;
        }

        for (var i = 0; i < data.length; i++) {
          methodForEach(i, data[i]);
        }

        next();
      });
    },
    if: function(last, next) {
      var data = this._step.if,
          condition = data.if || data.switch;

      condition.method(this, (res) => {
        var answer = data[res],
          allTrue = arr => !arr.filter(item => !item).length,
          conds = this._conditions;

        if (conds) {
          answer = data[allTrue(conds)];
        }

        delete this._conditions;

        if (!answer) {
          next();
          return;
        };

        answer.method(this, next);
      });
    },
    incr: function(prop) {
      var counter = obj.valueTip(this, prop);
      counter.obj[counter.prop]++;
    },
    isString: function(item) {
      var constant = obj.deep(this, item);
      this.next(typeof constant == "string");
    },
    log: function(messageProp) {
      var message = obj.deep(this, messageProp);

      if (!message && message != 0) message = messageProp;

      console.log(message);
    },
    restart: function(last, next) {
      var step = this._step,
          restart = () => step.firstStep().method(this);

      setTimeout(restart);
    },
    wait: function(time, next) {
      setTimeout(next, time * 1000);
    }
  }
}

Chain.prototype.addGlobalSteps = function(steps) {
  Object.assign(Chain.prototype._library.steps, steps);
}

function buildChain(stepsArr, chain, chainName) {
  var getSteps = function(args) {
    var instructs = convert.toInstruct(stepsArr, args);
    return buildSteps(instructs, chain, chainName);
  }
  
  var chainMethod = function(memory) {
    var _args = arguments;

    var getMemory = (_res, _rej, _chainName) => {
      return memory && memory._remember ?
        memory :
        new Memory(chain)
        ._addTools({
          _res,
          _rej,
          _chainName,
          _args
        });
    }

    return new Promise(function(res, rej) {
      var steps = getSteps(_args);
      steps.method(getMemory(res, rej, chainName));
    });
  }

  chainMethod.steps = getSteps;
  chainMethod.step = getStep;

  if (chainName != "run") {
    chain._library.chains[chainName] = chainMethod;
  }

  obj.assignNative(chain, chainName, chainMethod);
}

function getStep(sIndex, args) {
  var stepPrint = this.steps(args || []);

  if (!stepPrint) return {
    chainIsMissing: sIndex
  };

  for (var i = 0; i < sIndex; i++) {
    stepPrint = stepPrint.nextStep() || {
      indexNotFound: sIndex
    };
  }

  return stepPrint;
}

function buildSteps(stepsArr, chain, chainName, prev, stepIndex, specialProp) {
  if (!stepsArr || !stepsArr.length) {
    return;
  }
  
  stepsArr = stepsArr.slice();

  var stepPrint = stepsArr.shift(),
      isObj = type.isObject(stepPrint),
      specials = chain._library.specials,
      index = stepIndex || 0;

  var methodName = typeof stepPrint == "string" 
        ? stepPrint
        : type.isObject(stepPrint)
        ? Object.keys(stepPrint)[0]
        : stepPrint.name || typeof stepPrint;

  var buildSub = function(index, sProp, instructs, previous) {
    instructs = instructs || stepsArr;
    previous = previous || this;
    sProp = sProp || specialProp;
    return buildSteps(instructs, chain, chainName, previous, index, sProp);
  };

  return {
    chain,
    chainName,
    isFinalStep: !stepsArr.length,
    isSpecial: specials.includes(methodName),
    index,
    methodName,
    prev,
    stepPrint,
    init: function() {
      var setupComplete;

      var setupSpecial = (special) => {
        var isSpecial = obj.hasProp(stepPrint, special);

        if (!isSpecial || setupComplete) {
          return;
        }

        var specialData = {};

        for (var sProp in stepPrint) {
          var instructs = convert.toArray(stepPrint[sProp]).flat();
          specialData[sProp] = buildSub(0, sProp, instructs, prev);
        }

        this[special] = specialData;
        setupComplete = true;
      };

      specials.forEach(setupSpecial);

      return this;
    },
    firstStep: function() {
      return this.prev ?
        this.prev.firstStep() :
        this;
    },
    nextStep: function() {
      return buildSub.call(this, index + 1);
    },
    method: function(memory, rabbitTrail) {
      var { nextStep, isFinalStep, isSpecial } = this,
          { _rej, _res, _chainName, _args } = memory;

      var method = chain._steps[methodName] || stepPrint,
          updater = specialProp == "if" ? "_condition" : "last";

      var next = (arg) => {
        if (typeof arg != "undefined") {
          if (specialProp && memory._conditions) {
            memory._conditions.push(arg);
          } else {
            memory[updater] = arg;
          }
        }

        if (isFinalStep) {
          var resolve = rabbitTrail || _res;

          if (typeof resolve == "function") {
            resolve(memory[updater]);
          }

          return;
        };

        nextStep.call(this).method(memory, rabbitTrail);
      };

      var setupArgs = () => {
        var args = stepPrint[methodName];

        var arr = isObj && !isSpecial 
              ? convert.toArray(args)
              : [memory.last];

        arr.push(next);

        return arr;
      };

      var stepData = () => {
        if (!isObj || isSpecial) {
          return {};
        }

        for (var i in arguments) {
          delete stepPrint[arguments[i]];
        };

        return stepPrint;
      };

      var handleError = function(e) {
        if (_rej && typeof _rej == "function") {
          _rej(e);
          return;
        }

        console.error(e);
        return;
      }

      var variation = methodName == "chainMethod" 
            ? stepPrint
            : chain[methodName];

      if (variation) {
        variation.steps(_args).method(memory, next);
        return;
      }

      if (methodName == "boolean") {
        memory[updater] = stepPrint;
        next();
        return;
      }

      if (typeof method != "function") {
        var data = stepData();

        for (var key in data) {
          var value = data[key];

          data[key] = obj.deep(memory, value) || value;
        }

        memory._remember(data);
        return next();
      }

      var args = setupArgs(),
          data = stepData(methodName),
          autoCompletes = method.toString().includesAny("next", "return;");

      memory
        ._remember(data)
        ._addTools({ _step: this, next });

      try {
        method.apply(memory, args);
      } catch (error) {
        handleError({
          error: error.toString(),
          methodName,
          chainName,
          _chainName,
          stepPrint
        });
        return;
      }

      if (!autoCompletes) {
        next();
      }
    }
  }.init();
}

module.exports = { Chain, convert, obj, type };
