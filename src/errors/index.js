import errors from 'errors';

errors.create({
  name: 'EntityNotFoundError',
  defaultMessage: 'The entity could not be found',
  defaultExplanation: 'The requested entity does not exist or is not contained in the target',
  defaultResponse: 'Verify the existence of and references to the entity then retry the operation',
});

errors.create({
  name: 'EntityAlreadyExistsError',
  defaultMessage: 'The entity already exists',
  defaultExplanation: 'The entity id is not unique or the target already references the entity',
  defaultResponse: 'Verify that the entity id is unique and the entity references then retry the operation',
});

errors.create({
  name: 'ComponentNotFoundError',
  defaultMessage: 'The component could not be found',
  defaultExplanation: 'The requested component does not exist or is not owned by the target',
  defaultResponse: 'Verify the existence and ownership of the component then retry the operation',
});

errors.create({
  name: 'ComponentAlreadyOwnedError',
  defaultMessage: 'The component is already owned',
  defaultExplanation: 'A component is being added to a target that already owns it',
  defaultResponse: 'Verify the ownership of the component then retry the operation',
});

errors.create({
  name: 'DuplicateComponentTypeError',
  defaultMessage: 'The entity already owns a component of the same type.',
  defaultExplanation: 'A component is being added to an entity who already owns a component of the same type',
  defaultResponse: 'Try updating the state of the existing component instead of adding a new one',
});

errors.create({
  name: 'SystemNotFoundError',
  defaultMessage: 'The system could not be found',
  defaultExplanation: 'The requested system does not exist or is not contained in the target',
  defaultResponse: 'Verify the existence of and references to the system then retry the operation',
});

errors.create({
  name: 'DuplicateSystemNameError',
  defaultMessage: 'A system with the same name already exists',
  defaultExplanation: 'A system is being added that has the same name as a previously added system',
  defaultResponse: 'Verify that the system names are unique then retry the operation',
});

export {
  EntityNotFoundError,
  EntityAlreadyExistsError,
  ComponentNotFoundError,
  ComponentAlreadyOwnedError,
  DuplicateComponentTypeError,
  SystemNotFoundError,
  DuplicateSystemNameError,
} from 'errors';
