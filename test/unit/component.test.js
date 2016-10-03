/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import sinon from 'sinon';
import Component from '../../src/component';

describe('Component', () => {
  describe('.constructor', () => {
    context('When arguments are invalid', () => {
      it('should throw an error', () => {
        expect(() => new Component(), 'missed type').to.throw(Error);
      });
    });

    context('When arguments are valid', () => {
      it('should create an instance', () => {
        expect(() => new Component('examples', { valid: true })).to.not.throw(Error);
      });

      it('should populate the initial state', () => {
        const state = { valid: true };
        const component = new Component('examples', state);
        expect(component.getState()).to.eql(state);
      });
    });
  });

  describe('.type', () => {
    it('should return component type', () => {
      const type = 'examples';
      const component = new Component(type);
      expect(component.getType()).to.equal(type);
    });
  });

  describe('.getState', () => {
    it('should return entire state when no path is passed', () => {
      const state = { valid: true };
      const component = new Component('examples', state);
      expect(state.valid === component.getState().valid).to.be.true;
    });

    it('should return target value when a path is passed', () => {
      const state = { valid: true };
      const component = new Component('examples', state);
      expect(component.getState('valid')).to.equal(true);
    });
  });

  describe('.setState', () => {
    it('should set entire state when only value is passed', () => {
      const state = { valid: true, number: 13 };
      const component = new Component('examples');
      component.setState(state);
      expect(component.getState().valid).to.be.true;
      expect(component.getState().number).to.equal(13);
    });

    it('should set a target field in state when a path is passed with value', () => {
      const state = { valid: true };
      const component = new Component('examples', state);
      component.setState('valid', false);
      expect(component.getState('valid')).to.be.false;
    });

    it('should result in a new state object', () => {
      const state = {
        validation: {
          valid: true,
          reason: 'Because I said so.',
        },
      };
      const component = new Component('examples', state);
      expect(state === component.getState()).to.be.false;
      expect(state.validation === component.getState().validation).to.be.false;
      expect(state.validation.valid === component.getState().validation.valid).to.be.true;
      expect(state.validation.reason === component.getState().validation.reason).to.be.true;
      component.setState('validation.valid', false);
      expect(state === component.getState()).to.be.false;
      expect(state.validation === component.getState().validation).to.be.false;
      expect(state.validation.valid === component.getState().validation.valid).to.be.false;
      expect(state.validation.reason === component.getState().validation.reason).to.be.true;
    });
  });

  describe('.subscribe', () => {
    context('When the value of state has changed', () => {
      it('should emit "change" event', () => {
        const state = { valid: true };
        const component = new Component('examples', state);
        const onChange = sinon.spy();
        component.subscribe('component:change', onChange);
        component.setState('valid', false);
        expect(component.getState('valid')).to.equal(false);
        expect(onChange.called, 'component must emit a change event').to.be.true;
        expect(onChange.callCount, 'component must emit a change event only once').to.equal(1);
      });
    });
  });

  describe('.dispose', () => {
    context('When is disposed', () => {
      it('should flag as disposed', () => {
        const state = { valid: true };
        const component = new Component('examples', state);
        const onDispose = sinon.spy();
        component.subscribe('component:dispose', onDispose);
        component.dispose();
        expect(component.isDisposed(), 'component must be disposed').to.be.true;
        expect(onDispose.called, 'component must emit a dispose event').to.be.true;
        expect(onDispose.callCount, 'component must emit a dispose event only once').to.equal(1);
      });
    });
  });
});
