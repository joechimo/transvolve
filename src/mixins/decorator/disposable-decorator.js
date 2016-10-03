import assert from '../assert/disposable-assert';

export default function Decorator(name, fn) {
  if (name === 'constructor' || name === 'dispose' || name === 'isDisposed') {
    return fn;
  }

  return function decorator(...args) {
    assert(this);
    return fn.apply(this, args);
  };
}
