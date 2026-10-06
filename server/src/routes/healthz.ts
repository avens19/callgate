import { Router } from 'express';
import { db } from '../db/connection';

export const healthzRouter = Router();

healthzRouter.get('/', (_req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: (err as Error).message });
  }
});
