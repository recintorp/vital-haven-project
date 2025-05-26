let selectedRow = null;
let selectedResidentId = null;

function showNotification(id) {
  const notification = document.getElementById(id);
  notification.classList.add('show');

  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideNotification(id);
  }, 5000);
}

function hideNotification(id) {
  document.getElementById(id).classList.remove('show');
}

function handleRowClick(event) {
  document.querySelectorAll('#residentTableBody tr').forEach(tr => tr.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  selectedRow = event.currentTarget;
  selectedResidentId = selectedRow.getAttribute('data-id');
}

// Fetch and display residents table
async function loadResidents(filterText = "") {
  const tbody = document.getElementById('residentTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Loading resident records...</td></tr>';

  try {
    const res = await fetch('/api/residents');
    if (!res.ok) throw new Error('Failed to fetch residents');
    let data = await res.json();

    // Filter if search text is provided
    if (filterText) {
      const search = filterText.toLowerCase();
      data = data.filter(row =>
        (row.Fullname && row.Fullname.toLowerCase().includes(search)) ||
        (row.DateOfBirth && row.DateOfBirth.toLowerCase().includes(search)) ||
        (row.Gender && row.Gender.toLowerCase().includes(search)) ||
        (row.ContactNo && row.ContactNo.toLowerCase().includes(search)) ||
        (row.AssignedCaregiver && row.AssignedCaregiver.toLowerCase().includes(search))
      );
    }

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">No resident records found.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    for (const row of data) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', row.ResidentID);

      // Format date of birth
      const dob = row.DateOfBirth ? new Date(row.DateOfBirth).toLocaleDateString() : '-';

      // Create medical file link if available
      let medicalFile = '-';
      if (row.MedicalFilePath) {
        const fileName = row.MedicalFilePath.split(/[\\/]/).pop();
        medicalFile = `<a href="/uploads/${fileName}" class="medical-file-link" target="_blank" download="${fileName}">${fileName}</a>`;
      }

      tr.innerHTML = `
        <td>${row.Fullname || '-'}</td>
        <td>${dob}</td>
        <td>${row.Gender || '-'}</td>
        <td>${medicalFile}</td>
        <td>${row.ContactNo || '-'}</td>
        <td>${row.AssignedCaregiver || '-'}</td>
      `;
      tr.addEventListener('click', handleRowClick);
      tbody.appendChild(tr);
    }
    selectedRow = null;
    selectedResidentId = null;
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #d9534f;">Failed to load resident data. Please try again later.</td></tr>';
    console.error('Error loading residents:', e);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Dark mode loader
  if (localStorage.getItem('vh-darkmode') === '1') {
    document.body.classList.add('dark-mode');
  }
  loadResidents();
  setTimeout(() => {
    document.getElementById('loaderOverlay').classList.remove('show');
  }, 1500);
});

document.getElementById('residentSearch').addEventListener('input', function() {
  loadResidents(this.value);
});

document.querySelector('.action-btn.edit').addEventListener('click', function() {
  if (!selectedResidentId) {
    showNotification('selectEditNotification');
    return;
  }
  window.location.href = `formedit2.html?id=${encodeURIComponent(selectedResidentId)}`;
});

// Delete functionality with modal
document.getElementById('deleteBtn').addEventListener('click', function() {
  if (!selectedResidentId) {
    showNotification('selectDeleteNotification');
    return;
  }
  document.getElementById('deleteModal').classList.add('show');
});

document.getElementById('cancelDelete').addEventListener('click', function() {
  document.getElementById('deleteModal').classList.remove('show');
});

document.getElementById('confirmDelete').addEventListener('click', async function() {
  document.getElementById('deleteModal').classList.remove('show');
  try {
    const res = await fetch(`/api/residents/${encodeURIComponent(selectedResidentId)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    showNotification('deleteSuccessNotification');
    selectedRow = null;
    selectedResidentId = null;
    loadResidents();
  } catch (err) {
    alert('Failed to delete resident record.');
  }
});

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