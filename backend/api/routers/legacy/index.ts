import express from 'express';

import InteractRouter from './interact';
import StateRouter from './state';

export default () => {
  const router = express.Router();

  router.use('/interact', InteractRouter());
  router.use('/state', StateRouter());

  return router;
};
