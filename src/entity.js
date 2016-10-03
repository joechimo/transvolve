import Symbol from 'es6-symbol';
import EventEmitter from 'eventemitter3';
import values from 'lodash/values';
import assign from 'lodash/assign';
import forEach from 'lodash/forEach';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import {
  assertComponent,
  assertString,
  assertDisposable,
} from './asserts';
import {
  ComponentNotFoundError,
  ComponentAlreadyOwnedError,
  DuplicateComponentTypeError,
} from './errors';
import createClass from './util/create-class';
import decorateObject from './util/decorate-object';
import subscribableMixin from './mixins/subscribable';
import disposableMixin from './mixins/disposable';
import disposableDecorator from './mixins/decorator/disposable-decorator';

const ID = {
  id: 0,
  getNext: () => ID.id++,
};

const FIELDS = {
  id: Symbol('id'),
  components: Symbol('components'),
  subscriptions: Symbol('subscriptions'),
  emitter: Symbol('emitter'),
};

function onDispose() {
  this[FIELDS.emitter].emit('entity:dispose', this);
  this[FIELDS.emitter].removeAllListeners();
  forEach(this[FIELDS.components], (component) => component.dispose());
}

function onComponentChange(component, current, previous) {
  const type = component.getType();
  this[FIELDS.emitter].emit('entity:change', this, component);
  this[FIELDS.emitter].emit(`entity:change:${type}`, this, component, current, previous);
}

function onComponentDispose(component) {
  this.removeComponents(component);
}

function onComponentError(error) {
  this[FIELDS.emitter].emit('error', error);
}

function unsubscribe(component) {
  forEach(this[FIELDS.subscriptions][component.getType()], (componentUnsubscribe) => componentUnsubscribe());
  delete this[FIELDS.subscriptions][component.getType()];
}

/**
 * @class
 * An entity is simply by an id used to reference zero to many components.
 * The types of components that an entity references must be unique.
 * @example
 * #Class members are accessed through accessors.
 * const entity = new Entity();
 * const entityId = entity.getId();
 * @access public
 * @mixes Subscribable
 * @mixes Disposable
 */
const Entity = createClass({

  /**
   * An entity:add event occurs when an entity adds a component.
   * @event entity:add
   * @param {Entity} entity - The entity that added the component.
   * @param {Component} component - The component that was added.
   *
   * @instance
   * @memberof Entity
   */

  /**
   * An entity:add:{type} event occurs when an entity adds a component.
   * @event entity:add:{type}
   * @param {Entity} entity - The entity that added the component.
   * @param {Component} component - The component that was added.
   *
   * @instance
   * @memberof Entity
   */

  /**
   * An entity:change event occurs when a component, that an entity owns, changes.
   * @event entity:change
   * @param {Entity} entity - The entity that owns the component.
   * @param {Component} component - The component that caused the change.
   * @param {*} newState - The new value of the component.
   * @param {*} oldState - The old value of the component.
   *
   * @instance
   * @memberof Entity
   */

  /**
   * A entity:change:{type} event occurs when a component, that an entity owns, changes.
   * @event entity:change:{type}
   * @param {Entity} entity - The entity that owns the component.
   * @param {Component} component - The component that was changed.
   * @param {*} newState - The new value of the component.
   * @param {*} oldState - The old value of the component.
   * @instance
   * @memberof Entity
   */

  /**
   * An entity:remove event occurs when an entity disposes a component.
   * @event entity:remove
   * @param {Entity} entity - The entity that disposing the component.
   * @param {Component} component - The component that is being disposed.
   *
   * @instance
   * @memberof Entity
   */

  /**
   * An entity:remove:{type} event occurs when an entity disposes a component.
   * @event entity:remove:{type}
   * @param {Entity} entity - The entity that is disposing the component.
   * @param {Component} component - The component that is being disposed.
   *
   * @instance
   * @memberof Entity
   */

  /**
   * An entity:dispose event occurs when an entity is being disposed.
   * @event entity:dispose
   * @param {Entity} entity - The entity that is being disposed.
   * @instance
   * @memberof Entity
   */

  mixins: [
    decorateObject(subscribableMixin(FIELDS.emitter), disposableDecorator),
    disposableMixin(values(FIELDS), onDispose),
  ],

  constructor() {
    /**
     * A literal that identifies the entity.
     * @member {number} id
     * @instance
     * @memberof Entity
     * @private
     */
    this[FIELDS.id] = ID.getNext();

    /**
     * The data contained in the component, it is immutable.
     * @member {*} state
     * @instance
     * @memberof Entity
     * @private
     */
    this[FIELDS.components] = {};

    /**
     * The entity subscriptions.
     * @member {Map<string, function[]>} subscriptions
     * @instance
     * @memberof Entity
     * @ignore
     * @private
     */
    this[FIELDS.subscriptions] = {};

    /**
     * The event emitter.
     * @member {EventEmitter} emitter
     * @instance
     * @memberof Entity
     * @private
     * @ignore
     */
    this[FIELDS.emitter] = new EventEmitter();
  },

  /**
   * Get the id.
   * @returns {integer} The entity id.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof Entity
   */
  getId() {
    assertDisposable(this);
    return this[FIELDS.id];
  },

  /**
   * Gets all components contained in the entity for specified component types. Returns only a single component if
   * only one type is specified, but returns a map of all components is returned if no types are specified.
   * @param {...string} types - the desired types of components
   * @returns {(Component|Map<string, Component>)} A single component or the map of components to component type
   * @example
   * # Returns all components when no arguments are passed
   * const entity = new Entity().addComponents(new Component('player'), new Component('health', { hp: 100 });
   * const components = entity.getComponents();
   * const playerComponent = components.player;
   * const healthComponent = components.health;
   * @example
   * # Returns a single component when only one component type is passed
   * const entity = new Entity().addComponents(new Component('player'), new Component('health', { hp: 100 });
   * const healthComponent = entity.getComponents('health');
   * @example
   * # Returns a map of components when more than one component type is passed
   * const entity = new Entity().addComponents(new Component('player'), new Component('health', { hp: 100 });
   * const components = entity.getComponents('health', 'player');
   * const playerComponent = components.player;
   * const healthComponent = components.health;
   * @throws {TypeError} when an argument other than a string is passed.
   * @throws {ReferenceError} when invoked after the entity has been disposed.
   * @emits module:transvolve#error
   * @memberof Entity
   * @instance
   */
  getComponents(...types) {
    assertDisposable(this);
    const components = this[FIELDS.components];
    const emitter = this[FIELDS.emitter];

    function getComponent(type) {
      assertString(type);

      if (components[type]) {
        return components[type];
      }

      emitter.emit('error', new ComponentNotFoundError());
      return undefined;
    }

    if (types.length === 0) {
      return assign({}, components);
    } else if (types.length === 1) {
      return getComponent(types[0]);
    }

    const map = {};

    forEach(types, (type) => {
      const component = getComponent(type);

      if (!isNil(component)) {
        map[type] = component;
      }
    });

    return map;
  },

  /**
   * Adds all the specified components to the entity.
   * @param {...Component} components - the components to add
   * @returns {Entity} Itself
   * @throws {TypeError} Will throw this error when an argument other than a Component is passed.
   * @throws {ReferenceError} Will throw this error When invoked after the entity has been disposed.
   * @emits Entity#entity:add
   * @emits Entity#entity:add:{type}
   * @emits module:transvolve#error
   * @memberof Entity
   * @instance
   */
  addComponents(...components) {
    assertDisposable(this);
    forEach(components, (component) => {
      assertComponent(component);
      const type = component.getType();

      if (this[FIELDS.components][type]) {
        const error = (component === this[FIELDS.components][type]) ?
          new ComponentAlreadyOwnedError() :
          new DuplicateComponentTypeError();
        this[FIELDS.emitter].emit('error', error, this);
      } else {
        this[FIELDS.components][type] = component;
        this[FIELDS.subscriptions][type] = [];
        this[FIELDS.subscriptions][type].push(component.subscribe('component:change', onComponentChange.bind(this)));
        this[FIELDS.subscriptions][type].push(component.subscribe('component:dispose', onComponentDispose.bind(this)));
        this[FIELDS.subscriptions][type].push(component.subscribe('error', onComponentError.bind(this)));
        this[FIELDS.emitter].emit('entity:add', this, component);
        this[FIELDS.emitter].emit(`entity:add:${type}`, this, component);
      }
    });

    return this;
  },

  /**
   * Removes all the specified components or types of components from the entity.
   * Each component that is removed is disposed.
   * @param {...(Component|string)} componentsOrTypes - the components and/or component types to remove
   * @returns {Entity} Itself
   * @throws {TypeError} Will throw this error when an argument other than a Component is passed.
   * @throws {ReferenceError} Will throw this error when invoked after the entity has been disposed.
   * @emits Entity#entity:remove
   * @emits Entity#entity:remove:{type}
   * @emits module:transvolve#error
   * @memberof Entity
   * @instance
   */
  removeComponents(...componentsOrTypes) {
    assertDisposable(this);
    forEach(componentsOrTypes, (componentOrType) => {
      let component = componentOrType;

      if (isString(componentOrType)) {
        component = this[FIELDS.components][component];
        if (isNil(component)) {
          this[FIELDS.emitter].emit('error', new ComponentNotFoundError());
          return;
        }
      } else {
        assertComponent(component);
        if (component !== this[FIELDS.components][component.getType()]) {
          this[FIELDS.emitter].emit('error', new ComponentNotFoundError());
          return;
        }
      }

      delete this[FIELDS.components][component.getType()];
      unsubscribe.call(this, component);
      this[FIELDS.emitter].emit('entity:remove', this, component);
      this[FIELDS.emitter].emit(`entity:remove:${component.getType()}`, this, component);
      component.dispose();
    });

    return this;
  },

  /**
   * Determines if the entity has components of all the specified types.
   * @param {...string} types - The component types
   * @returns {boolean} The result
   * @throws {TypeError} Will throw this error when an argument other than a string is passed.
   * @throws {ReferenceError} Will throw this error when invoked after the entity has been disposed.
   * @memberof Entity
   * @instance
   */
  hasComponents(...types) {
    assertDisposable(this);
    const self = this;
    let hasComponents = true;

    forEach(types, (type) => {
      assertString(type);
      hasComponents = !isNil(self[FIELDS.components][type]);
      return hasComponents;
    });

    return hasComponents;
  },

});

export default Entity;
