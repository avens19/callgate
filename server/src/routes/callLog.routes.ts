import { Router } from 'express';
import * as callLog from '../db/callLog.repo';

export const callLogRouter = Router();

callLogRouter.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const before = req.query.before ? Number(req.query.before) : undefined;
  res.json(callLog.listRecent(limit, before));
});
