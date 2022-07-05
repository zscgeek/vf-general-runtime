import bodyParser from '@voiceflow/body-parser';
import express from 'express';

import { BODY_PARSER_SIZE_LIMIT } from '@/backend/constants';
import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.json({ limit: BODY_PARSER_SIZE_LIMIT }));
  router.use(middlewares.rateLimit.verify);

  router.get(
    '/state',
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.statelessV1.state
  );

  router.post('/', middlewares.rateLimit.versionConsume, middlewares.project.attachID, controllers.statelessV1.handler);

  // Legacy 1.0.0 routes with versionID in params
  router.get(
    '/:versionID/state',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    controllers.statelessV1.state
  );

  router.post(
    '/:versionID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    controllers.statelessV1.handler
  );

  return router;
};
