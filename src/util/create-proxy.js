/* eslint-disable func-names, prefer-rest-params  */
import Symbol from 'es6-symbol';
import isEmpty from 'lodash/isEmpty';
import functions from 'lodash/functions';
import startsWith from 'lodash/startsWith';
import forEach from 'lodash/forEach';

const FIELDS = {
  source: Symbol('source'),
};

export default function createProxy(SourceClass, publicMethods) {
  const Proxy = function Proxy() {
    this[FIELDS.source] = new SourceClass(...arguments);
  };

  const proto = {};
  let methods = publicMethods;

  // if public methods are not defined explicitly
  // use JS convention - all private methods start form '_'.
  if (isEmpty(methods)) {
    methods = [];
    forEach(functions(SourceClass.prototype), (method) => {
      if (!startsWith(method, '_')) {
        methods.push(method);
      }
    });
  }

  forEach(methods, (method) => {
    proto[method] = ((function (sym) {
      return function () {
        const source = this[sym];
        const sourceMethod = source[method];
        const result = sourceMethod.apply(source, arguments);

        return result === source ? this : result;
      };
    })(FIELDS.source));
  });

  Proxy.prototype = proto;

  return Proxy;
}
