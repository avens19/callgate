import dgram from 'node:dgram';
import crypto from 'node:crypto';
import { config } from '../config';

/**
 * Fire-and-forget SIP NOTIFY with Event: resync, telling the HT801 to
 * re-check its provisioning server immediately instead of waiting for its
 * normal poll interval. This is unauthenticated SIP signaling, acceptable
 * only because the HT801 is LAN-only and this app's resync sender never
 * needs to run outside that LAN.
 *
 * Whether this alone causes the device to reboot and apply a changed Dial
 * Plan, or whether a separate reboot trigger is still needed, is unconfirmed
 * (spike #5 in the project plan).
 */
export async function sendResyncNotify(): Promise<void> {
  const branch = `z9hG4bK-${crypto.randomBytes(8).toString('hex')}`;
  const callId = crypto.randomBytes(16).toString('hex');
  const tag = crypto.randomBytes(6).toString('hex');
  const target = `sip:${config.ht801.ip}`;

  const message =
    `NOTIFY ${target} SIP/2.0\r\n` +
    `Via: SIP/2.0/UDP 0.0.0.0:0;branch=${branch}\r\n` +
    `Max-Forwards: 70\r\n` +
    `From: "callgate" <sip:callgate@callgate.local>;tag=${tag}\r\n` +
    `To: <${target}>\r\n` +
    `Call-ID: ${callId}\r\n` +
    `CSeq: 1 NOTIFY\r\n` +
    `Event: resync\r\n` +
    `Content-Length: 0\r\n\r\n`;

  await new Promise<void>((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    const buf = Buffer.from(message, 'utf8');
    socket.send(buf, config.ht801.sipPort, config.ht801.ip, (err) => {
      socket.close();
      if (err) reject(err);
      else resolve();
    });
  });
}
