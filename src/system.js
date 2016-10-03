import EntityManager from './entity-manager';
import Promise from 'bluebird';
import Symbol from 'es6-symbol';
import EventEmitter from 'eventemitter3';
import values from 'lodash/values';
import forEach from 'lodash/forEach';
import set from 'lodash/set';
import {
  requires,
  assertDisposable,
  assertEntityManager,
  assertString,
  assertNumber,
  assertFunction,
} from './asserts';
import createClass from './util/create-class';
import decorateObject from './util/decorate-object';
import subscribableMixin from './mixins/subscribable';
import disposableMixin from './mixins/disposable';
import disposableDecorator from './mixins/decorator/disposable-decorator';

const FIELDS = {
  name: Symbol('name'),
  requirements: Symbol('requirements'),
  state: Symbol('state'),
  interval: Symbol('interval'),
  executedOn: Symbol('executedOn'),
  latency: Symbol('latency'),
  manager: Symbol('manager'),
  executor: Symbol('executor'),
  emitter: Symbol('emitter'),
};

function onError(error) {
  this[FIELDS.emitter].emit('error', error);
}

function onDispose() {
  this[FIELDS.emitter].emit('system:dispose');
  this[FIELDS.emitter].removeAllListeners();
}

function onSourceAdd(entity) {
  this.watchEntity(entity);
}

function onSourceAddRequirement(entity) {
  this.watchEntity(entity);
}

function onScopeChangeRequirement(entity, component, current, previous) {
  // TODO: Add capabilities to index entities.
  this[FIELDS.emitter].emit('entity:change', entity, component, current, previous);
}

function onScopeRemoveRequirement(entity) {
  this.unwatchEntity(entity);
}

/**
 * @class
 * A system defines an operation that should be performed each tick of the engine. A system will
 * only affect entities that own the required system components. A system will watch and unwatch
 * an entity as the required components are added and removed from it. A system is created based
 * on a configuration that is passed to the constructor.
 * @example
 * #Creating a new system.
 * const system = new System({
 *     name: 'spawn',
 *     requirements: ['player', 'spawn'],
 *     interval: 16,
 *     executor: ({ entity }) => {
 *         entity.addComponents(new Component('position', { x: 0, y: 0, z:0 }));
 *         entity.removeComponents('spawn');
 *         const name = entity.getComponents('player').getState('name');
 *         console.log(`${name} has come into the world.`);
 *      },
 * });
 * @param {Object} config - The system configuration.
 * @param {!string} config.name - The system name.
 * @param {string[]} [config.requirements] - The component types that are required by the system.
 * @param {number} [config.interval=16] - The number of milliseconds between executions.
 * @param {!function} config.executor - The function to execute.
 * @access public
 * @mixes Subscribable
 * @mixes Disposable
 */
const System = createClass({

  /**
   * A system:watch event occurs when the systems watches an entity.
   * @event system:watch
   * @param {Entity} entity - The entity that has been watched.
   * @instance
   * @memberof System
   */

  /**
   * A system:unwatch event occurs when the systems unwatches an entity.
   * @event system:unwatch
   * @param {Entity} entity - The entity that has been unwatched.
   * @instance
   * @memberof System
   */

  mixins: [
    decorateObject(subscribableMixin(FIELDS.emitter), disposableDecorator),
    disposableMixin(values(FIELDS), onDispose),
  ],

  constructor({ name, requirements = [], manager = new EntityManager(), interval = 16, executor }) {
    requires('name', name);
    requires('executor', executor);
    assertString(name);
    forEach(requirements, assertString);
    assertFunction(executor);
    assertEntityManager(manager);
    assertNumber(interval);

    /**
     * A literal that identifies the system.
     * @member {string} name
     * @instance
     * @memberof System
     * @private
     */
    this[FIELDS.name] = name;

    /**
     * The component types that an entity must have to be watched by the system.
     * @member {string[]} requirements
     * @instance
     * @memberof System
     * @private
     */
    this[FIELDS.requirements] = requirements;

    /**
     * The state of the system.
     * @member {string} state
     * @instance
     * @memberof System
     * @private
     */
    this[FIELDS.state] = 'PENDING';

    /**
     * The number milliseconds between executions.
     * @member {number} interval
     * @instance
     * @memberof System
     * @private
     */
    this[FIELDS.interval] = interval;

    /**
     * The number of milliseconds that the system has fallen behind.
     * @member {number} latency
     * @instance
     * @memberof System
     * @private
     */
    this[FIELDS.latency] = null;

    /**
     * The last time the system executed.
     * @member {number} executedOn
     * @instance
     * @memberof System
     * @private
     */
    this[FIELDS.executedOn] = null;

    /**
     * The entity manager for the scope of entities the system is watching.
     * @member {EntityManager} manager
     * @instance
     * @memberof System
     * @private
     */
    this[FIELDS.manager] = manager;

    /**
     * The function that is executed each update.
     * @member {function} executor
     * @instance
     * @memberof System
     * @private
     */
    this[FIELDS.executor] = executor;

    /**
     * The event emitter.
     * @member {EventEmitter} emitter
     * @instance
     * @memberof System
     * @private
     * @ignore
     */
    this[FIELDS.emitter] = new EventEmitter();

    manager.subscribe('error', onError.bind(this));
  },

  /**
   * Get the system name.
   * @returns {string} The system name.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof System
   */
  getName() {
    assertDisposable(this);
    return this[FIELDS.name];
  },

  /**
   * Get the system requirements.
   * @returns {string[]} The system requirements.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof System
   */
  getRequirements() {
    assertDisposable(this);
    return this[FIELDS.requirements];
  },

  /**
   * Get the system state.
   * @returns {string} The system state.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof System
   */
  getState() {
    assertDisposable(this);
    return this[FIELDS.state];
  },

  /**
   * Get the execution interval.
   * @returns {number} The execution interval.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof System
   */
  getInterval() {
    assertDisposable(this);
    return this[FIELDS.interval];
  },

  /**
   * Get the time last executed.
   * @returns {number} The last execution time.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof System
   */
  getExecutedOn() {
    assertDisposable(this);
    return this[FIELDS.executedOn];
  },

  /**
   * Get the entities in scope of the system.
   * @returns {Entity[]} The entity scope of the system.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof System
   */
  getScope() {
    assertDisposable(this);
    return this[FIELDS.manager].getEntities();
  },

  /**
   * Will add the entity to the scope of entities that are updated by the system, if the entity meets
   * the system requirements.
   * @param {Entity} entity - The entity to watch.
   * @returns {System} Itself
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @emits System#system:watch
   * @instance
   * @memberof System
   */
  watchEntity(entity) {
    const requirements = this[FIELDS.requirements];
    const manager = this[FIELDS.manager];
    const emitter = this[FIELDS.emitter];

    if (entity.hasComponents(...requirements)) {
      manager.addEntities(entity);
      emitter.emit('system:watch', entity);
    }

    return this;
  },

  /**
   * Will remove the entity from the scope of entities that are updated by the system, if
   * the entity no longer meets the system requirements.
   * @param {Entity} entity - The entity to watch.
   * @returns {System} Itself
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @emits System#system:watch
   * @instance
   * @memberof System
   */
  unwatchEntity(entity) {
    const requirements = this[FIELDS.requirements];
    const manager = this[FIELDS.manager];
    const emitter = this[FIELDS.emitter];

    if (!entity.hasComponents(...requirements)) {
      manager.removeEntities(entity);
      emitter.emit('system:unwatch', entity);
    }

    return this;
  },

  /**
   * Initialize the system by providing it with a source entity manager. The system sets up the
   * appropriate listeners that is will need to identify the entities that are within scope of
   * the system requirements and then identify the initial scope from the already existing entities.
   * @param {EntityManager} source - The source entity manager for the system.
   * @returns {Promise} The system initialization.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @throws {TypeError} Will throw this error is the source is not an EntityManager.
   * @instance
   * @memberof System
   */
  init(source) {
    assertDisposable(this);
    const self = this;
    const requirements = this[FIELDS.requirements];
    const manager = this[FIELDS.manager];

    return new Promise((resolve) => {
      assertEntityManager(source);
      source.subscribe('manager:add', onSourceAdd.bind(this));
      forEach(requirements, (requirement) => {
        source.subscribe(`entity:add:${requirement}`, onSourceAddRequirement.bind(self));
        manager.subscribe(`entity:change:${requirement}`, onScopeChangeRequirement.bind(self));
        manager.subscribe(`entity:remove:${requirement}`, onScopeRemoveRequirement.bind(self));
      });

      if (source.length() > 0) {
        source.forEach((entity) => this.watchEntity(entity));
      }

      self[FIELDS.executedOn] = Date.now();

      resolve();
    });
  },

  /**
   * Executes the system executor for each entity within scope. The system will pass a context object to
   * the executor that exposes resources to be used within the executor.
   * @param {Object} context - A context from a parent scopes.
   * @returns {Promise} The system execution.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof System
   */
  execute(context = {}) {
    assertDisposable(this);
    const currentTime = Date.now();
    const executedOn = this[FIELDS.executedOn];
    const delta = currentTime - executedOn;
    const interval = this[FIELDS.interval];
    const manager = this[FIELDS.manager];
    const latency = delta - interval;

    const executor = this[FIELDS.executor];
    const executions = [];

    if (delta < interval) {
      return Promise.resolve();
    }

    set(context, 'system.entityService.get', this[FIELDS.manager].getEntities);
    set(context, 'system.entityService.find', this[FIELDS.manager].findEntities);
    set(context, 'system.entityService.forEach', this[FIELDS.manager].forEach);
    set(context, 'system.entityService.length', this[FIELDS.manager].length);
    set(context, 'time.delta', delta);
    set(context, 'time.latency', latency);

    manager.forEach((entity) => {
      set(context, 'entity', entity);
      executions.push(executor(context));
    });

    return Promise
      .all(executions)
      .then(() => {
        this[FIELDS.latency] = latency;
        this[FIELDS.executedOn] = Date.now();
        // TODO: Emit a report for profiling.
      });
  },

});

export default System;
