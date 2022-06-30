import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

import StatefulRouter from './stateful';
import StatelessRouter from './stateless';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/health', (_, res) => res.send(`${process.env.NODE_ENV} Healthy`));
  router.use('/stateful', StatefulRouter(middlewares, controllers));
  router.use('/stateless', StatelessRouter(middlewares, controllers));

  return router;
};
