const statusBanner = document.getElementById('status-banner');
const numbersBody = document.querySelector('#numbers-table tbody');
const callLogBody = document.querySelector('#call-log-table tbody');
const addForm = document.getElementById('add-form');
const addLabel = document.getElementById('add-label');
const addNumber = document.getElementById('add-number');
const addAlwaysAllowed = document.getElementById('add-always-allowed');
const syncNowBtn = document.getElementById('sync-now-btn');
const scheduleForm = document.getElementById('schedule-form');
const incomingEnabled = document.getElementById('incoming-enabled');
const incomingStart = document.getElementById('incoming-start');
const incomingEnd = document.getElementById('incoming-end');
const outgoingEnabled = document.getElementById('outgoing-enabled');
const outgoingStart = document.getElementById('outgoing-start');
const outgoingEnd = document.getElementById('outgoing-end');

const STATUS_TEXT = {
  idle: 'Up to date',
  pending: 'Changes queued, applying shortly…',
  applying: 'Applying changes — phone will briefly restart…',
  error: 'Sync failed',
};

async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function formatNumber(n) {
  const digits = n.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return n;
}

async function refreshStatus() {
  const status = await api('/api/status');
  statusBanner.className = `status status-${status.last_sync_status}`;
  let text = STATUS_TEXT[status.last_sync_status] || status.last_sync_status;
  if (status.last_sync_status === 'error' && status.last_sync_error) {
    text += `: ${status.last_sync_error}`;
  }
  statusBanner.textContent = text;
}

async function refreshNumbers() {
  const numbers = await api('/api/numbers');
  numbersBody.innerHTML = '';
  for (const n of numbers) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${n.label ? escapeHtml(n.label) : ''}</td>
      <td>${formatNumber(n.number)}</td>
      <td><input type="checkbox" class="always-allowed-toggle" ${n.always_allowed ? 'checked' : ''} /></td>
      <td><button class="delete-btn">Remove</button></td>
    `;
    const toggle = tr.querySelector('.always-allowed-toggle');
    toggle.dataset.id = n.id;
    toggle.dataset.number = n.number;
    toggle.dataset.label = n.label || '';
    tr.querySelector('.delete-btn').dataset.id = n.id;
    numbersBody.appendChild(tr);
  }
}

async function refreshSchedule() {
  const s = await api('/api/schedule');
  incomingEnabled.checked = Boolean(s.incoming_enabled);
  incomingStart.value = s.incoming_start;
  incomingEnd.value = s.incoming_end;
  outgoingEnabled.checked = Boolean(s.outgoing_enabled);
  outgoingStart.value = s.outgoing_start;
  outgoingEnd.value = s.outgoing_end;
}

async function refreshCallLog() {
  const rows = await api('/api/call-log?limit=50');
  callLogBody.innerHTML = '';
  for (const row of rows) {
    const tr = document.createElement('tr');
    const when = new Date(row.started_at).toLocaleString();
    const duration = row.duration_seconds != null ? `${row.duration_seconds}s` : '—';
    const allowedCell = row.was_allowed ? 'Yes' : '<span class="not-allowed">No</span>';
    tr.innerHTML = `
      <td>${when}</td>
      <td>${row.direction}</td>
      <td>${formatNumber(row.other_number)}</td>
      <td>${duration}</td>
      <td>${allowedCell}</td>
    `;
    callLogBody.appendChild(tr);
  }
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/numbers', {
      method: 'POST',
      body: JSON.stringify({
        number: addNumber.value,
        label: addLabel.value,
        alwaysAllowed: addAlwaysAllowed.checked,
      }),
    });
    addLabel.value = '';
    addNumber.value = '';
    addAlwaysAllowed.checked = false;
    await refreshNumbers();
    await refreshStatus();
  } catch (err) {
    alert(err.message);
  }
});

numbersBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  if (!confirm('Remove this number?')) return;
  await api(`/api/numbers/${btn.dataset.id}`, { method: 'DELETE' });
  await refreshNumbers();
  await refreshStatus();
});

numbersBody.addEventListener('change', async (e) => {
  const toggle = e.target.closest('.always-allowed-toggle');
  if (!toggle) return;
  try {
    await api(`/api/numbers/${toggle.dataset.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        number: toggle.dataset.number,
        label: toggle.dataset.label,
        alwaysAllowed: toggle.checked,
      }),
    });
    await refreshStatus();
  } catch (err) {
    alert(err.message);
    toggle.checked = !toggle.checked;
  }
});

scheduleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/schedule', {
      method: 'PUT',
      body: JSON.stringify({
        incomingEnabled: incomingEnabled.checked,
        incomingStart: incomingStart.value,
        incomingEnd: incomingEnd.value,
        outgoingEnabled: outgoingEnabled.checked,
        outgoingStart: outgoingStart.value,
        outgoingEnd: outgoingEnd.value,
      }),
    });
    await refreshStatus();
  } catch (err) {
    alert(err.message);
  }
});

syncNowBtn.addEventListener('click', async () => {
  syncNowBtn.disabled = true;
  try {
    await api('/api/numbers/sync-now', { method: 'POST' });
  } catch (err) {
    alert(err.message);
  } finally {
    syncNowBtn.disabled = false;
    await refreshStatus();
  }
});

let scheduleLoaded = false;

async function refreshAll() {
  const tasks = [refreshStatus(), refreshNumbers(), refreshCallLog()];
  // Only load schedule once: re-overwriting the form on every poll would
  // clobber in-progress edits before the user hits Save.
  if (!scheduleLoaded) {
    tasks.push(refreshSchedule().then(() => { scheduleLoaded = true; }));
  }
  await Promise.all(tasks);
}

refreshAll();
setInterval(refreshAll, 10000);
