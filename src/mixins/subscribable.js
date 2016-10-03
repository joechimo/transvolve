/**
 * Extends an object with functions that allow it to be subscribed to.
 * @mixin Subscribable
 * @return {Object} Mixin.
 */
export default function SubscribableMixin(emitter) {
  return {
    subscribe(event, handler, once = false) {
      if (!once) {
        this[emitter].on(event, handler);
      } else {
        this[emitter].once(event, handler);
      }

      return () => {
        this[emitter].off(event, handler);
      };
    },
  };
}
