let selectedRow = null;
let selectedResidentId = null;

function getLoggedInStaffNumber() {
  // Use localStorage (set in index.html)
  return localStorage.getItem('StaffNumber');
}

// Fetch and display residents table (only residents assigned to this caregiver)
async function loadResidents(filterText = "") {
  const tbody = document.getElementById('residentTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Loading resident records...</td></tr>';
  const StaffNumber = getLoggedInStaffNumber();
  if (!StaffNumber) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const res = await fetch('/api/residents');
    if (!res.ok) throw new Error('Failed to fetch residents');
    let data = await res.json();

    // Only show residents assigned to this caregiver
    data = data.filter(row => row.AssignedCaregiver && row.AssignedCaregiver === StaffNumber);

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
      tbody.appendChild(tr);
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #d9534f;">Failed to load resident data. Please try again later.</td></tr>';
    console.error('Error loading residents:', e);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  loadResidents();
  setTimeout(() => {
    document.getElementById('loaderOverlay').classList.remove('show');
  }, 1500);
});

const residentSearch = document.getElementById('residentSearch');
if (residentSearch) {
  residentSearch.addEventListener('input', function() {
    loadResidents(this.value);
  });
}

// Sidebar menu link loader animation
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