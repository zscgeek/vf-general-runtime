import bodyParser from '@voiceflow/body-parser';
import express from 'express';

import { BODY_PARSER_SIZE_LIMIT } from '@/backend/constants';
import { ControllerMap, MiddlewareMap } from '@/lib';

const StatefulRouterV1 = (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.json({ limit: BODY_PARSER_SIZE_LIMIT }));
  router.use(middlewares.rateLimit.verify);

  router.post(
    '/user/:userID/interact',
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.interact
  );

  router.get(
    '/user/:userID',
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.get
  );

  router.put(
    '/user/:userID',
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.update
  );

  router.delete(
    '/user/:userID',
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.delete
  );

  router.post(
    '/user/:userID',
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.reset
  );

  router.patch(
    '/user/:userID/variables',
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.updateVariables
  );

  // Legacy 1.0.0 routes with versionID in params
  router.post(
    '/:versionID/user/:userID/interact',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.interact
  );

  router.get(
    '/:versionID/user/:userID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.get
  );

  router.put(
    '/:versionID/user/:userID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.update
  );

  router.delete(
    '/:versionID/user/:userID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.delete
  );

  router.post(
    '/:versionID/user/:userID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.reset
  );

  router.patch(
    '/:versionID/user/:userID/variables',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateful.v1.updateVariables
  );

  return router;
};

const StatefulRouterV2Alpha = (middlewares: MiddlewareMap, controllers: ControllerMap) => {
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

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use('/v1/stateful', StatefulRouterV1(middlewares, controllers));
  router.use('/v2alpha/stateful', StatefulRouterV2Alpha(middlewares, controllers));

  return router;
};
