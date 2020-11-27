import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

import PrototypeRouter from './routers/prototype';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/health', (_, res) => res.send('Healthy'));
  router.use('/state', PrototypeRouter(middlewares, controllers));

  return router;
};
