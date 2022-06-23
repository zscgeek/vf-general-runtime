import express from 'express';

// import V2BetaRouter from './v2beta/state';
import { ControllerMap, MiddlewareMap } from '@/lib';

import V1Router from './v1/state';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/health', (_, res) => res.send(`${process.env.NODE_ENV} Healthy`));
  router.use('/v1', V1Router(middlewares, controllers));
  // router.use('/v2beta', V2BetaRouter(middlewares, controllers));

  return router;
};
