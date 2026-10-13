import express from 'express';
import path from 'node:path';
import { config } from './config';
import './db/connection'; // runs migrations as a side effect

import { numbersRouter } from './routes/numbers.routes';
import { callLogRouter } from './routes/callLog.routes';
import { statusRouter } from './routes/status.routes';
import { scheduleRouter } from './routes/schedule.routes';
import { provisioningRouter } from './routes/provisioning.routes';
import { healthzRouter } from './routes/healthz';
import { startCdrPoller } from './jobs/cdrPoller';
import { recoverPendingSyncOnBoot } from './sync/orchestrator';
import { startScheduleWatcher } from './schedule/watcher';

const app = express();
app.use(express.json());

app.use('/api/numbers', numbersRouter);
app.use('/api/call-log', callLogRouter);
app.use('/api/status', statusRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/provisioning', provisioningRouter);
app.use('/healthz', healthzRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.listen(config.port, () => {
  console.log(`callgate listening on :${config.port}`);
  recoverPendingSyncOnBoot();
  startCdrPoller();
  startScheduleWatcher();
});
