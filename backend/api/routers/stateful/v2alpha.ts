import bodyParser from '@voiceflow/body-parser';
import express from 'express';

import { BODY_PARSER_SIZE_LIMIT } from '@/backend/constants';
import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.json({ limit: BODY_PARSER_SIZE_LIMIT }));
  router.use(middlewares.rateLimit.verify);

  router.post(
    '/:versionID/user/:userID/interact',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v2alpha.interact
  );

  router.get(
    '/:versionID/user/:userID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v2alpha.get
  );

  router.put(
    '/:versionID/user/:userID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v2alpha.update
  );

  router.delete(
    '/:versionID/user/:userID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v2alpha.delete
  );

  router.post(
    '/:versionID/user/:userID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v2alpha.reset
  );

  router.patch(
    '/:versionID/user/:userID/variables',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v2alpha.updateVariables
  );

  return router;
};
