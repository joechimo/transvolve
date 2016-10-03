var Engine = require('../lib/engine').default;
var System = require('../lib/system').default;
var Entity = require('../lib/entity').default;
var Component = require('../lib/component').default;

var engine = new Engine({});

engine.subscribe('error', function(error) {
  console.log(error.toString());
});

var movementSystem = new System({
  name: 'movement',
  requirements: ['name', 'position', 'move'],
  interval: 3000,
  executor: function(context) {
    var entity = context.entity;
    function getRandomInt(min, max) {
      var MIN = Math.ceil(min);
      var MAX = Math.floor(max);
      return Math.floor(Math.random() * (MAX - MIN)) + MIN;
    }

    var nameComponent = entity.getComponents('name');
    var positionComponent = entity.getComponents('position');
    var position = positionComponent.getState();
    var name = nameComponent.getState('first');

    switch (getRandomInt(0, 7)) {
      case 0:
        position.x++;
        console.log(`${name} walks east.`);
        break;
      case 1:
        position.y++;
        console.log(`${name} walks north.`);
        break;
      case 2:
        position.x--;
        console.log(`${name} walks west.`);
        break;
      case 3:
        position.y--;
        console.log(`${name} walks south.`);
        break;
      case 4:
        position.z++;
        console.log(`${name} climbs up.`);
        break;
      case 5:
        position.z--;
        console.log(`${name} climbs down.`);
        break;
      default:
        console.log(`${name} stands idle.`);
        break;
    }

    positionComponent.setState(position);
  },
});

var spawnSystem = new System({
  name: 'spawn',
  requirements: ['name', 'spawn'],
  interval: 16,
  executor: (context) => {
    var entity = context.entity;
    var name = entity.getComponents('name').getState('first');
    console.log(`${name} has come into the world.`);
    entity.removeComponents('spawn');
    entity.addComponents(new Component('move'));
  },
});

var positionSystem = new System({
  name: 'spawn',
  requirements: ['name', 'position'],
  interval: 3000,
  executor: (context) => {
    var entity = context.entity;
    var name = entity.getComponents('name').getState('first');
    var position = entity.getComponents('position').getState();
    console.log(`${name} is located at ${position.x}, ${position.y}, ${position.z}`);
  },
});

var entity = new Entity();
var nameComponent = new Component('name', { first: 'Joe' });
var positionComponent = new Component('position', { x: 0, y: 0, z: 0 });
var spawnComponent = new Component('spawn');

entity.addComponents(nameComponent, positionComponent, spawnComponent);

engine.addEntities(entity);
engine.addSystems(spawnSystem, movementSystem, positionSystem);

module.exports = engine;
