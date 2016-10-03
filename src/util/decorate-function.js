import forEach from 'lodash/forEach';

export default function decorateFunction(name, target, ...decorators) {
  let result = target;

  forEach(decorators, (decorator) => {
    result = decorator(name, result);
  });

  return result;
}
