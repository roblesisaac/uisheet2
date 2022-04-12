function Memory(chain) {
    var bp = chain._blueprint,
        format = data => obj.copy(convert.toObject(data || {}, chain));

    var assignProps = (assignee, dataObj) => {
        if (!dataObj) return;

        var define = (prop, definer) => {
                Object.defineProperty(assignee, prop, definer);
            },
            defineGetterMethod = (value, prop) => {
                define(prop, {
                    enumerable: true,
                    get: value.bind(this)
                });
            },
            getAndSetFromChain = (prop) => {
                define(prop, {
                    enumerable: true,
                    get: () => chain[prop],
                    set: (newValue) => chain[prop] = newValue
                });
            };

        var keys = Object.keys,
            data = format(dataObj),
            assignProp = (prop) => {
                var value = data[prop];

                if (keys(assignee).includes(prop)) return;

                if (keys(chain).includes(prop)) {
                    getAndSetFromChain(prop);
                    return;
                }

                if (typeof value == "function") {
                    defineGetterMethod(value, prop);
                    return;
                }

                assignee[prop] = value;
            };

        keys(data).forEach(assignProp);
    };

    assignProps(chain, bp.state);
    assignProps(this, bp.state);
    assignProps(this, bp.input);
}

Memory.prototype._remember = function() {
    for (var i in arguments) {
        Object.assign(this, arguments[i]);
    }
    return this;
};

Memory.prototype._addTools = function(data) {
    var config = (prop) => {
        return {
            configurable: true,
            writable: true,
            value: data[prop]
        };
    };

    for (var prop in data) {
        Object.defineProperty(this, prop, config(prop));
    }

    return this;
}

function Chain(blueprint) {
    var instruct = blueprint.instruct;

    var natives = {
        _blueprint: obj.copy(blueprint),
        _steps: Object.assign({}, this._library.steps, blueprint.steps),
        _run: {}
    };

    Object.keys(natives).forEach((prop) => {
        obj.assignNative(this, prop, natives[prop])
    });

    if (type.isNotObject(instruct)) {
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
                loop = each.run || each.async,
                memory = iteration => this._remember(iteration);

            var asyncMethod = (i, item, nxt) => {
                loop.method(memory({
                    i,
                    item
                }), nxt);
            };

            getData.method(this, (data) => {
                if (!Array.isArray(data)) {
                    console.error({
                        notAnArray: data
                    });
                    return;
                }

                if (each.async) {
                    data.loop(asyncMethod).then(next);
                    return;
                }

                for (var i = 0; i < data.length; i++) {
                    loop.method(memory({
                        i,
                        item: data[i]
                    }));
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
                {
                    chain,
                    chainName
                } = step,
                restart = () => chain._run[chainName].method(this);

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
    var steps = buildSteps(stepsArr, chain, chainName),
        instruct = chain._blueprint.instruct;

    var getStepPrints = (ins, args) => {
        return typeof ins == "function" ?
            convert.toArray(ins.apply(chain, args)).flat() :
            null;
    }

    var chainMethod = function(memory) {
        var _prints = getStepPrints(instruct[chainName], arguments);

        var getMemory = (_res, _rej, _chainName) => {
            return memory && memory._remember ?
                memory :
                new Memory(chain)._addTools({
                    _res,
                    _rej,
                    _chainName,
                    _prints
                });
        }

        return new Promise((res, rej) => {
            steps.method(getMemory(res, rej, chainName));
        });
    }

    assignChain(chain, chainName, steps, chainMethod);
}

function assignChain(chain, chainName, stps, chainMethod) {
    chain._run[chainName] = stps;
    chainMethod.steps = stps;
    chainMethod.step = getStep;
    obj.assignNative(chain, chainName, chainMethod);

    if (chainName != "run") {
        chain._library.chains[chainName] = stps;
    }
}

function getStep(sIndex) {
    var stepPrint = this.steps;

    if (!stepPrint) return {
        chainIsMissing: sIndex
    };

    for (var i = 0; i < sIndex; i++) {
        stepPrint = stepPrint.nextStep || {
            indexNotFound: sIndex
        };
    }

    return stepPrint;
}

function buildSteps(stepsArr, chain, chainName, prev, stepIndex, specialProp) {
    stepsArr = convert.toInstruct(stepsArr).flat();

    if (!stepsArr || !stepsArr.length) {
        return;
    }

    var getMethodName = prnt => !prnt ?
        null :
        typeof prnt == "string" ?
        prnt :
        type.isObject(prnt) ?
        Object.keys(prnt)[0] :
        prnt.name || typeof prnt;

    var stepPrint = stepsArr.shift(),
        methodName = getMethodName(stepPrint),
        specials = chain._library.specials,
        index = stepIndex || 0;

    var buildSub = function(index, sProp, instructs, previous) {
        instructs = instructs || stepsArr;
        previous = previous || this;
        sProp = sProp || specialProp;
        return buildSteps(instructs, chain, chainName, previous, index, sProp)
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
                    var instructs = convert.toArray(stepPrint[sProp]);

                    specialData[sProp] = buildSub(0, sProp, instructs, prev);
                }

                this[special] = specialData;
                setupComplete = true;
            };

            specials.forEach(setupSpecial);

            this.nextStep = buildSub.call(this, index + 1);

            return this;
        },
        method: function(memory, rabbitTrail) {
            var {
                nextStep,
                isFinalStep,
                isSpecial
            } = this, {
                _rej,
                _res,
                _prints,
                _print,
                _chainName
            } = memory;

            var getStepPrint = function() {
                if (!_prints || chainName != _chainName) {
                    return stepPrint;
                }

                if (specialProp) {
                    var specialChain = _print[specialProp];
                    return convert.toArray(specialChain)[index];
                }

                var stp = memory._print = _prints[index];

                return obj.copy(stp || stepPrint);
            };

            var currentPrint = getStepPrint(),
                methodName = getMethodName(currentPrint),
                method = chain._steps[methodName] || currentPrint,
                updater = specialProp == "if" ? "_condition" : "last",
                isObj = type.isObject(currentPrint);

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

                nextStep.method(memory, rabbitTrail);
            };

            var setupArgs = () => {
                var arr = [memory.last];

                if (isObj && specials.excludes(methodName)) {
                    arr = currentPrint[methodName];
                    arr = convert.toArray(arr);
                }                
                
                arr.push(next);

                return arr;
            };

            var stepData = () => {
                if (!isObj || isSpecial) {
                    return {};
                }

                for (var i in arguments) {
                    delete currentPrint[arguments[i]];
                };

                return currentPrint;
            };

            var handleError = function(e) {
                if (_rej && typeof _rej == "function") {
                    _rej(e);
                    return;
                }

                console.error(e);
                return;
            }

            var variation = methodName == "chainMethod" ?
                currentPrint.steps :
                chain._run[methodName];

            if (variation) {
                variation.method(memory, next);
                return;
            }

            if (methodName == "boolean") {
                memory[updater] = currentPrint;
                next();
                return;
            }

            if (typeof method != "function") {
								var data = stepData();

								for(var key in data) {
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
                ._addTools({
                    _step: this,
                    next
                });

            try {
                method.apply(memory, args);
            } catch (error) {
                handleError({
                    error: error.toString(),
                    methodName,
                    chainName,
                    _chainName,
                    currentPrint
                });
                return;
            }

            if (!autoCompletes) {
                next();
            }
        }
    }.init();
}

if(typeof module != "undefined") {
    module.exports = { Chain };
}
