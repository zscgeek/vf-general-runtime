import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

import LegacyRouter from './routers/legacy';
import StatefulRouter from './routers/stateful';
import StatelessRouter from './routers/stateless';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/health', (_, res) => res.send(`${process.env.NODE_ENV} Healthy`));

  router.use('/', StatefulRouter(middlewares, controllers));
  router.use('/', StatelessRouter(middlewares, controllers));
  router.use('/', LegacyRouter());

  return router;
};
