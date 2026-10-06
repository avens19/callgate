const statusBanner = document.getElementById('status-banner');
const numbersBody = document.querySelector('#numbers-table tbody');
const callLogBody = document.querySelector('#call-log-table tbody');
const addForm = document.getElementById('add-form');
const addLabel = document.getElementById('add-label');
const addNumber = document.getElementById('add-number');
const syncNowBtn = document.getElementById('sync-now-btn');

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
      <td><button class="delete-btn" data-id="${n.id}">Remove</button></td>
    `;
    numbersBody.appendChild(tr);
  }
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
      body: JSON.stringify({ number: addNumber.value, label: addLabel.value }),
    });
    addLabel.value = '';
    addNumber.value = '';
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

async function refreshAll() {
  await Promise.all([refreshStatus(), refreshNumbers(), refreshCallLog()]);
}

refreshAll();
setInterval(refreshAll, 10000);
