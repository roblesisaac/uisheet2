const { convert, obj, type } = require("./utils");

function Memory(chain) {
  this._absorb(chain);
}

Memory.prototype._absorb = function(chain) {
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

    var data = format(dataObj);
    
    var assignProp = (prop) => {
      var value = data[prop];

      if (obj.hasProp(assignee, prop)) {
        return;
      };

      if (obj.hasProp(chain, prop)) {
        getAndSetFromChain(prop);
        return;
      }

      if (typeof value == "function") {
        defineGetterMethod(value, prop);
        return;
      }

      assignee[prop] = value;
    };

    Object.keys(data).forEach(assignProp);
  };

  assignProps(chain, bp.state);
  assignProps(this, bp.state);
  assignProps(this, bp.input);
  
  return this;
};

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

module.exports = { Memory };
