import Symbol from 'es6-symbol';
import EventEmitter from 'eventemitter3';
import values from 'lodash/values';
import forEach from 'lodash/forEach';
import isNil from 'lodash/isNil';
import isNumber from 'lodash/isNumber';
import {
  assertDisposable,
  assertEntity,
  assertNumber,
  assertFunction,
} from './asserts';
import {
  EntityNotFoundError,
  EntityAlreadyExistsError,
} from './errors';
import createClass from './util/create-class';
import decorateObject from './util/decorate-object';
import subscribableMixin from './mixins/subscribable';
import disposableMixin from './mixins/disposable';
import disposableDecorator from './mixins/decorator/disposable-decorator';

const FIELDS = {
  nodes: Symbol('nodes'),
  head: Symbol('head'),
  tail: Symbol('tail'),
  length: Symbol('length'),
  state: Symbol('state'),
  emitter: Symbol('emitter'),
};

function onDispose() {
  this[FIELDS.emitter].emit('dispose');
  this[FIELDS.emitter].removeAllListeners();

  this.clear();
}

function onEntityDispose(entity) {
  this.removeEntities(entity);
}

function onEntityAdd(entity, component) {
  this[FIELDS.emitter].emit('entity:add', entity, component);
  this[FIELDS.emitter].emit(`entity:add:${component.getType()}`, entity, component);
}

function onEntityChange(entity, component, current, previous) {
  this[FIELDS.emitter].emit('entity:change', entity, component, current, previous);
  this[FIELDS.emitter].emit(`entity:change:${component.getType()}`, entity, component, current, previous);
}

function onEntityRemove(entity, component) {
  this[FIELDS.emitter].emit('entity:remove', entity, component);
  this[FIELDS.emitter].emit(`entity:remove:${component.getType()}`, entity, component);
}

/**
 * @class
 * An entity manager organizes and manages a doubly linked list of entities and provides a hub for
 * notifications of changes for the entities.
 * @example
 * #Creating a new EntityManager.
 * const manager = new EntityManager();
 * const entity = new Entity();
 * manager.addEntities(entity);
 * @access public
 * @mixes Subscribable
 * @mixes Disposable
 */
const EntityManager = createClass({

  /**
   * A single entity reference within an entity manager.
   * @typedef {Object} EntityNode
   * @property {Entity} entity - The entity.
   * @property {EntityNode} previous - The previous node.
   * @property {EntityNode} next - The next node.
   * @instance
   * @memberof EntityManager
   */

  mixins: [
    decorateObject(subscribableMixin(FIELDS.emitter), disposableDecorator),
    disposableMixin(values(FIELDS), onDispose),
  ],

  constructor() {
    /**
     * The map of entity nodes in the entity manager.
     * @member {Map<number, EntityNode>} nodes
     * @instance
     * @memberof EntityManager
     * @private
     * @ignore
     */
    this[FIELDS.nodes] = {};
    this[FIELDS.head] = null;
    this[FIELDS.tail] = null;
    this[FIELDS.length] = 0;
    this[FIELDS.state] = 'IDLE';
    this[FIELDS.emitter] = new EventEmitter();
  },

  /**
   * Gets the length of the entity list.
   * @returns {number} The length of the entity list.
   * @throws {ReferenceError} Will throw this error if invoked after the entity manager has been disposed.
   * @instance
   * @memberof EntityManager
   */
  length() {
    assertDisposable(this);
    return this[FIELDS.length];
  },

  /**
   * Gets all entities in the entity manager for specified ids. Returns only a single entity if
   * only one id is specified, but returns all entities if no ids are specified.
   * @param {...number} ids - The entity ids.
   * @returns {(Entity|Entity[])} A single entity or and array of entities.
   * @throws {TypeError} Will throw this error if an argument other than a number is passed.
   * @throws {ReferenceError} Will throw this error if invoked after the entity manager has been disposed.
   * @emits module:transvolve#error
   * @memberof EntityManager
   * @instance
   */
  getEntities(...ids) {
    assertDisposable(this);
    forEach(ids, assertNumber);
    const nodes = this[FIELDS.nodes];
    const emitter = this[FIELDS.emitter];

    function getEntity(id) {
      if (nodes[id]) {
        return nodes[id].entity;
      }

      emitter.emit('error', new EntityNotFoundError());
      return null;
    }

    if (ids.length === 0) {
      return this.toArray();
    } else if (ids.length === 1) {
      return getEntity(ids[0]);
    }

    const entities = [];

    forEach(ids, (id) => {
      const entity = getEntity(id);

      if (!isNil(entity)) {
        entities.push(entity);
      }
    });

    return entities;
  },


  /**
   * Finds all entities in the entity manager that return truthy for the predicate.
   * @param {function} predicate - The predicate function.
   * @returns {Entity[]} The entities that return truthy.
   * @throws {TypeError} Will throw this error if the predicate is not a function.
   * @throws {ReferenceError} Will throw this error if invoked after the entity manager has been disposed.
   * @memberof EntityManager
   * @instance
   */
  findEntities(predicate) {
    assertDisposable(this);
    assertFunction(predicate);
    const entities = [];
    let node = this[FIELDS.head];

    while (!isNil(node)) {
      if (predicate(node.entity)) {
        entities.push(node.entity);
      }
      node = node.next;
    }

    return entities;
  },

  /**
   * Adds all specified entities to the entity manager.
   * @param {...Entity} entities - The entities.
   * @returns {EntityManager} Itself
   * @throws {TypeError} Will throw this error if any argument is not an Entity.
   * @throws {ReferenceError} Will throw this error if invoked after the entity manager has been disposed.
   * @emits EntityManager#manager:add
   * @emits module:transvolve#error
   * @memberof EntityManager
   * @instance
   */
  addEntities(...entities) {
    assertDisposable(this);
    forEach(entities, assertEntity);

    const nodes = this[FIELDS.nodes];
    const emitter = this[FIELDS.emitter];

    forEach(entities, (entity) => {
      if (nodes[entity.getId()]) {
        emitter.emit('error', new EntityAlreadyExistsError());
      } else {
        const node = {
          entity,
          previous: null,
          next: null,
          subscriptions: [],
        };

        if (isNil(this[FIELDS.head])) {
          this[FIELDS.head] = node;
          this[FIELDS.tail] = node;
        } else {
          this[FIELDS.tail].next = node;
          node.previous = this[FIELDS.tail];
          this[FIELDS.tail] = node;
        }

        this[FIELDS.nodes][entity.getId()] = node;
        this[FIELDS.length]++;

        node.subscriptions.push(entity.subscribe('entity:dispose', onEntityDispose.bind(this)));
        node.subscriptions.push(entity.subscribe('entity:change', onEntityChange.bind(this)));
        node.subscriptions.push(entity.subscribe('entity:add', onEntityAdd.bind(this)));
        node.subscriptions.push(entity.subscribe('entity:remove', onEntityRemove.bind(this)));

        this[FIELDS.emitter].emit('manager:add', entity);
      }
    });

    return this;
  },

  /**
   * Removes all specified entities from the entity manager.
   * @param {...(Entity|number)} entitiesOrIds - The entities or entity ids.
   * @returns {EntityManager} Itself
   * @throws {TypeError} Will throw this error if any argument is not an Entity or a number.
   * @throws {ReferenceError} Will throw this error if invoked after the entity manager has been disposed.
   * @emits EntityManager#manager:remove
   * @emits module:transvolve#error
   * @memberof EntityManager
   * @instance
   */
  removeEntities(...entitiesOrIds) {
    assertDisposable(this);

    const nodes = this[FIELDS.nodes];
    const emitter = this[FIELDS.emitter];

    forEach(entitiesOrIds, (entityOrId) => {
      let node;
      let entity;

      if (isNumber(entityOrId)) {
        node = nodes[entityOrId];
        entity = node.entity;
      } else {
        assertEntity(entityOrId);
        entity = entityOrId;
        node = nodes[entity.getId()];
      }

      if (isNil(node) || (entity !== node.entity)) {
        emitter.emit('error', new EntityNotFoundError());
      } else {
        if (this[FIELDS.head] === node) {
          this[FIELDS.head] = node.next;
        }

        if (this[FIELDS.tail] === node) {
          this[FIELDS.tail] = node.previous;
        }

        if (node.previous) {
          node.previous.next = node.next;
        }

        if (node.next) {
          node.next.previous = node.previous;
        }

        forEach(node.subscriptions, (unsubscribe) => {
          unsubscribe();
        });

        delete this[FIELDS.nodes][node.entity.getId()];
        this[FIELDS.length]--;
        this[FIELDS.emitter].emit('manager:remove', node.entity);
      }
    });

    return this;
  },

  /**
   * Returns truthy is the entity manager contains a specified entity.
   * @param {Entity} entity - The entity.
   * @returns {boolean} If the entity manager contains the entity.
   * @throws {TypeError} Will throw this error if entity is not an Entity.
   * @throws {ReferenceError} Will throw this error if invoked after the entity manager has been disposed.
   * @memberof EntityManager
   * @instance
   */
  contains(entity) {
    assertDisposable(this);
    assertEntity(entity);

    const nodes = this[FIELDS.nodes];
    return !isNil(nodes[entity.getId()]) && (entity === nodes[entity.getId()].entity);
  },

  /**
   * Iterates over elements of collection and invokes iteratee for each element.
   * @param {function} iteratee - The iteratee function.
   * @throws {TypeError} Will throw this error if the iteratee is not a function.
   * @throws {ReferenceError} Will throw this error if invoked after the entity manager has been disposed.
   * @memberof EntityManager
   * @instance
   */
  forEach(iteratee) {
    assertDisposable(this);
    assertFunction(iteratee);

    let node = this[FIELDS.head];

    while (!isNil(node)) {
      iteratee(node.entity);
      node = node.next;
    }
  },

  /**
   * Removes all entities from the manager.
   * @returns {EntityManager} Itself
   * @throws {ReferenceError} Will throw this error if invoked after the entity manager has been disposed.
   * @memberof EntityManager
   * @instance
   */
  clear() {
    assertDisposable(this);
    while (!isNil(this[FIELDS.head])) {
      this.removeEntities(this[FIELDS.head].entity);
    }

    return this;
  },

  /**
   * Turns the doubly linked list to an array.
   * @returns {Entity[]} The array of entities.
   * @throws {ReferenceError} Will throw this error if invoked after the entity manager has been disposed.
   * @memberof EntityManager
   * @instance
   */
  toArray() {
    assertDisposable(this);
    const entities = [];
    let node = this[FIELDS.head];

    while (!isNil(node)) {
      entities.push(node.entity);
      node = node.next;
    }

    return entities;
  },
});

export default EntityManager;
