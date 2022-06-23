import express from 'express';

import { redirect } from './utils';

const REDIRECT_PREFIX = '/stateful/v1';
export default () => {
  const router = express.Router();

  router.post('/user/:userID/interact', redirect(`${REDIRECT_PREFIX}/user/:userID/interact`));

  router.get('/user/:userID', redirect(`${REDIRECT_PREFIX}/user/:userID`));

  router.put('/user/:userID', redirect(`${REDIRECT_PREFIX}/user/:userID`));

  router.delete('/user/:userID', redirect(`${REDIRECT_PREFIX}/user/:userID`));

  router.post('/user/:userID', redirect(`${REDIRECT_PREFIX}/user/:userID`));

  router.patch('/user/:userID/variables', redirect(`${REDIRECT_PREFIX}/user/:userID/variables`));

  router.post('/:versionID/user/:userID/interact', redirect(`${REDIRECT_PREFIX}/:versionID/user/:userID/interact`));

  router.get('/:versionID/user/:userID', redirect(`${REDIRECT_PREFIX}/:versionID/user/:userID`));

  router.put('/:versionID/user/:userID', redirect(`${REDIRECT_PREFIX}/:versionID/user/:userID`));

  router.delete('/:versionID/user/:userID', redirect(`${REDIRECT_PREFIX}/:versionID/user/:userID`));

  router.post('/:versionID/user/:userID', redirect(`${REDIRECT_PREFIX}/:versionID/user/:userID`));

  router.patch('/:versionID/user/:userID/variables', redirect(`${REDIRECT_PREFIX}/:versionID/user/:userID/variables`));

  return router;
};
