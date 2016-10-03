import Symbol from 'es6-symbol';
import EventEmitter from 'eventemitter3';
import get from 'lodash/get';
import set from 'lodash/set';
import assign from 'lodash/assign';
import values from 'lodash/values';
import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import isNil from 'lodash/isNil';
import {
  requires,
  assertDisposable,
  assertString,
} from './asserts';
import createClass from './util/create-class';
import decorateObject from './util/decorate-object';
import subscribableMixin from './mixins/subscribable';
import disposableMixin from './mixins/disposable';
import disposableDecorator from './mixins/decorator/disposable-decorator';

const FIELDS = {
  type: Symbol('type'),
  state: Symbol('state'),
  emitter: Symbol('emitter'),
};

function onDispose() {
  this[FIELDS.emitter].emit('component:dispose', this);
  this[FIELDS.emitter].removeAllListeners();
}

function transition(...args) {
  let previous = args[0];
  const path = args.length >= 3 ? args[1] : null;
  const value = JSON.parse(JSON.stringify(args.length >= 3 ? args[2] : args[1]));

  if (isNil(previous)) {
    if (isNil(value)) {
      return value;
    } else if (isArray(value)) {
      previous = [];
    } else if (isPlainObject(value)) {
      previous = {};
    }
  }

  const current = JSON.parse(JSON.stringify(previous));

  if (path) {
    assertString(path);
    return set(current, path, value);
  }

  return value;
}
/**
 * @namespace Component
 * @class
 * A component is simply a structured set of data defined by a type.
 * @examples
 * const component = new Component('health', { hp: 100 });
 * const componentType = component.getType();
 * @param {!string} type - The component type.
 * @param {*} [state] - The initial state.
 * @mixes Subscribable
 * @mixes Disposable
 */
const Component = createClass({

  /**
   * A change event occurs when the state of a component changes.
   * @event component:change
   * @param {Component} component - The component that changed.
   * @param {*} newState - The new value of the component.
   * @param {*} oldState - The old value of the component.
   * @instance
   * @memberof Component
   */

  /**
   * A dispose event occurs when a component is being disposed.
   * @event component:dispose
   * @param {Component} component - The component that is being disposed.
   * @listens Component#Component: change
   * @instance
   * @memberof Component
   */

  mixins: [
    decorateObject(subscribableMixin(FIELDS.emitter), disposableDecorator),
    disposableMixin(values(FIELDS), onDispose),
  ],

  constructor(type, state = null) {
    requires('type', type);

    /**
     * A literal that identifies the type of data in the component.
     * @member {string} type
     * @readonly
     * @instance
     * @memberof Component
     * @private
     */
    this[FIELDS.type] = type;

    /**
     * The data contained in the component.
     * @member {*} state
     * @instance
     * @memberof Component
     * @private
     */
    this[FIELDS.state] = transition(null, state);

    /**
     * The event emitter.
     * @member {EventEmitter} emitter
     * @instance
     * @memberof Component
     * @private
     * @ignore
     */
    this[FIELDS.emitter] = new EventEmitter();
  },

  /**
   * Get the component type.
   * @returns {string} The component type.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof Component
   */
  getType() {
    assertDisposable(this);
    return this[FIELDS.type];
  },

  /**
   * Get data from the component state. Returns the entire state if no path is specified.
   * @param {string} [path] - The path to a value in the state.
   * @returns {*} The requested value from the state.
   * @examples
   * # Will set handle equal to 'TheChimo'
   * const component = new Component('player', { user: { id: 1337, handle: 'TheChimo' } };
   * const handle = component.get('user.handle');
   * console.log(handle == 'TheChimo');
   * @throws {TypeError} Will throw this error if the path argument is not a string.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof Component
   */
  getState(path) {
    assertDisposable(this);

    if (path) {
      assertString(path);
    }

    const value = !path ? this[FIELDS.state] : get(this[FIELDS.state], path);

    if (isArray(value)) {
      return assign([], value);
    } else if (isPlainObject(value)) {
      return assign({}, value);
    }

    return value;
  },

  /**
   * Set data into the component state. Replaces the entire state if no path is specified.
   * @param {string} [path] - The path in the state where to set the data.
   * @param {*} data - The data to set.
   * @returns {Component} Itself
   * @examples
   * # Will set user.handle equal to 'somethingElse'
   * const component = new Component('player', { user: { id: 1337, handle: 'TheChimo' } };
   * component.set('user.handle', 'somethingElse');
   * @emits Component#component:change
   * @throws {TypeError} Will throw this error if the path argument is not a string.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof Component
   */
  setState(...args) {
    assertDisposable(this);

    const previous = this[FIELDS.state];
    this[FIELDS.state] = transition(previous, ...args);
    this[FIELDS.emitter].emit('component:change', this, this.getState(), previous);
    return this;
  },

});

export default Component;
