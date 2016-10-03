import Component from '../component';
import Entity from '../entity';
import EntityManager from '../entity-manager';
import System from '../system';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isFunction from 'lodash/isFunction';
import assert from './assert';

export { default as assert } from './assert';
export { default as requires } from './requires';

export function assertDisposable(...args) {
  const obj = args[0] ? args[0] : null;
  const message = args[1] ? args[1] : 'Object is disposed and no longer available.';
  assert(message, !obj.isDisposed(), ReferenceError);
}

export function assertComponent(...args) {
  const obj = args[0] ? args[0] : null;
  const message = args[1] ? args[1] : 'Expecting a Component.';
  assert(message, obj instanceof Component, TypeError);
}

export function assertEntity(...args) {
  const obj = args[0] ? args[0] : null;
  const message = args[1] ? args[1] : 'Expecting an Entity.';
  assert(message, obj instanceof Entity, TypeError);
}

export function assertEntityManager(...args) {
  const obj = args[0] ? args[0] : null;
  const message = args[1] ? args[1] : 'Expecting an EntityManager.';
  assert(message, obj instanceof EntityManager, TypeError);
}

export function assertSystem(...args) {
  const obj = args[0] ? args[0] : null;
  const message = args[1] ? args[1] : 'Expecting a System.';
  assert(message, obj instanceof System, TypeError);
}

export function assertString(...args) {
  const obj = args[0] ? args[0] : null;
  const message = args[1] ? args[1] : 'Expecting a String.';
  assert(message, isString(obj), TypeError);
}

export function assertNumber(...args) {
  const obj = args[0] ? args[0] : null;
  const message = args[1] ? args[1] : 'Expecting a Number.';
  assert(message, isNumber(obj), TypeError);
}

export function assertFunction(...args) {
  const obj = args[0] ? args[0] : null;
  const message = args[1] ? args[1] : 'Expecting a Function.';
  assert(message, isFunction(obj), TypeError);
}
