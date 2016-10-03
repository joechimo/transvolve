import functions from 'lodash/functions';
import forEach from 'lodash/forEach';
import decorateFunction from './decorate-function';

export default function decorateObject(target, ...decorators) {
  const toDecorate = target;
  const methods = functions(target);

  forEach(methods, (name) => {
    toDecorate[name] = decorateFunction(name, toDecorate[name], ...decorators);
  });

  return target;
}
