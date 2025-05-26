// Navigation loading overlay logic
document.querySelectorAll('a.menu-link').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const targetUrl = this.getAttribute('href');
    document.getElementById('loaderOverlay').classList.add('show');
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 800);
  });
});

const residentLink = document.getElementById('residentLink');
if (residentLink) {
  residentLink.addEventListener('click', function (e) {
    e.preventDefault();
    const targetUrl = this.getAttribute('href');
    document.getElementById('loaderOverlay').classList.add('show');
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 800);
  });
}

const signOutLink = document.getElementById('signOutLink');
if (signOutLink) {
  signOutLink.addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('loaderOverlay').classList.add('show');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);
  });
}

// Log fetch and display logic
async function fetchAndRenderLogs(filter = '') {
  const logListContainer = document.getElementById('logListContainer');
  logListContainer.innerHTML = `
    <div class="loading-logs" style="color:#888;">
      <i class="fas fa-spinner fa-spin"></i> Loading system logs...
    </div>
  `;

  try {
    const res = await fetch('/api/activity-log');
    if (!res.ok) throw new Error('Failed to fetch logs');
    const logs = await res.json();

    let filteredLogs = logs;
    if (filter && filter.trim()) {
      const f = filter.trim().toLowerCase();
      filteredLogs = logs.filter(log =>
        (log.StaffNumber && log.StaffNumber.toLowerCase().includes(f)) ||
        (log.Activity && log.Activity.toLowerCase().includes(f)) ||
        (log.Details && log.Details.toLowerCase().includes(f)) ||
        (log.Timestamp && new Date(log.Timestamp).toLocaleString().toLowerCase().includes(f))
      );
    }

    if (!filteredLogs.length) {
      logListContainer.innerHTML = '<div class="empty-logs" style="color:#888;padding:32px;text-align:center;">No logs found matching your criteria.</div>';
      return;
    }

    logListContainer.innerHTML = filteredLogs.map(log => `
      <div class="log-item" style="border-bottom:1px solid #e4e8c7;padding:15px 0;">
        <div class="log-header" style="display: flex; justify-content: space-between; align-items: baseline;">
          <div>
            <span class="log-staff" style="color:#7ba757;font-weight:600;">${log.StaffNumber || 'System'}</span>
            <span class="log-activity" style="color:#333;font-weight:500;margin-left:7px;">${log.Activity || 'Activity'}</span>
          </div>
          <div class="log-timestamp" style="font-size:12px;color:#888;">
            <i class="far fa-clock"></i> ${new Date(log.Timestamp).toLocaleString()}
          </div>
        </div>
        ${log.Details ? `<div class="log-details" style="margin-left:14px;color:#444;font-size:14px;margin-top:3px;">${log.Details}</div>` : ''}
      </div>
    `).join('');
  } catch (e) {
    logListContainer.innerHTML = `
      <div class="empty-logs" style="color: #d9534f; padding:32px;">
        <i class="fas fa-exclamation-triangle"></i> Failed to load logs. Please try again later.
      </div>
    `;
    console.error('Error loading logs:', e);
  }
}

// Search filter logic
const logSearchInput = document.getElementById('logSearchInput');
if (logSearchInput) {
  logSearchInput.addEventListener('input', function() {
    fetchAndRenderLogs(this.value);
  });
}

// Refresh button
const refreshLogs = document.getElementById('refreshLogs');
if (refreshLogs) {
  refreshLogs.addEventListener('click', function() {
    fetchAndRenderLogs(logSearchInput ? logSearchInput.value : '');
  });
}

// Export button (basic implementation)
const exportLogs = document.getElementById('exportLogs');
if (exportLogs) {
  exportLogs.addEventListener('click', async function() {
    try {
      const res = await fetch('/api/activity-log');
      if (!res.ok) throw new Error('Failed to fetch logs for export');
      const logs = await res.json();

      // Simple CSV export
      const headers = ['Timestamp', 'Staff Number', 'Activity', 'Details'];
      const csvRows = [
        headers.join(','),
        ...logs.map(log =>
          `"${new Date(log.Timestamp).toLocaleString()}","${log.StaffNumber || ''}","${log.Activity || ''}","${(log.Details || '').replace(/"/g, '""')}"`
        )
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vitalhaven-logs-${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Failed to export logs. Please try again later.');
      console.error('Export error:', e);
    }
  });
}

// Initial load
document.addEventListener('DOMContentLoaded', function() {
  fetchAndRenderLogs();
  setTimeout(() => {
    document.getElementById('loaderOverlay').classList.remove('show');
  }, 800);
});