import { Router } from 'express';
import * as syncState from '../db/syncState.repo';

export const statusRouter = Router();

statusRouter.get('/', (_req, res) => {
  res.json(syncState.get());
});
