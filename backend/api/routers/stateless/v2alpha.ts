import bodyParser from '@voiceflow/body-parser';
import express from 'express';

import { BODY_PARSER_SIZE_LIMIT } from '@/backend/constants';
import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.json({ limit: BODY_PARSER_SIZE_LIMIT }));
  router.use(middlewares.rateLimit.verify);

  // TODO may remove this functionality
  router.get(
    '/:versionID/state',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    controllers.statelessV2Alpha.state
  );

  router.post(
    '/:versionID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    controllers.statelessV2Alpha.handler
  );

  return router;
};
