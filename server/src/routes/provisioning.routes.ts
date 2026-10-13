import { Router, Request } from 'express';
import { config } from '../config';
import * as allowedNumbers from '../db/allowedNumbers.repo';
import * as schedule from '../schedule/schedule.repo';
import { computeEffectiveNumbers } from '../schedule/effectiveNumbers';
import { currentTimeInZone } from '../schedule/clock';
import { buildProvisioningXml } from '../ht801/provisioning';
import { isIpInCidr } from '../lib/cidr';

export const provisioningRouter = Router();

function clientIp(req: Request): string {
  const raw = req.ip ?? req.socket.remoteAddress ?? '';
  return raw.replace(/^::ffff:/, '');
}

provisioningRouter.use((req, res, next) => {
  const ip = clientIp(req);
  if (!isIpInCidr(ip, config.provisioningAllowedCidr)) {
    res.status(403).send('forbidden');
    return;
  }
  next();
});

// The device requests, in order: cfg<MAC>.xml, cfg<MAC>, cfg<Model>.xml,
// cfg.xml. We serve the same content regardless of which name it asks for.
// Computed fresh from the current whitelist + schedule on every pull, so a
// periodic device poll always reflects "now" even without an app-triggered
// resync.
provisioningRouter.get(/^\/cfg.*$/, (_req, res) => {
  const settings = schedule.get();
  const nowHHMM = currentTimeInZone(config.displayTimezone);
  const effectiveOutgoing = computeEffectiveNumbers('outgoing', settings, allowedNumbers.listAll(), nowHHMM);
  const xml = buildProvisioningXml(effectiveOutgoing);
  res.type('application/xml').send(xml);
});
