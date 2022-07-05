import express from 'express';

import StateRouter from '@/backend/api/routers/stateful/v1';
import InteractRouter from '@/backend/api/routers/stateless/v1';
import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use('/interact', InteractRouter(middlewares, controllers));
  router.use('/state', StateRouter(middlewares, controllers));

  return router;
};
