import isNil from 'lodash/isNil';
import assert from './assert';

/**
 * Specifies a precondition contract for the enclosing method or property,
 * and displays a message if the condition for the contract fails.
 * @param {string} name - The method / property name to display if the condition is false.
 * @param {any} value - The conditional expression to test.
 */
export default function requires(...args) {
  let namespace = null;
  let name = null;
  let value = null;

  if (args.length === 3) {
    namespace = args[0];
    name = args[1];
    value = args[2];
  } else {
    name = args[0];
    value = args[1];
  }

  const message = namespace ?
    `${namespace} ${name} is required!` :
    `${name} is required!`;

  assert(message, !isNil(value), TypeError);
}
