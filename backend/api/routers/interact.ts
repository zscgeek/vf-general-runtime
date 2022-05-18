import bodyParser from '@voiceflow/body-parser';
import express from 'express';

import { BODY_PARSER_SIZE_LIMIT } from '@/backend/constants';
import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.json({ limit: BODY_PARSER_SIZE_LIMIT }));
  router.use(middlewares.rateLimit.verify);

  const mainMiddleware = [middlewares.version.resolveVersionID, middlewares.rateLimit.versionConsume, middlewares.project.attachProjectID];

  const legacyMiddleware = [middlewares.project.unifyVersionID, middlewares.version.resolveVersionID, middlewares.rateLimit.versionConsume];

  router.get('/state', mainMiddleware, controllers.interact.state);
  router.post('/', mainMiddleware, controllers.interact.handler);

  // Legacy 1.0.0 routes with versionID in params
  router.get('/:versionID/state', legacyMiddleware, controllers.interact.state);
  router.post('/:versionID', legacyMiddleware, controllers.interact.handler);

  return router;
};
