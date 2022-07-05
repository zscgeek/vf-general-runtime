import bodyParser from '@voiceflow/body-parser';
import express from 'express';

import { BODY_PARSER_SIZE_LIMIT } from '@/backend/constants';
import { ControllerMap, MiddlewareMap } from '@/lib';

const StatelessRouterV1 = (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.json({ limit: BODY_PARSER_SIZE_LIMIT }));
  router.use(middlewares.rateLimit.verify);

  router.get(
    '/state',
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateless.v1.state
  );

  router.post(
    '/',
    middlewares.rateLimit.versionConsume,
    middlewares.project.attachID,
    controllers.stateless.v1.handler
  );

  // Legacy 1.0.0 routes with versionID in params
  router.get(
    '/:versionID/state',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    controllers.stateless.v1.state
  );

  router.post(
    '/:versionID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    controllers.stateless.v1.handler
  );

  return router;
};

const StatelessRouterV2Alpha = (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.json({ limit: BODY_PARSER_SIZE_LIMIT }));
  router.use(middlewares.rateLimit.verify);

  // TODO may remove this functionality
  router.get(
    '/:versionID/state',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    controllers.stateless.v2alpha.state
  );

  router.post(
    '/:versionID',
    middlewares.project.unifyVersionID,
    middlewares.rateLimit.versionConsume,
    controllers.stateless.v2alpha.handler
  );

  return router;
};

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use('/v1/stateless', StatelessRouterV1(middlewares, controllers));
  router.use('/v2alpha/stateless', StatelessRouterV2Alpha(middlewares, controllers));

  return router;
};
