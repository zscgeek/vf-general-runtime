import bodyParser from '@voiceflow/body-parser';
import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.json());
  // router.use(middlewares.auth.verify);
  router.use(middlewares.rateLimit.verify);

  router.post('/api', controllers.test.testAPI);

  router.post('/code', controllers.test.testCode);

  return router;
};
