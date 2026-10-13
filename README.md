# callgate

A small web app that manages one shared whitelist of phone numbers for a
voip.ms DID + Grandstream HT801 landline, for both incoming and outgoing
calls, plus a call log. 911 is always allowed outgoing and is not part of
the editable list.

## How it works

- **Incoming**: the DID's default routing is set to reject unmatched calls;
  one voip.ms CallerID Filtering rule per allowed number routes matching
  callers through to the HT801's sub-account. Anyone else gets rejected by
  voip.ms before it ever reaches the house.
- **Outgoing**: the HT801's FXS "Dial Plan" is regenerated from the same
  list (plus 911) and pushed to the device via provisioning. The device
  only dials numbers that match the plan — anything else is rejected by the
  ATA itself, with no dependency on this app being online at the moment of
  the call.
- Every edit queues a debounced sync (default 30s) so rapid edits don't
  each reboot the phone line. The voip.ms half applies on every sync pass;
  the HT801 is only touched (and therefore only reboots) if the actual set
  of numbers changed since the last successful apply.
- **Active hours** (optional, one daily window each for incoming/outgoing):
  outside the window, only numbers flagged "always allowed" still work; 911
  is never affected by this. A per-minute watcher
  (`schedule/watcher.ts`) checks for window transitions and only triggers a
  sync when the effective number set actually changes, so it doesn't poll
  voip.ms or touch the HT801 every minute. The HT801 provisioning endpoint
  also computes the schedule-aware dial plan fresh on every device pull, so
  the device gets the right state even on its own periodic poll, not only
  right after an app-triggered resync.

## One-time setup required before this works for real

Several integration details are **not fully confirmed from documentation**
(voip.ms's own API docs site blocks automated fetches; Grandstream doesn't
publish exact provisioning P-values) and need to be nailed down against the
real account/device. Do these in order:

1. **Whitelist this server's public IP in voip.ms**: Portal → Main Menu →
   SOAP & REST/JSON API → add the homelab's public IP, enable the API, and
   set an API password (not your portal login password).
2. **Confirm `getCallerIDFiltering`/`setCallerIDFiltering` param shapes**:
   call `getCallerIDFiltering` read-only first and inspect the response.
   Make one manual `setCallerIDFiltering` test with a throwaway number,
   re-`get` it to see the exact round-tripped fields, then
   `delCallerIDFiltering` it. Update `server/src/voipms/callerIdFiltering.ts`
   if the real field names differ from the current best-guess
   (`filter`/`routing`/`account:<subaccount>`).
3. **Confirm the DID's default routing mechanism** and that CallerID
   Filtering entries actually take precedence over it, before flipping the
   DID's default to reject-everything.
4. **Confirm `getCDR` param/field names and timestamp timezone** with a
   known date range; adjust `server/src/voipms/cdr.ts` if needed.
5. **Find the HT801's Dial Plan P-value**: HT801 web UI → Upgrade →
   "Download Device XML Configuration" once before and once after manually
   changing the FXS port's Dial Plan field by hand to a test value. Diff
   the two XML files to find the exact tag, then set
   `HT801_DIAL_PLAN_PVALUE` to it.
6. **Confirm resync vs. reboot behavior**: point the HT801's "Config Server
   Path" (its own web UI) at this app's `/provisioning/` endpoint, change
   the whitelist, and watch whether the device reboots and applies the new
   Dial Plan on its own. If not, `HT801_REQUIRES_EXPLICIT_REBOOT=true` and
   `server/src/ht801/reboot.ts` needs a real implementation (capture the
   exact web UI reboot request to replicate here).

## Rollout plan (avoid locking the kids out or breaking routing)

1. Deploy with the DID's current routing untouched - CRUD + call log work
   against the real API with zero risk to live calls.
2. Write down the DID's current routing config somewhere safe (e.g. this
   README's bottom section) as a manual fallback.
3. Add one throwaway test number through the app, confirm an unlisted
   number is rejected and the test number connects, *before* flipping the
   DID's default routing to reject-by-default.
4. Flip the DID default only after step 3 passes, then add the kids' real
   contacts.
5. Confirm 911 is always in the dial plan via the unit test in
   `server/src/ht801/dialPlan.test.ts` and/or the HT801's own effective
   dial-plan display - don't place a real test call to 911.
6. Test outgoing: one allowed number dials out, an unlisted number is
   rejected by the ATA itself.
7. Watch the call log's "Allowed?" column for a few days post-cutover.

## Manual fallback

If this app or its sync ever misbehaves, voip.ms routing can be restored by
hand in under a minute: **Portal → DIDs → [the number] → Routing → set back
to `<fill in the DID's routing value here before step 4 above>`.**

## Environment variables

See `server/.env.example` for the full list. Secrets go in the homelab's
`/home/andrew/docker/.env`, never in this repo.

## Deploying

```
ssh 192.168.219.100
git clone https://github.com/avens19/callgate.git /home/andrew/git/callgate
# add the env vars from server/.env.example to /home/andrew/docker/.env
# paste deploy/docker-compose.snippet.yml into /home/andrew/docker/docker-compose.yml
# paste deploy/Caddyfile.snippet into /home/andrew/.caddy/conf/Caddyfile
mkdir -p /home/andrew/.callgate
cd /home/andrew/docker
docker compose up -d --build callgate
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```
