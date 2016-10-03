/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import sinon from 'sinon';
import isUndefined from 'lodash/isUndefined';
import isNil from 'lodash/isNil';
import keys from 'lodash/keys';
import Entity from '../../src/entity';
import Component from '../../src/component';

describe('Entity', () => {
  describe('.constructor', () => {
    it('should create an instance', () => {
      expect(() => new Entity()).to.not.throw(Error);
    });

    it('should populate the initial state', () => {
      expect(isNil(new Entity().getId())).to.be.false;
    });
  });

  describe('.getComponents', () => {
    let entity;
    let healthComponent;
    let positionComponent;
    let levelComponent;

    beforeEach(() => {
      entity = new Entity();
      healthComponent = new Component('health', { hp: 100 });
      positionComponent = new Component('position', { x: 1, y: 3, z: -1 });
      levelComponent = new Component('level', { level: 20 });

      entity.addComponents(healthComponent, positionComponent, levelComponent);
    });

    context('When no types are specified as arguments', () => {
      it('should return all components', () => {
        const components = entity.getComponents();
        expect(keys(components).length).to.equal(3);
        expect(isNil(components.health)).to.be.false;
        expect(isNil(components.position)).to.be.false;
        expect(isNil(components.level)).to.be.false;
      });
    });

    context('When one type is specified as an argument', () => {
      it('should return a component of the specified type', () => {
        const component = entity.getComponents('health');
        expect(isNil(component)).to.be.false;
        expect(component.getType()).to.equal('health');
      });

      it('should return undefined if the entity does not have a component of the specified type.', () => {
        const component = entity.getComponents('death');
        expect(isUndefined(component)).to.be.true;
      });
    });

    context('When multiple types are specified as arguments', () => {
      it('should return all existing components of specified types that the entity has.', () => {
        const components = entity.getComponents('health', 'death');

        expect(keys(components).length).to.equal(1);
        expect(isNil(components.health)).to.be.false;
        expect(isNil(components.death)).to.be.true;
      });

      it('should not return any components of specified types that the entity does not own.', () => {
        const components = entity.getComponents('health', 'position');

        expect(keys(components).length).to.equal(2);
        expect(isNil(components.health)).to.be.false;
        expect(isNil(components.position)).to.be.false;
      });
    });
  });

  describe('.addComponents', () => {
    let entity;
    let healthComponent;
    let positionComponent;


    beforeEach(() => {
      entity = new Entity();
      healthComponent = new Component('health', { hp: 100 });
      positionComponent = new Component('position', { x: 1, y: 3, z: -1 });
    });

    it('should add all specified components to the entity', () => {
      entity.addComponents(healthComponent, positionComponent);
      const components = entity.getComponents();

      expect(keys(components).length).to.equal(2);
      expect(isNil(components.health)).to.be.false;
      expect(isNil(components.position)).to.be.false;
    });

    it('should prevent adding components of types that are already owned', () => {
      entity.addComponents(healthComponent, healthComponent);
      const components = entity.getComponents();

      expect(keys(components).length).to.equal(1);
      expect(isNil(components.health)).to.be.false;
    });
  });

  describe('.removeComponents', () => {
    let entity;
    let healthComponent;
    let positionComponent;
    let levelComponent;

    beforeEach(() => {
      entity = new Entity();
      healthComponent = new Component('health', { hp: 100 });
      positionComponent = new Component('position', { x: 1, y: 3, z: -1 });
      levelComponent = new Component('level', { level: 20 });

      entity.addComponents(healthComponent, positionComponent, levelComponent);
    });

    it('should remove components passed as arguments', () => {
      const components = entity.getComponents();
      expect(keys(components).length).to.equal(3);
      expect(isNil(components.health)).to.be.false;
      expect(isNil(components.position)).to.be.false;
      expect(isNil(components.level)).to.be.false;

      entity.removeComponents(healthComponent, positionComponent);
      expect(keys(entity.getComponents()).length).to.equal(1);
      expect(isNil(entity.getComponents('health'))).to.be.true;
      expect(isNil(entity.getComponents('position'))).to.be.true;
      expect(isNil(entity.getComponents('level'))).to.be.false;
    });

    it('should remove components by component type', () => {
      const components = entity.getComponents();
      expect(keys(components).length).to.equal(3);
      expect(isNil(components.health)).to.be.false;
      expect(isNil(components.position)).to.be.false;
      expect(isNil(components.level)).to.be.false;

      entity.removeComponents('health', 'position');
      expect(keys(entity.getComponents()).length).to.equal(1);
      expect(isNil(entity.getComponents('health'))).to.be.true;
      expect(isNil(entity.getComponents('position'))).to.be.true;
      expect(isNil(entity.getComponents('level'))).to.be.false;
    });

    it('should remove components by a combination of component and type', () => {
      const components = entity.getComponents();
      expect(keys(components).length).to.equal(3);
      expect(isNil(components.health)).to.be.false;
      expect(isNil(components.position)).to.be.false;
      expect(isNil(components.level)).to.be.false;

      entity.removeComponents('health', positionComponent);
      expect(keys(entity.getComponents()).length).to.equal(1);
      expect(isNil(entity.getComponents('health'))).to.be.true;
      expect(isNil(entity.getComponents('position'))).to.be.true;
      expect(isNil(entity.getComponents('level'))).to.be.false;
    });

    it('should dispose all the that were removed', () => {
      const components = entity.getComponents();

      expect(components.health.isDisposed()).to.be.false;
      expect(components.position.isDisposed()).to.be.false;
      expect(components.level.isDisposed()).to.be.false;

      entity.removeComponents('health', 'position');

      expect(components.health.isDisposed()).to.be.true;
      expect(components.position.isDisposed()).to.be.true;
      expect(components.level.isDisposed()).to.be.false;
    });
  });

  describe('.hasComponents', () => {
    let entity;
    let healthComponent;
    let positionComponent;
    let levelComponent;

    beforeEach(() => {
      entity = new Entity();
      healthComponent = new Component('health', { hp: 100 });
      positionComponent = new Component('position', { x: 1, y: 3, z: -1 });
      levelComponent = new Component('level', { level: 20 });

      entity.addComponents(healthComponent, positionComponent, levelComponent);
    });

    it('should return true if the entity owns components of all the specified types', () => {
      expect(entity.hasComponents('health', 'position')).to.be.true;
      expect(entity.hasComponents('level')).to.be.true;
      expect(entity.hasComponents('health', 'level', 'position')).to.be.true;
    });

    it('should return false if the entity does not own components of all the specified types', () => {
      expect(entity.hasComponents('health', 'position', 'death')).to.be.false;
      expect(entity.hasComponents('spawn')).to.be.false;
    });
  });

  describe('.subscribe', () => {
    let entity;
    let healthComponent;
    let positionComponent;

    let onDispose;
    let onAddComponent;
    let onDisposeComponent;
    let onChangeComponent;
    let onAddHealthComponent;
    let onDisposeHealthComponent;
    let onChangeHealthComponent;
    let onAddPositionComponent;
    let onDisposePositionComponent;
    let onChangePositionComponent;
    let onError;

    beforeEach(() => {
      entity = new Entity();
      healthComponent = new Component('health', { hp: 100 });
      positionComponent = new Component('position', { x: 1, y: 3, z: -1 });

      onDispose = sinon.spy();
      onAddComponent = sinon.spy();
      onDisposeComponent = sinon.spy();
      onChangeComponent = sinon.spy();
      onAddHealthComponent = sinon.spy();
      onDisposeHealthComponent = sinon.spy();
      onChangeHealthComponent = sinon.spy();
      onAddPositionComponent = sinon.spy();
      onDisposePositionComponent = sinon.spy();
      onChangePositionComponent = sinon.spy();
      onError = sinon.spy();

      entity.subscribe('entity:dispose', onDispose);
      entity.subscribe('entity:add', onAddComponent);
      entity.subscribe('entity:add:health', onAddHealthComponent);
      entity.subscribe('entity:add:position', onAddPositionComponent);
      entity.subscribe('entity:change', onChangeComponent);
      entity.subscribe('entity:change:health', onChangeHealthComponent);
      entity.subscribe('entity:change:position', onChangePositionComponent);
      entity.subscribe('entity:remove', onDisposeComponent);
      entity.subscribe('entity:remove:health', onDisposeHealthComponent);
      entity.subscribe('entity:remove:position', onDisposePositionComponent);
      entity.subscribe('error', onError);
    });

    it('should emit events when a component is added', () => {
      entity.addComponents(healthComponent, positionComponent);

      expect(onDispose.called).to.be.false;
      expect(onDispose.callCount).to.equal(0);
      expect(onError.called).to.be.false;
      expect(onError.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.true;
      expect(onAddComponent.callCount).to.equal(2);
      expect(onAddHealthComponent.called).to.be.true;
      expect(onAddHealthComponent.callCount).to.equal(1);
      expect(onAddPositionComponent.called).to.be.true;
      expect(onAddPositionComponent.callCount).to.equal(1);

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

    it('should emit events when a component is changed', () => {
      entity.addComponents(healthComponent, positionComponent);
      healthComponent.setState({ hp: 90 });
      positionComponent.setState({ x: 4, y: 10, z: -5 });

      expect(onDispose.called).to.be.false;
      expect(onDispose.callCount).to.equal(0);
      expect(onError.called).to.be.false;
      expect(onError.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.true;
      expect(onAddComponent.callCount).to.equal(2);
      expect(onAddHealthComponent.called).to.be.true;
      expect(onAddHealthComponent.callCount).to.equal(1);
      expect(onAddPositionComponent.called).to.be.true;
      expect(onAddPositionComponent.callCount).to.equal(1);

      expect(onChangeComponent.called).to.be.true;
      expect(onChangeComponent.callCount).to.equal(2);
      expect(onChangeHealthComponent.called).to.be.true;
      expect(onChangeHealthComponent.callCount).to.equal(1);
      expect(onChangePositionComponent.called).to.be.true;
      expect(onChangePositionComponent.callCount).to.equal(1);

      expect(onDisposeComponent.called).to.be.false;
      expect(onDisposeComponent.callCount).to.equal(0);
      expect(onDisposeHealthComponent.called).to.be.false;
      expect(onDisposeHealthComponent.callCount).to.equal(0);
      expect(onDisposePositionComponent.called).to.be.false;
      expect(onDisposePositionComponent.callCount).to.equal(0);
    });

    it('should emit events when a component is disposed', () => {
      entity.addComponents(healthComponent, positionComponent);
      entity.removeComponents(healthComponent, positionComponent);

      expect(onDispose.called).to.be.false;
      expect(onDispose.callCount).to.equal(0);
      expect(onError.called).to.be.false;
      expect(onError.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.true;
      expect(onAddComponent.callCount).to.equal(2);
      expect(onAddHealthComponent.called).to.be.true;
      expect(onAddHealthComponent.callCount).to.equal(1);
      expect(onAddPositionComponent.called).to.be.true;
      expect(onAddPositionComponent.callCount).to.equal(1);

      expect(onChangeComponent.called).to.be.false;
      expect(onChangeComponent.callCount).to.equal(0);
      expect(onChangeHealthComponent.called).to.be.false;
      expect(onChangeHealthComponent.callCount).to.equal(0);
      expect(onChangePositionComponent.called).to.be.false;
      expect(onChangePositionComponent.callCount).to.equal(0);

      expect(onDisposeComponent.called).to.be.true;
      expect(onDisposeComponent.callCount).to.equal(2);
      expect(onDisposeHealthComponent.called).to.be.true;
      expect(onDisposeHealthComponent.callCount).to.equal(1);
      expect(onDisposePositionComponent.called).to.be.true;
      expect(onDisposePositionComponent.callCount).to.equal(1);
    });

    it('should emit an error when attempting to get a component type which is not owned by the entity ', () => {
      entity.getComponents('death');

      expect(onDispose.called).to.be.false;
      expect(onDispose.callCount).to.equal(0);
      expect(onError.called).to.be.true;
      expect(onError.callCount).to.equal(1);

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

    it('should emit an error for each attempt to get a component type which is not owned by the entity ', () => {
      entity.getComponents('death', 'heaven');

      expect(onDispose.called).to.be.false;
      expect(onDispose.callCount).to.equal(0);
      expect(onError.called).to.be.true;
      expect(onError.callCount).to.equal(2);

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

    it('should emit an error for each attempt to add a component of type which is already owned by the entity', () => {
      entity.addComponents(healthComponent, healthComponent);

      expect(onDispose.called).to.be.false;
      expect(onDispose.callCount).to.equal(0);
      expect(onError.called).to.be.true;
      expect(onError.callCount).to.equal(1);

      expect(onAddComponent.called).to.be.true;
      expect(onAddComponent.callCount).to.equal(1);
      expect(onAddHealthComponent.called).to.be.true;
      expect(onAddHealthComponent.callCount).to.equal(1);
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

    it('should emit an error for each attempt to remove a component the entity does not own', () => {
      entity.addComponents(healthComponent);
      entity.removeComponents('death', healthComponent);

      expect(onDispose.called).to.be.false;
      expect(onDispose.callCount).to.equal(0);
      expect(onError.called).to.be.true;
      expect(onError.callCount).to.equal(1);

      expect(onAddComponent.called).to.be.true;
      expect(onAddComponent.callCount).to.equal(1);
      expect(onAddHealthComponent.called).to.be.true;
      expect(onAddHealthComponent.callCount).to.equal(1);
      expect(onAddPositionComponent.called).to.be.false;
      expect(onAddPositionComponent.callCount).to.equal(0);

      expect(onChangeComponent.called).to.be.false;
      expect(onChangeComponent.callCount).to.equal(0);
      expect(onChangeHealthComponent.called).to.be.false;
      expect(onChangeHealthComponent.callCount).to.equal(0);
      expect(onChangePositionComponent.called).to.be.false;
      expect(onChangePositionComponent.callCount).to.equal(0);

      expect(onDisposeComponent.called).to.be.true;
      expect(onDisposeComponent.callCount).to.equal(1);
      expect(onDisposeHealthComponent.called).to.be.true;
      expect(onDisposeHealthComponent.callCount).to.equal(1);
      expect(onDisposePositionComponent.called).to.be.false;
      expect(onDisposePositionComponent.callCount).to.equal(0);
    });
  });

  describe('.dispose', () => {
    let entity;
    let healthComponent;
    let positionComponent;

    let onDispose;
    let onAddComponent;
    let onDisposeComponent;
    let onChangeComponent;
    let onAddHealthComponent;
    let onDisposeHealthComponent;
    let onChangeHealthComponent;
    let onAddPositionComponent;
    let onDisposePositionComponent;
    let onChangePositionComponent;
    let onError;

    beforeEach(() => {
      entity = new Entity();
      healthComponent = new Component('health', { hp: 100 });
      positionComponent = new Component('position', { x: 1, y: 3, z: -1 });

      onDispose = sinon.spy();
      onAddComponent = sinon.spy();
      onDisposeComponent = sinon.spy();
      onChangeComponent = sinon.spy();
      onAddHealthComponent = sinon.spy();
      onDisposeHealthComponent = sinon.spy();
      onChangeHealthComponent = sinon.spy();
      onAddPositionComponent = sinon.spy();
      onDisposePositionComponent = sinon.spy();
      onChangePositionComponent = sinon.spy();
      onError = sinon.spy();

      entity.subscribe('entity:dispose', onDispose);
      entity.subscribe('entity:add', onAddComponent);
      entity.subscribe('entity:add:health', onAddHealthComponent);
      entity.subscribe('entity:add:position', onAddPositionComponent);
      entity.subscribe('entity:change', onChangeComponent);
      entity.subscribe('entity:change:health', onChangeHealthComponent);
      entity.subscribe('entity:change:position', onChangePositionComponent);
      entity.subscribe('entity:remove', onDisposeComponent);
      entity.subscribe('entity:remove:health', onDisposeHealthComponent);
      entity.subscribe('entity:remove:position', onDisposePositionComponent);
      entity.subscribe('error', onError);
    });

    it('should emit a dispose event and flag as disposed', () => {
      entity.dispose();

      expect(entity.isDisposed()).to.be.true;
      expect(onDispose.called).to.be.true;
      expect(onDispose.callCount).to.equal(1);
      expect(onError.called).to.be.false;
      expect(onError.callCount).to.equal(0);

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

    it('should dispose and remove all components', () => {
      entity.addComponents(healthComponent, positionComponent);
      entity.dispose();

      expect(entity.isDisposed()).to.be.true;
      expect(healthComponent.isDisposed()).to.be.true;
      expect(positionComponent.isDisposed()).to.be.true;

      expect(onDispose.called).to.be.true;
      expect(onDispose.callCount).to.equal(1);
      expect(onError.called).to.be.false;
      expect(onError.callCount).to.equal(0);

      expect(onAddComponent.called).to.be.true;
      expect(onAddComponent.callCount).to.equal(2);
      expect(onAddHealthComponent.called).to.be.true;
      expect(onAddHealthComponent.callCount).to.equal(1);
      expect(onAddPositionComponent.called).to.be.true;
      expect(onAddPositionComponent.callCount).to.equal(1);

      expect(onChangeComponent.called).to.be.false;
      expect(onChangeComponent.callCount).to.equal(0);
      expect(onChangeHealthComponent.called).to.be.false;
      expect(onChangeHealthComponent.callCount).to.equal(0);
      expect(onChangePositionComponent.called).to.be.false;
      expect(onChangePositionComponent.callCount).to.equal(0);

      expect(onDisposeComponent.called).to.be.false;
      expect(onDisposeComponent.callCount).to.equal(0);
      expect(onDisposeHealthComponent.called).to.be.fale;
      expect(onDisposeHealthComponent.callCount).to.equal(0);
      expect(onDisposePositionComponent.called).to.be.false;
      expect(onDisposePositionComponent.callCount).to.equal(0);
    });
  });
});
