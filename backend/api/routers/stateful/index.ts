import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

import V1Router from './v1';
import V2AlphaRouter from './v2alpha';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/health', (_, res) => res.send(`${process.env.NODE_ENV} Healthy`));
  router.use('/v1', V1Router(middlewares, controllers));
  router.use('/v2alpha', V2AlphaRouter(middlewares, controllers));

  return router;
};
