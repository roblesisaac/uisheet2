const { convert, obj, type } = require("./utils");
const { Memory } = require("./memory");
const { globalSteps } = require("./globalSteps");

function Chain(blueprint) {
  var instruct = blueprint.instruct;

  var natives = {
    _blueprint: obj.copy(blueprint),
    _steps: Object.assign({}, this._library.steps, blueprint.steps)
  };

  Object.keys(natives).forEach((prop) => {
    obj.assignNative(this, prop, natives[prop]);
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
  steps: globalSteps
};

Chain.prototype.addGlobalSteps = function(steps) {
  Object.assign(Chain.prototype._library.steps, steps);
};

function buildChain(stepsArr, chain, chainName) {
  var getSteps = function(args) {
    var instructs = convert.toInstruct(stepsArr, args);
    return buildSteps(instructs, chain, chainName);
  };
  
  var chainMethod = function(memory) {
    var _args = arguments;

    var getMemory = (_res, _rej, _chainName) => {
      return memory && memory._remember
        ? memory
        : new Memory(chain)._addTools({ _res, _rej, _chainName, _args });
    };

    return new Promise(function(res, rej) {
      var steps = getSteps(_args);
      steps.method(getMemory(res, rej, chainName));
    });
  };

  chainMethod.steps = getSteps;
  chainMethod.step = getStep;

  if (chainName != "run") {
    chain._library.chains[chainName] = chainMethod;
  }

  obj.assignNative(chain, chainName, chainMethod);
}

function getStep(sIndex, args, steps) {
  if(steps && steps.missingIndex) {
    return steps;
  }
  
  if(!steps) {
    steps = this.steps(args);
  }
  
  return steps.index == sIndex
    ? steps
    : getStep(sIndex, args, steps.nextStep() || { missingIndex: sIndex });
}

function buildSteps(stepsArr, chain, chainName, prev, stepIndex, specialProp) {
  if (!stepsArr || !stepsArr.length || stepIndex == stepsArr.length) {
    return;
  }

  var index = stepIndex || 0,
      stepPrint = stepsArr[index],
      isObj = type.isObject(stepPrint),
      specials = chain._library.specials;

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
    isFinalStep: stepsArr.length == index+1,
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
    handleError: function(memory, error) {
      var { _rej, _chainName } = memory,
        errMessage = {
        error,
        methodName,
        chainName,
        _chainName,
        prev,
        stepPrint
      };
      
      if (_rej && typeof _rej == "function") {
        _rej(errMessage);
        return;
      }

      console.error(errMessage);
      return;
    },
    method: function(memory, rabbitTrail) {
      var { nextStep, isFinalStep, isSpecial, handleError } = this,
          { _res, _args } = memory;

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

        if (isFinalStep || memory._endAll) {
          var resolve = rabbitTrail || _res;

          if (typeof resolve == "function") {
            resolve(memory[updater]);
          }

          return;
        }

        nextStep.call(this).method(memory, rabbitTrail);
      };

      var setupArgs = () => {
        var arr = isObj && !isSpecial 
              ? convert.toArray(stepPrint[methodName])
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
        }

        return stepPrint;
      };

      if(memory._error) {
        handleError(memory, memory._error);
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
        return next();
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
          autoCompletes = method.toString().includesAny("next", "return");

      memory
        ._remember(data)
        ._addTools({ _step: this, next });

      try {
        method.apply(memory, args);
      } catch (error) {
        handleError(memory, error.toString());
        return;
      }

      if (!autoCompletes) {
        next();
      }
    }
  }.init();
}

module.exports = { Chain, convert, obj, type };
