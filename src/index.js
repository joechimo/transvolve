/** @module ecs-js */
import Engine from './engine';
import Entity from './entity';
import Component from './component';
import System from './system';

const ecs = {
  Engine,
  Entity,
  Component,
  System,
};

export default ecs;

/**
 * An error event occurs when an entity encounters an error.
 * @event module:ecs-js#error
 * @param {Error} error - The error that was encountered.
 */
