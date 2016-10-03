import isFunction from 'lodash/isFunction';
import get from 'lodash/get';
import omit from 'lodash/omit';
import assign from 'lodash/assign';
import forEach from 'lodash/forEach';
import map from 'lodash/map';

const PREDEFINED = ['mixins', 'statics'];
const FILTERED = ['constructor', 'prototype'];
const NATIVE_CONSTRUCTOR = Object.prototype.constructor;
const DEFAULT_CONSTRUCTOR = function DefaultConstructor() {};

/**
 * Creates class.
 * Possible to extend passed definition with mixins.
 * @param {Object | Function} definition - Class definition.
 * @return {Function} Constructor.
 */
export default function createClass(definition) {
  if (isFunction(definition)) {
    return definition;
  }

  const statics = omit(get(definition, 'statics', {}), FILTERED);
  const prototype = omit(definition, PREDEFINED);
  const initializers = [];
  const mixins = map(get(definition, 'mixins', []), (mixin) => {
    if (mixin.constructor !== NATIVE_CONSTRUCTOR) {
      initializers.push(mixin.constructor);
    }

    return omit(mixin, FILTERED);
  });

  let Constructor = (function createConstructor(constructor, inits) {
    return function Surrogate(...args) {
      forEach(inits, init => init.apply(this));
      constructor.apply(this, args);
    };
  })(prototype.constructor || DEFAULT_CONSTRUCTOR, initializers);

  Constructor = assign(Constructor, statics);
  // methods from definition have higher priority
  // i.e. if mixin and definition has same methods
  // definition's version will be taken
  Constructor.prototype = assign({}, ...mixins, prototype);

  return Constructor;
}
