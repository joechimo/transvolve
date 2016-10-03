import EntityManager from './entity-manager';
import Promise from 'bluebird';
import Symbol from 'es6-symbol';
import EventEmitter from 'eventemitter3';
import values from 'lodash/values';
import forEach from 'lodash/forEach';
import set from 'lodash/set';
import {
  assertDisposable,
  assertEntityManager,
  assertSystem,
  assertNumber,
} from './asserts';
import createClass from './util/create-class';
import decorateObject from './util/decorate-object';
import subscribableMixin from './mixins/subscribable';
import disposableMixin from './mixins/disposable';
import disposableDecorator from './mixins/decorator/disposable-decorator';
import Entity from './entity';

const FIELDS = {
  manager: Symbol('manager'),
  systems: Symbol('systems'),
  process: Symbol('process'),
  interval: Symbol('interval'),
  executedOn: Symbol('executedOn'),
  state: Symbol('state'),
  emitter: Symbol('emitter'),
};

const STATE = {
  PENDING: 0,
  INITIALIZED: 1,
  IDLE: 2,
  RUNNING: 3,
  STOPPING: 4,
  STOPPED: 6,
  ERROR: 7,
};

function createEntity() {
  const entity = new Entity();
  this[FIELDS.manager].addEntities(entity);
  return entity;
}

function onError(error) {
  this[FIELDS.emitter].emit('error', error);
}

function onDispose() {
  this.stop();
  this[FIELDS.emitter].emit('dispose');
  this[FIELDS.emitter].removeAllListeners();
}

/**
 * @class
 * The engine manages all entities and the main system loop. Adding new entities to
 * the engine will automatically set them up to be watched by the registered systems.
 * @example
 * #Creating a new engine.
 * const engine = new Engine({
 *     interval: 16,
 * });
 * @param {number} [config.interval=16] - The number of milliseconds between executions.
 * @access public
 * @mixes Subscribable
 * @mixes Disposable
 */
const Engine = createClass({

  mixins: [
    decorateObject(subscribableMixin(FIELDS.emitter), disposableDecorator),
    disposableMixin(values(FIELDS), onDispose),
  ],

  constructor({ manager = new EntityManager(), interval = 16 }) {
    assertEntityManager(manager);
    assertNumber(interval);

    this[FIELDS.interval] = interval;
    this[FIELDS.manager] = manager;
    this[FIELDS.systems] = [];
    this[FIELDS.state] = STATE.PENDING;
    this[FIELDS.emitter] = new EventEmitter();

    manager.subscribe('error', onError.bind(this));
  },

  /**
   * Get the engine state.
   * @returns {string} The engine state.
   * @throws {ReferenceError} Will throw this error if invoked after being disposed.
   * @instance
   * @memberof Engine
   */
  getState() {
    assertDisposable(this);
    return this[FIELDS.state];
  },

  /**
   * Adds all specified entities to the engine.
   * @param {...entities} entities - The entities.
   * @returns {Engine} Itself
   * @throws {ReferenceError} Will throw this error if invoked after the engine has been disposed.
   * @memberof Engine
   * @instance
   */
  addEntities(...entities) {
    assertDisposable(this);
    const self = this;

    function addEntity(entity) {
      self[FIELDS.manager].addEntities(entity);
      entity.subscribe('error', onError.bind(self));
    }

    forEach(entities, addEntity);
    return this;
  },

  /**
   * Removes all specified entities from the engine.
   * @param {...(Entity|number)} entitiesOrIds - The entities or entity ids.
   * @returns {Engine} Itself
   * @throws {ReferenceError} Will throw this error if invoked after the engine has been disposed.
   * @memberof Engine
   * @instance
   */
  removeEntities(...entitiesOrIds) {
    assertDisposable(this);
    this[FIELDS.manager].removeEntities(...entitiesOrIds);
    return this;
  },

  /**
   * Adds all specified systems to the engine.
   * @param {...System} systems - The systems.
   * @returns {Engine} Itself
   * @throws {TypeError}
   * @throws {ReferenceError} Will throw this error if invoked after the engine has been disposed.
   * @memberof Engine
   * @instance
   */
  addSystems(...systems) {
    assertDisposable(this);
    const self = this;

    forEach(systems, (system) => {
      assertSystem(system);
      system.subscribe('error', onError.bind(self));
      self[FIELDS.systems].push(system);
    });

    return this;
  },

  /**
   * Initializes the engine and all registered systems.
   * @returns {Promise} The engine initialization.
   * @throws {ReferenceError} Will throw this error if invoked after the engine has been disposed.
   * @throws {Error} Will throw this error when the engine is not capable of being initialized.
   * @emits Engine#initialize
   * @memberof Engine
   * @instance
   */
  init() {
    assertDisposable(this);
    const state = this[FIELDS.state];
    const manager = this[FIELDS.manager];
    const systems = this[FIELDS.systems];

    if (state === STATE.PENDING) {
      const initializers = [];

      forEach(systems, (system) => {
        initializers.push(system.init(manager));
      });

      return Promise.all(initializers)
        .then(() => {
          this[FIELDS.state] = STATE.INITIALIZED;
          this[FIELDS.emitter].emit('initialize');
        });
    }

    return Promise.reject(new Error('ECS can no longer be initialized.'));
  },

  /**
   * Starts the engine loop.
   * @returns {Promise} The engine start.
   * @throws {ReferenceError} Will throw this error if invoked after the engine has been disposed.
   * @throws {Error} Will throw this error when the engine is not capable of being started.
   * @emits Engine#start
   * @emits Engine#idle
   * @emits Engine#stop
   * @emits Engine#tick
   * @memberof Engine
   * @instance
   */
  start() {
    assertDisposable(this);
    const state = this[FIELDS.state];
    const systems = this[FIELDS.systems];
    const emitter = this[FIELDS.emitter];

    if (state === STATE.INITIALIZED || state === STATE.STOPPED) {
      const interval = this[FIELDS.interval];
      const context = {};
      set(context, 'entityService.get', this[FIELDS.manager].getEntities);
      set(context, 'entityService.find', this[FIELDS.manager].findEntities);
      set(context, 'entityService.remove', this[FIELDS.manager].removeEntities);
      set(context, 'entityService.length', this[FIELDS.manager].length);
      set(context, 'entityFactory.create', createEntity.bind(this));
      set(context, 'componentFactory.create', createEntity.bind(this));

      this[FIELDS.process] = setInterval(() => {
        Promise.resolve(this[FIELDS.state] = STATE.RUNNING)
          .then(() => Promise.each(systems, (system) => system.execute(context)))
          .then(() => {
            emitter.emit('tick');
            if (this[FIELDS.state] === STATE.RUNNING) {
              this[FIELDS.state] = STATE.IDLE;
              this[FIELDS.emitter].emit('idle');
            } else if (this[FIELDS.state] === STATE.STOPPING) {
              this[FIELDS.state] = STATE.STOPPED;
              this[FIELDS.emitter].emit('stop');
            }
          });
      }, interval);

      this[FIELDS.state] = STATE.RUNNING;
      this[FIELDS.emitter].emit('start');

      return Promise.resolve();
    }

    return Promise.reject(new Error('ECS cannot be started.'));
  },

  /**
   * Stops the engine loop.
   * @returns {Promise} The engine stop.
   * @throws {ReferenceError} Will throw this error if invoked after the engine has been disposed.
   * @throws {Error} Will throw this error when the engine is not capable of being stopped.
   * @emits Engine#stop
   * @memberof Engine
   * @instance
   */
  stop() {
    assertDisposable(this);
    return new Promise((resolve, reject) => {
      if (this[FIELDS.state] === STATE.RUNNING) {
        this[FIELDS.state] = STATE.STOPPING;
        clearInterval(this[FIELDS.process]);
        resolve();
      } else if (this[FIELDS.state] === STATE.IDLE) {
        clearInterval(this[FIELDS.process]);
        this[FIELDS.state] = STATE.STOPPED;
        this[FIELDS.emitter].emit('stop');
        resolve();
      }

      reject(new Error('ECS cannot be stopped.'));
    });
  },

});

export default Engine;
