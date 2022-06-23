import express from 'express';

import { redirect } from './utils';

// alias to /stateless/v1/

const REDIRECT_PREFIX = '/stateless/v1';
export default () => {
  const router = express.Router();

  router.get('/state', redirect(`${REDIRECT_PREFIX}/state`));

  router.get('/', redirect(`${REDIRECT_PREFIX}/`));

  router.get('/:versionID/state', redirect(`${REDIRECT_PREFIX}/:versionID/state`));

  router.post('/:versionID', redirect(`${REDIRECT_PREFIX}/:versionID`));

  return router;
};
