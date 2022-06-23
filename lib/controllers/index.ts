import { routeWrapper } from '@/lib/utils';
import { Config, Controller } from '@/types';

import { FullServiceMap } from '../services';
import StatefulV1 from './stateful/v1';
import StatefulV2Alpha from './stateful/v2alpha';
import StatelessV1 from './stateless/v1';
import StatelessV2Alpha from './stateless/v2alpha';

export interface ControllerMap {
  stateless: {
    v1: StatelessV1;
    v2alpha: StatelessV2Alpha;
  };
  stateful: {
    v1: StatefulV1;
    v2alpha: StatefulV2Alpha;
  };
}

export interface ControllerClass<T = Controller> {
  new (services: FullServiceMap, config: Config): T;
}

/**
 * Build all controllers
 */
const buildControllers = (services: FullServiceMap, config: Config) => {
  const controllers: ControllerMap = {
    stateless: {
      v1: new StatelessV1(services, config),
      v2alpha: new StatelessV2Alpha(services, config),
    },
    stateful: {
      v1: new StatefulV1(services, config),
      v2alpha: new StatefulV2Alpha(services, config),
    },
  };

  // everything before this will be route-wrapped
  routeWrapper(controllers);

  return controllers;
};

export default buildControllers;
