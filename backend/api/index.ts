import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

import LegacyRouter from './routers/legacy';
import V1Router from './routers/v1';
import V2AlphaRouter from './routers/v2alpha';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/health', (_, res) => res.send(`${process.env.NODE_ENV} Healthy`));
  router.use('/v1', V1Router(middlewares, controllers));
  router.use('/v2alpha', V2AlphaRouter(middlewares, controllers));
  router.use('/', LegacyRouter());

  return router;
};
