import assert from '../../asserts/assert';

const TEMPLATE = 'Object is disposed';

export default function assertDisposable(...args) {
  let target = null;
  let namespace = null;

  if (args.length === 2) {
    namespace = args[0];
    target = args[1];
  } else {
    target = args[0];
  }

  const message = namespace ? `${namespace} ${TEMPLATE}` : TEMPLATE;
  assert(message, !target.isDisposed(), TypeError);
}
