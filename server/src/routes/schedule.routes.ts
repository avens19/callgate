import { Router } from 'express';
import * as schedule from '../schedule/schedule.repo';
import { isValidHHMM } from '../schedule/clock';
import { resetWatcherState } from '../schedule/watcher';
import { requestSync } from '../sync/orchestrator';

export const scheduleRouter = Router();

scheduleRouter.get('/', (_req, res) => {
  res.json(schedule.get());
});

function parseTime(raw: unknown, fieldName: string): string {
  if (typeof raw !== 'string' || !isValidHHMM(raw)) {
    throw new Error(`${fieldName} must be in HH:MM 24-hour format`);
  }
  return raw;
}

scheduleRouter.put('/', (req, res) => {
  try {
    const updated = schedule.update({
      incomingEnabled: Boolean(req.body?.incomingEnabled),
      incomingStart: parseTime(req.body?.incomingStart, 'incomingStart'),
      incomingEnd: parseTime(req.body?.incomingEnd, 'incomingEnd'),
      outgoingEnabled: Boolean(req.body?.outgoingEnabled),
      outgoingStart: parseTime(req.body?.outgoingStart, 'outgoingStart'),
      outgoingEnd: parseTime(req.body?.outgoingEnd, 'outgoingEnd'),
    });
    // The watcher's own per-minute diff would otherwise wait up to 60s to
    // notice a settings change; force it to re-evaluate (and sync if
    // needed) right away.
    resetWatcherState();
    requestSync();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
