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
  
  var chainMethod = function(memory, parentSpecial, chainIsForeign) {
    var _args = arguments;
    
    var getMemory = (res, _rej, _chainName) => {
      var isMemory = obj.deep(memory, "constructor.name") == "Memory";
      
      if(isMemory) {
        memory._res = [res].concat(memory._res);
            
        if(chainIsForeign || memory._args[1]) {
          memory._absorb(chain);
        }
        
        return memory;
      }

      var tools = { _res: [res], _rej, _chainName, _args: [_args] };
      
      return new Memory(chain)._addTools(tools);
    };

    return new Promise(function(res, rej) {
      var memry = getMemory(res, rej, chainName),
          args = memry._args,
          arg = args[1] ? args.shift() : args[0];
          steps = getSteps(arg);
          
      steps.method(memry, null, parentSpecial);
    });
  };

  chainMethod.steps = getSteps;
  chainMethod.step = getStep;
  chainMethod._ = function(args) {
    return function(res, next) {
      var { _args, _step } = this,
          { specialProp, chain, methodName } = _step;
          
      _args.unshift(convert.toArray(args))
      
      chainMethod(this, specialProp, chain[methodName]).then(next);
    }
  }; 

  if (chainName != "run") {
    chain._library.chains[chainName] = chainMethod;
  }

  obj.assignNative(chain, chainName, chainMethod);
}

function getStep(sIndex, args, steps) {
  steps = steps || this.steps(args);
  
  return steps.index == sIndex || steps.missingIndex
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
    isVariation: !!chain[methodName] || methodName == "chainMethod",
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
    method: function(memory, rabbitTrail, parentSpecial) {
      var { nextStep, isFinalStep, isSpecial, isVariation, handleError } = this,
          { _res, _args } = memory;

      var method = chain[methodName] || chain._steps[methodName] || stepPrint,
          theSpecial = specialProp || parentSpecial,
          updater = theSpecial == "if" ? "_condition" : "args",
          self = this;

      var next = function() {
        if (arguments.length) {
          if (theSpecial && memory._conditions) {
            memory._conditions.push(arg);
          } else {
            memory[updater] = Array.from(arguments);
          }
        }

        if (isFinalStep || memory._endAll) {
          var resolve = rabbitTrail || _res.shift();

          if (typeof resolve == "function") {
            var output = memory[updater] || [];
            resolve(output[0]);
          }

          return;
        }

        nextStep.call(self).method(memory, rabbitTrail, parentSpecial);
      };

      var setupArgs = () => {
        var arr = isObj && !isSpecial 
              ? stepPrint[methodName]
              : memory[updater];
              
        arr = convert.toArray(arr);
        
        return arr.concat([next]);
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

      if (isVariation) {
        method(memory, specialProp, !chain[methodName]).then(next);
        return;
      }

      if (methodName == "boolean") {
        memory[updater] = stepPrint;
        return next();
      }

      if (typeof method != "function") {
        var data = stepData();

        for (var key in data) {
          var value = data[key],
              def = obj.tip(memory, key);
              
          def.obj[def.prop] = obj.deep(memory, value) || value;
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
