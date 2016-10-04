[![NPM Version](https://badge.fury.io/js/transvolve.svg)](https://npmjs.org/packages/transvolve) [![Build Status](https://travis-ci.org/joechimo/transvolve.svg?branch=master)](https://travis-is.org/joechimo/transvolve) [![Coverage Status](https://coveralls.io/repos/github/joechimo/transvolve/badge.svg?branch=master)](https://coveralls.io/github/joechimo/transvolve)

# transvolve.js

The ECS engine you can react to!

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Installing

Getting all set up is easy.

First, install the npm package to you project.

```
npm install transvolve
```

Then, go ahead and import it into your code and run.

```
import { Engine } from 'transvolve';

const engine = new Engine();
```

Take a gander at the [transvolve.js](https://joechimo.github.io/transvolve/) GitHub Page and the [API Documentation](https://joechimo.github.io/transvolve/docs/).

## Running the tests

Test can be ran using:

```
npm run test
```

## Example code that demonstrates the engine

```
   var transvolve = require('transvolve');
   var Engine = transvolve.Engine;
   var System = transvolve.System;
   var Entity = transvolve.Entity;
   var Component = transvolve.Component;
   
   function random(min, max) {
     var MIN = Math.ceil(min);
     var MAX = Math.floor(max);
     return Math.floor(Math.random() * (MAX - MIN)) + MIN;
   }
   
   var engine = new Engine();
   
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
             console.log(entity.getId() + ' has perished.');
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
         console.log(entity.getId() + ' has revived.');
       } else {
         entity.getComponents('death').setState('timer', timer);
       }
     },
   });
   
   engine.addSystems(decaySystem, resurrectSystem);
   engine.subscribe('tick', onTick);
   
   engine.init()
     .then(() => {
       engine.start();
     });
```

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Joe Cimaszewski** - *Initial work* - [joechimo](https://github.com/joechimo)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Just me, right now.
