import { routeWrapper } from '@/lib/utils';
import { Config, Controller } from '@/types';

import { FullServiceMap } from '../services';
import StatefulV1 from './stateful/v1';
import StatefulV2Alpha from './stateful/v2alpha';
import StatelessV1 from './stateless/v1';
import StatelessV2Alpha from './stateless/v2alpha';

export interface ControllerMap {
  statelessV1: StatelessV1;
  statelessV2Alpha: StatelessV2Alpha;
  statefulV1: StatefulV1;
  statefulV2Alpha: StatefulV2Alpha;
}

export interface ControllerClass<T = Controller> {
  new (services: FullServiceMap, config: Config): T;
}

/**
 * Build all controllers
 */
const buildControllers = (services: FullServiceMap, config: Config) => {
  const controllers: ControllerMap = {
    statelessV1: new StatelessV1(services, config),
    statelessV2Alpha: new StatelessV2Alpha(services, config),
    statefulV1: new StatefulV1(services, config),
    statefulV2Alpha: new StatefulV2Alpha(services, config),
  };

  // everything before this will be route-wrapped
  routeWrapper(controllers);

  return controllers;
};

export default buildControllers;
