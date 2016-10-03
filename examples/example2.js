var Engine = require('../lib/engine').default;
var System = require('../lib/system').default;
var Entity = require('../lib/entity').default;
var Component = require('../lib/component').default;

function random(min, max) {
  var MIN = Math.ceil(min);
  var MAX = Math.floor(max);
  return Math.floor(Math.random() * (MAX - MIN)) + MIN;
}

var engine = new Engine({});

function onTick() {
  var entity = new Entity();
  var healthComponent = new Component('health', { hp: 100 });
  var decayComponent = new Component('decay');

  entity.addComponents(healthComponent, decayComponent);
  engine.addEntities(entity);
}

var decaySystem = new System({
  name: 'decay',
  requirements: ['decay'],
  interval: 100,
  executor: (context) => {
    var entity = context.entity;

    var timer = entity.getComponents('decay').getState('timer');
    timer = timer - context.time.delta;

    if (timer > 0) {
      entity.getComponents('decay').setState('timer', timer);
    } else {
      var hp = entity.getComponents('health').getState('hp');
      var loss = random(0, 100);

      hp = (hp - loss) > 0 ? hp - loss : 0;
      entity.getComponents('health').setState('hp', hp);

      if (hp === 0) {
        if (random(0, 100) >= 50) {
          entity.removeComponents('decay');
          entity.addComponents(new Component('death', { timer: 5000 }));
          console.log(`${entity.getId()} has perished.`);
        } else {
          entity.dispose();
        }
      } else {
        entity.getComponents('decay').setState('timer', 1000);
      }
    }
  },
});

var resurrectSystem = new System({
  name: 'resurrect',
  requirements: ['death'],
  interval: 1000,
  executor: (context) => {
    var entity = context.entity;
    var timer = entity.getComponents('death').getState('timer');
    timer = timer - context.time.delta;

    if (timer <= 0) {
      entity.removeComponents('death');
      entity.getComponents('health').setState('hp', 100);
      entity.addComponents(new Component('decay', { timer: 1000 }));
      console.log(`${entity.getId()} has revived.`);
    } else {
      entity.getComponents('death').setState('timer', timer);
    }
  },
});

engine.addSystems(decaySystem, resurrectSystem);
engine.subscribe('tick', onTick);

module.exports = engine;
