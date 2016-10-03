/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import sinon from 'sinon';
import isNil from 'lodash/isNil';
import EntityManager from '../../src/entity-manager';
import Entity from '../../src/entity';
import Component from '../../src/component';

describe('EntityManager', () => {
  let manager;
  let player;
  let goblin;
  let ogre;
  let guard;

  describe('.constructor', () => {
    it('should create an instance', () => {
      expect(() => new EntityManager()).to.not.throw(Error);
    });

    it('should populate the initial state', () => {
      expect(new EntityManager().length()).to.equal(0);
    });
  });

  describe('.length', () => {
    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();
    });

    it('should return the number of entities', () => {
      manager.addEntities(player, goblin, ogre, guard);
      expect(manager.length()).to.equal(4);
    });
  });

  describe('.getEntities', () => {
    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();
    });

    it('should return the entity if it exists', () => {
      manager.addEntities(player, goblin, ogre, guard);
      expect(isNil(manager.getEntities(player.getId()))).to.be.false;
    });

    it('should return null if the entity does not exists', () => {
      expect(isNil(manager.getEntities(100))).to.be.true;
    });
  });

  describe('.findEntities', () => {
    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();
    });

    it('should return an array of all entities where the predicate returned true.', () => {
      const deathComponent = new Component('death');
      player.addComponents(deathComponent);
      manager.addEntities(player, goblin, ogre, guard);
      const entities = manager.findEntities((entity) => entity.hasComponents('death'));

      expect(entities.length).to.equal(1);
    });
  });

  describe('.addEntities', () => {
    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();
    });

    it('should add all specified entities to the list which are valid.', () => {
      expect(manager.length()).to.equal(0);

      manager.addEntities(player, goblin, ogre, guard);

      expect(manager.length()).to.equal(4);
    });

    it('should not add any specified entities to the list whose id is not unique.', () => {
      expect(manager.length()).to.equal(0);

      manager.addEntities(player, goblin, ogre, guard, player);

      expect(manager.length()).to.equal(4);
    });

    it('should emit an error when attempt to add an entity whose id is already being referenced.', () => {
      manager.addEntities(player, goblin, ogre, guard, player);
    });
  });

  describe('.removeEntities', () => {
    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();

      manager.addEntities(player, goblin, ogre, guard);
    });

    it('should remove all specified entities from the list if they exist.', () => {
      expect(manager.length()).to.equal(4);

      manager.removeEntities(ogre, guard);

      expect(manager.length()).to.equal(2);
    });

    it('should remove an entity when the entity is disposed.', () => {
      const id = ogre.getId();
      expect(manager.findEntities((entity) => entity.getId() === id).length).to.equal(1);
      ogre.dispose();
      expect(manager.findEntities((entity) => entity.getId() === id).length).to.equal(0);
    });
  });

  describe('.contains', () => {
    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();
    });

    it('should return true if the entity is in the list.', () => {
      manager.addEntities(player, goblin, ogre, guard);
      expect(manager.contains(player)).to.be.true;
    });

    it('should return false if the entity is not the list.', () => {
      manager.addEntities(goblin, ogre, guard);
      expect(manager.contains(player)).to.be.false;
    });
  });

  describe('.forEach', () => {
    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();

      manager.addEntities(player, goblin, ogre, guard);
    });

    it('should perform the predicate for each entity in the list.', () => {
      const ids = [];
      manager.forEach((entity) => ids.push(entity.getId()));

      expect(ids.length).to.equal(4);
    });
  });

  describe('.clear', () => {
    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();

      manager.addEntities(player, goblin, ogre, guard);
    });

    it('should remove all entities from the list', () => {
      manager.clear();
      expect(manager.length()).to.equal(0);
    });
  });

  describe('.toArray', () => {
    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();
    });

    it('should return an array of all entities.', () => {
      const entities = manager.toArray();
      expect(entities.length).to.equal(manager.length());
    });
  });

  describe('.subscribe', () => {
    let healthComponent;
    let positionComponent;

    let onAdd;
    let onRemove;
    let onError;
    let onEntityDispose;
    let onAddComponent;
    let onDisposeComponent;
    let onChangeComponent;
    let onAddHealthComponent;
    let onDisposeHealthComponent;
    let onChangeHealthComponent;
    let onAddPositionComponent;
    let onDisposePositionComponent;
    let onChangePositionComponent;

    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();
      healthComponent = new Component('health', { hp: 100 });
      positionComponent = new Component('position', { x: 1, y: 4, z: -2 });

      onAdd = sinon.spy();
      onRemove = sinon.spy();
      onError = sinon.spy();
      onEntityDispose = sinon.spy();
      onAddComponent = sinon.spy();
      onDisposeComponent = sinon.spy();
      onChangeComponent = sinon.spy();
      onAddHealthComponent = sinon.spy();
      onDisposeHealthComponent = sinon.spy();
      onChangeHealthComponent = sinon.spy();
      onAddPositionComponent = sinon.spy();
      onDisposePositionComponent = sinon.spy();
      onChangePositionComponent = sinon.spy();

      manager.subscribe('manager:add', onAdd);
      manager.subscribe('manager:remove', onRemove);
      manager.subscribe('error', onError);
      manager.subscribe('entity:dispose', onEntityDispose);
      manager.subscribe('entity:add', onAddComponent);
      manager.subscribe('entity:remove', onDisposeComponent);
      manager.subscribe('entity:change', onChangeComponent);
      manager.subscribe('entity:add:health', onAddHealthComponent);
      manager.subscribe('entity:remove:health', onDisposeHealthComponent);
      manager.subscribe('entity:change:health', onChangeHealthComponent);
      manager.subscribe('entity:add:position', onAddPositionComponent);
      manager.subscribe('entity:remove:position', onDisposePositionComponent);
      manager.subscribe('entity:change:position', onChangePositionComponent);
    });

    it('should emit events when an entity is added', () => {
      manager.addEntities(player, goblin, ogre, guard);

      expect(onAdd.called).to.be.true;
      expect(onAdd.callCount).to.equal(4);
      expect(onRemove.called).to.be.false;
      expect(onRemove.callCount).to.equal(0);
      expect(onError.called).to.be.false;
      expect(onError.callCount).to.equal(0);

      expect(onEntityDispose.called).to.be.false;
      expect(onEntityDispose.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.false;
      expect(onAddComponent.callCount).to.equal(0);
      expect(onAddHealthComponent.called).to.be.false;
      expect(onAddHealthComponent.callCount).to.equal(0);
      expect(onAddPositionComponent.called).to.be.false;
      expect(onAddPositionComponent.callCount).to.equal(0);

      expect(onChangeComponent.called).to.be.false;
      expect(onChangeComponent.callCount).to.equal(0);
      expect(onChangeHealthComponent.called).to.be.false;
      expect(onChangeHealthComponent.callCount).to.equal(0);
      expect(onChangePositionComponent.called).to.be.false;
      expect(onChangePositionComponent.callCount).to.equal(0);

      expect(onDisposeComponent.called).to.be.false;
      expect(onDisposeComponent.callCount).to.equal(0);
      expect(onDisposeHealthComponent.called).to.be.false;
      expect(onDisposeHealthComponent.callCount).to.equal(0);
      expect(onDisposePositionComponent.called).to.be.false;
      expect(onDisposePositionComponent.callCount).to.equal(0);
    });

    it('should emit events when an entity changes', () => {
      manager.addEntities(player, goblin, ogre, guard);
      player.addComponents(healthComponent, positionComponent);
      healthComponent.setState({ hp: 99 });
      player.removeComponents(positionComponent);

      expect(onAdd.called).to.be.true;
      expect(onAdd.callCount).to.equal(4);
      expect(onRemove.called).to.be.false;
      expect(onRemove.callCount).to.equal(0);
      expect(onError.called).to.be.false;
      expect(onError.callCount).to.equal(0);

      expect(onEntityDispose.called).to.be.false;
      expect(onEntityDispose.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.true;
      expect(onAddComponent.callCount).to.equal(2);
      expect(onAddHealthComponent.called).to.be.true;
      expect(onAddHealthComponent.callCount).to.equal(1);
      expect(onAddPositionComponent.called).to.be.true;
      expect(onAddPositionComponent.callCount).to.equal(1);

      expect(onChangeComponent.called).to.be.true;
      expect(onChangeComponent.callCount).to.equal(1);
      expect(onChangeHealthComponent.called).to.be.true;
      expect(onChangeHealthComponent.callCount).to.equal(1);
      expect(onChangePositionComponent.called).to.be.false;
      expect(onChangePositionComponent.callCount).to.equal(0);

      expect(onDisposeComponent.called).to.be.true;
      expect(onDisposeComponent.callCount).to.equal(1);
      expect(onDisposeHealthComponent.called).to.be.false;
      expect(onDisposeHealthComponent.callCount).to.equal(0);
      expect(onDisposePositionComponent.called).to.be.true;
      expect(onDisposePositionComponent.callCount).to.equal(1);
    });

    it('should emit events when an entity is removed', () => {
      manager.addEntities(player, goblin, ogre, guard);
      manager.removeEntities(player, goblin, ogre, guard);

      expect(onAdd.called).to.be.true;
      expect(onAdd.callCount).to.equal(4);
      expect(onRemove.called).to.be.true;
      expect(onRemove.callCount).to.equal(4);
      expect(onError.called).to.be.false;
      expect(onError.callCount).to.equal(0);

      expect(onEntityDispose.called).to.be.false;
      expect(onEntityDispose.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.false;
      expect(onAddComponent.callCount).to.equal(0);
      expect(onAddHealthComponent.called).to.be.false;
      expect(onAddHealthComponent.callCount).to.equal(0);
      expect(onAddPositionComponent.called).to.be.false;
      expect(onAddPositionComponent.callCount).to.equal(0);

      expect(onChangeComponent.called).to.be.false;
      expect(onChangeComponent.callCount).to.equal(0);
      expect(onChangeHealthComponent.called).to.be.false;
      expect(onChangeHealthComponent.callCount).to.equal(0);
      expect(onChangePositionComponent.called).to.be.false;
      expect(onChangePositionComponent.callCount).to.equal(0);

      expect(onDisposeComponent.called).to.be.false;
      expect(onDisposeComponent.callCount).to.equal(0);
      expect(onDisposeHealthComponent.called).to.be.false;
      expect(onDisposeHealthComponent.callCount).to.equal(0);
      expect(onDisposePositionComponent.called).to.be.false;
      expect(onDisposePositionComponent.callCount).to.equal(0);
    });

    it('should emit an error when attempting to remove an entity it does not own.', () => {
      manager.addEntities(player);
      manager.removeEntities(goblin);

      expect(onAdd.called).to.be.true;
      expect(onAdd.callCount).to.equal(1);
      expect(onRemove.called).to.be.false;
      expect(onRemove.callCount).to.equal(0);
      expect(onError.called).to.be.true;
      expect(onError.callCount).to.equal(1);

      expect(onEntityDispose.called).to.be.false;
      expect(onEntityDispose.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.false;
      expect(onAddComponent.callCount).to.equal(0);
      expect(onAddHealthComponent.called).to.be.false;
      expect(onAddHealthComponent.callCount).to.equal(0);
      expect(onAddPositionComponent.called).to.be.false;
      expect(onAddPositionComponent.callCount).to.equal(0);

      expect(onChangeComponent.called).to.be.false;
      expect(onChangeComponent.callCount).to.equal(0);
      expect(onChangeHealthComponent.called).to.be.false;
      expect(onChangeHealthComponent.callCount).to.equal(0);
      expect(onChangePositionComponent.called).to.be.false;
      expect(onChangePositionComponent.callCount).to.equal(0);

      expect(onDisposeComponent.called).to.be.false;
      expect(onDisposeComponent.callCount).to.equal(0);
      expect(onDisposeHealthComponent.called).to.be.false;
      expect(onDisposeHealthComponent.callCount).to.equal(0);
      expect(onDisposePositionComponent.called).to.be.false;
      expect(onDisposePositionComponent.callCount).to.equal(0);
    });

    it('should emit an error when attempting to add a duplicate entity.', () => {
      manager.addEntities(player);
      manager.addEntities(player);

      expect(onAdd.called).to.be.true;
      expect(onAdd.callCount).to.equal(1);
      expect(onRemove.called).to.be.false;
      expect(onRemove.callCount).to.equal(0);
      expect(onError.called).to.be.true;
      expect(onError.callCount).to.equal(1);

      expect(onEntityDispose.called).to.be.false;
      expect(onEntityDispose.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.false;
      expect(onAddComponent.callCount).to.equal(0);
      expect(onAddHealthComponent.called).to.be.false;
      expect(onAddHealthComponent.callCount).to.equal(0);
      expect(onAddPositionComponent.called).to.be.false;
      expect(onAddPositionComponent.callCount).to.equal(0);

      expect(onChangeComponent.called).to.be.false;
      expect(onChangeComponent.callCount).to.equal(0);
      expect(onChangeHealthComponent.called).to.be.false;
      expect(onChangeHealthComponent.callCount).to.equal(0);
      expect(onChangePositionComponent.called).to.be.false;
      expect(onChangePositionComponent.callCount).to.equal(0);

      expect(onDisposeComponent.called).to.be.false;
      expect(onDisposeComponent.callCount).to.equal(0);
      expect(onDisposeHealthComponent.called).to.be.false;
      expect(onDisposeHealthComponent.callCount).to.equal(0);
      expect(onDisposePositionComponent.called).to.be.false;
      expect(onDisposePositionComponent.callCount).to.equal(0);
    });
  });

  describe('.dispose', () => {
    let onDispose;
    let onAdd;
    let onRemove;
    let onError;
    let onEntityDispose;
    let onAddComponent;
    let onDisposeComponent;
    let onChangeComponent;

    beforeEach(() => {
      manager = new EntityManager();
      player = new Entity();
      goblin = new Entity();
      ogre = new Entity();
      guard = new Entity();

      onDispose = sinon.spy();
      onAdd = sinon.spy();
      onRemove = sinon.spy();
      onError = sinon.spy();
      onEntityDispose = sinon.spy();
      onAddComponent = sinon.spy();
      onDisposeComponent = sinon.spy();
      onChangeComponent = sinon.spy();

      manager.subscribe('manager:add', onAdd);
      manager.subscribe('manager:remove', onRemove);
      manager.subscribe('error', onError);
      manager.subscribe('entity:dispose', onEntityDispose);
      manager.subscribe('entity:add', onAddComponent);
      manager.subscribe('entity:remove', onDisposeComponent);
      manager.subscribe('entity:change', onChangeComponent);
      manager.subscribe('dispose', onDispose);
    });

    it('should emit dispose.', () => {
      manager.dispose();

      expect(onDispose.called).to.be.true;
      expect(onDispose.callCount).to.equal(1);
      expect(onAdd.called).to.be.false;
      expect(onAdd.callCount).to.equal(0);
      expect(onRemove.called).to.be.false;
      expect(onRemove.callCount).to.equal(0);
      expect(onError.called).to.be.false;
      expect(onError.callCount).to.equal(0);

      expect(onEntityDispose.called).to.be.false;
      expect(onEntityDispose.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.false;
      expect(onAddComponent.callCount).to.equal(0);
      expect(onChangeComponent.called).to.be.false;
      expect(onChangeComponent.callCount).to.equal(0);
      expect(onDisposeComponent.called).to.be.false;
      expect(onDisposeComponent.callCount).to.equal(0);
    });

    it('should flag manager as disposed.', () => {
      manager.dispose();
      expect(manager.isDisposed()).to.be.true;
    });

    it('should remove all entities from manager.', () => {
      manager.addEntities(player, goblin, ogre, guard);
      manager.dispose();

      expect(onDispose.called).to.be.true;
      expect(onDispose.callCount).to.equal(1);
      expect(onAdd.called).to.be.true;
      expect(onAdd.callCount).to.equal(4);
      expect(onRemove.called).to.be.false;
      expect(onRemove.callCount).to.equal(0);
      expect(onError.called).to.be.false;
      expect(onError.callCount).to.equal(0);

      expect(onEntityDispose.called).to.be.false;
      expect(onEntityDispose.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.false;
      expect(onAddComponent.callCount).to.equal(0);
      expect(onChangeComponent.called).to.be.false;
      expect(onChangeComponent.callCount).to.equal(0);
      expect(onDisposeComponent.called).to.be.false;
      expect(onDisposeComponent.callCount).to.equal(0);
    });
  });
});
