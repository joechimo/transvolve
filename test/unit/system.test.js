/* eslint-disable no-unused-expressions */
import chaiAsPromised from 'chai-as-promised';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import forEach from 'lodash/forEach';
import System from '../../src/system';
import EntityManager from '../../src/entity-manager';
import Entity from '../../src/entity';
import Component from '../../src/component';

chai.use(chaiAsPromised);
chai.should();

describe('System', () => {
  let system;
  let source;
  let configuration = {
    name: 'regeneration',
    requirements: ['health'],
    interval: 32,
    executor: ({ entity }) => {
      const component = entity.getComponents('health');
      const data = component.getState();
      data.hp++;
      component.setState(data);
    },
  };

  describe('.constructor', () => {
    it('should throw an error when provided invalid arguments', () => {
      expect(() => new System()).to.throw(Error);
      expect(() => new System({ name: 'health' })).to.throw(Error);
      expect(() => new System({ executor: () => {} })).to.throw(Error);
      expect(() => new System({ name: 'health', executor: () => {} })).to.not.throw(Error);
    });

    it('should create an instance when provided valid arguments', () => {
      expect(() => new System(configuration)).to.not.throw(Error);
    });

    it('should populate the initial state', () => {
      system = new System(configuration);
      expect(system.getName()).to.equal('regeneration');
      expect(system.getRequirements().length).to.equal(1);
      expect(system.getRequirements()[0]).to.equal('health');
      expect(system.getInterval()).to.equal(32);
      expect(system.getExecutedOn()).to.be.null;
      expect(system.getScope().length).to.equal(0);
    });
  });

  describe('.init', () => {
    beforeEach(() => {
      system = new System(configuration);
      source = new EntityManager();

      for (let i = 0; i < 5; i++) {
        const entity = new Entity();
        const component = new Component('health', { hp: 100 });
        source.addEntities(entity);
        entity.addComponents(component);
      }
    });

    it('should throw an error if no source is provided.', () =>
      system.init().should.be.rejectedWith(Error)
    );

    it('should determine the initial scope.', () => {
      system.init(source)
        .then(expect(system.getScope().length).to.equal(5));
    });

    it('should watch an entity that meets the requirements.', () =>
      system.init(source)
        .then(() => {
          const entity = new Entity();
          expect(system.getScope().length).to.equal(5);
          source.addEntities(entity);
          expect(system.getScope().length).to.equal(5);
          entity.addComponents(new Component('health', { hp: 100 }));
          expect(system.getScope().length).to.equal(6);
        })
    );

    it('should unwatch an entity that no longer meets the requirements.', () =>
      system.init(source)
        .then(() => {
          const entity = new Entity();
          const component = new Component('health', { hp: 100 });
          source.addEntities(entity);
          entity.addComponents(component);
          expect(system.getScope().length).to.equal(6);
          entity.removeComponents(component);
          expect(entity.hasComponents('health')).to.be.false;
          expect(system.getScope().length).to.equal(5);
        })
    );
  });

  describe('.execute', () => {
    beforeEach(() => {
      configuration.interval = 16;
      configuration.executor = ({ entity }) => {
        const component = entity.getComponents('health');
        const data = component.getState();
        data.hp++;
        component.setState(data);
      };
      system = new System(configuration);
      source = new EntityManager();

      for (let i = 0; i < 5; i++) {
        const entity = new Entity();
        const component = new Component('health', { hp: 100 });
        source.addEntities(entity);
        entity.addComponents(component);
      }
    });

    it('should only invoke the executors if the elapsed time >= to the interval.', () =>
      system.init(source)
        .then(() => {
          const entities = system.getScope();
          forEach(entities, (entity) => {
            expect(entity.getComponents('health').getState('hp')).to.equal(100);
          });
        })
        .then(() => system.execute())
        .then(() => {
          const entities = system.getScope();
          forEach(entities, (entity) => {
            expect(entity.getComponents('health').getState('hp')).to.equal(100);
          });
        })
        .delay(30)
        .then(() => system.execute())
        .then(() => {
          const entities = system.getScope();
          forEach(entities, (entity) => {
            expect(entity.getComponents('health').getState('hp')).to.equal(101);
          });
        })
    );

    it('should invoke the executor for each entity in scope.', () =>
      system.init(source)
        .delay(30)
        .then(() => system.execute())
        .then(() => {
          const entities = system.getScope();
          forEach(entities, (entity) => {
            expect(entity.getComponents('health').getState('hp')).to.equal(101);
          });
        })
    );

    it('should be possible to modify entities and components from the executor.', () => {
      configuration = {
        name: 'spawn',
        requirements: ['death'],
        interval: 16,
        executor: ({ entity }) => {
          entity.removeComponents('death');
        },
      };

      system = new System(configuration);

      const entity = new Entity();
      source.addEntities(entity);
      entity.addComponents(new Component('death'));

      const onWatch = sinon.spy();
      const onUnwatch = sinon.spy();

      system.subscribe('system:watch', onWatch);
      system.subscribe('system:unwatch', onUnwatch);

      return system.init(source)
        .then(expect(system.getScope().length).to.equal(1))
        .delay(30)
        .then(() => system.execute())
        .then(() => {
          expect(system.getScope().length).to.equal(0);
          expect(onWatch.called).to.be.true;
          expect(onWatch.callCount).to.equal(1);
          expect(onUnwatch.called).to.be.true;
          expect(onUnwatch.callCount).to.equal(1);
        });
    });
  });

  describe('.subscribe', () => {

  });

  describe('.dispose', () => {

  });
});
