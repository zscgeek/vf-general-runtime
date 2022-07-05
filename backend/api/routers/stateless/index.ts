import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

import StatelessRouterV1 from './v1';
import StatelessRouterV2Alpha from './v2alpha';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use('/v1/stateless', StatelessRouterV1(middlewares, controllers));
  router.use('/v2alpha/stateless', StatelessRouterV2Alpha(middlewares, controllers));

  return router;
};
