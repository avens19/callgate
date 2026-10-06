import { Router } from 'express';
import * as allowedNumbers from '../db/allowedNumbers.repo';
import { requestSync, syncImmediately } from '../sync/orchestrator';
import { EMERGENCY_NUMBER } from '../ht801/dialPlan';

export const numbersRouter = Router();

function normalizeNumber(raw: unknown): string {
  if (typeof raw !== 'string') throw new Error('number is required');
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length < 7 || digits.length > 15) {
    throw new Error('number must be 7-15 digits');
  }
  return digits;
}

numbersRouter.get('/', (_req, res) => {
  res.json(allowedNumbers.listAll());
});

numbersRouter.post('/', (req, res) => {
  try {
    const number = normalizeNumber(req.body?.number);
    if (number === EMERGENCY_NUMBER) {
      throw new Error('911 is always allowed and does not need to be added');
    }
    const label = typeof req.body?.label === 'string' ? req.body.label.trim() || null : null;
    const created = allowedNumbers.insert(number, label);
    requestSync();
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

numbersRouter.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const number = normalizeNumber(req.body?.number);
    const label = typeof req.body?.label === 'string' ? req.body.label.trim() || null : null;
    const updated = allowedNumbers.update(id, number, label);
    if (!updated) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    requestSync();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

numbersRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  allowedNumbers.remove(id);
  requestSync();
  res.status(204).end();
});

numbersRouter.post('/sync-now', (_req, res) => {
  syncImmediately()
    .then(() => res.json({ ok: true }))
    .catch((err) => res.status(500).json({ error: (err as Error).message }));
});
