import { merge } from "htmlbars-runtime/utils";
import LazyValue from "bound-templates/lazy-value";
import { get } from "ember-metal/property_get";
import { set } from "ember-metal/property_set";
import { addObserver, removeObserver } from "ember-metal/observer";

export function EmberObserverLazyValue(obj, path) {
  this.obj = obj;
  this.path = path;

  // intentionally not calling LazyValue's constructor
  // because valueFn is defined in our prototype

  addObserver(obj, path, this, 'notify');
}

EmberObserverLazyValue.prototype = Object.create(LazyValue.prototype); // TODO: polyfill

merge(EmberObserverLazyValue.prototype, {
  valueFn: function() {
    return get(this.obj, this.path);
  },

  setValue: function(value, sender) {
    set(this.obj, this.path, value);
    return value;
  },

  updateObject: function(newObj) {
    removeObserver(this.obj, this.path, this, 'notify');
    this.obj = newObj;
    this.notify();
    addObserver(newObj, this.path, this, 'notify');
  },

  dependentKeys: null,

  addDependentKeys: function(_dependentKeys) {
    var dependentKeys = this.dependentKeys = this.dependentKeys || [],
        dependentKey;

    for (var i = 0, l = _dependentKeys.length; i < l; i++) {
      dependentKey = _dependentKeys[i];
      addObserver(this.obj, this.path + '.' + dependentKey, this, 'notify');
      dependentKeys.push(dependentKey);
    }
  },

  destroy: function() {
    removeObserver(this.obj, this.path, this, 'notify');
    // TODO: teardown DKs
    this.obj = this.path = null;
    LazyValue.prototype.destroy.call(this);
  }
});
