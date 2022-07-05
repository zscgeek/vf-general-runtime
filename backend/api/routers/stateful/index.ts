import bodyParser from '@voiceflow/body-parser';
import express from 'express';

import { BODY_PARSER_SIZE_LIMIT } from '@/backend/constants';
import { ControllerMap, MiddlewareMap } from '@/lib';

import StatefulRouterV1 from './v1';
import StatefulRouterV2Alpha from './v2alpha';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use('/v1/stateful', StatefulRouterV1(middlewares, controllers));
  router.use('/v2alpha/stateful', StatefulRouterV2Alpha(middlewares, controllers));

  return router;
};
