import Symbol from 'es6-symbol';
import forEach from 'lodash/forEach';
import isFunction from 'lodash/isFunction';

const FIELDS = {
  isDisposable: Symbol('isDisposable'),
  isDisposing: Symbol('isDisposing'),
  isDisposed: Symbol('isDisposed'),
};

/**
 * Extends an object with functions that help manage clean disposal.
 * @mixin Disposable
 * @param {Symbol | String} symbolOrKey - Symbol or key in order to get inner event emitter.
 * @param {Function} onDispose - The handler for the dispose event.
 * @return {Object} Mixin.
 */
export default function mixin(resources, onDispose) {
  return {
    constructor() {
      this[FIELDS.isDisposable] = true;
      this[FIELDS.isDisposed] = false;
    },

    isDisposed() {
      return this[FIELDS.isDisposed];
    },

    dispose() {
      if (this[FIELDS.isDisposable]) {
        this[FIELDS.isDisposable] = false;

        if (this[FIELDS.isDisposed]) {
          return;
        }

        if (isFunction(onDispose)) {
          onDispose.call(this);
        }

        forEach(resources, (key) => {
          const resource = this[key];

          if (resource && resource[FIELDS.isDisposable]) {
            resource.dispose();
          }

          this[key] = null;
        });

        this[FIELDS.isDisposed] = true;
      }
    },
  };
}
