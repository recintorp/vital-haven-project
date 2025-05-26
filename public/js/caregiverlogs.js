let selectedRow = null;
let selectedStaffNumber = null;
let showPasswords = false;

function handleRowClick(event) {
  document.querySelectorAll('#caregiverTableBody tr').forEach(tr => tr.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  selectedRow = event.currentTarget;
  selectedStaffNumber = selectedRow.getAttribute('data-staff');
}

// Fetch and display caregivers log table
async function loadCaregivers(filterText = "") {
  const tbody = document.getElementById('caregiverTableBody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">Loading caregiver access log...</td></tr>';

  try {
    const res = await fetch('/api/caregivers');
    if (!res.ok) throw new Error('Failed to fetch caregivers');
    let data = await res.json();

    // Filter if search text is provided
    if (filterText) {
      const search = filterText.toLowerCase();
      data = data.filter(row =>
        (row.StaffNumber && row.StaffNumber.toLowerCase().includes(search)) ||
        (row.Password && row.Password.toLowerCase().includes(search)) ||
        (row.Fullname && row.Fullname.toLowerCase().includes(search)) ||
        (row.ContactNo && row.ContactNo.toLowerCase().includes(search)) ||
        (row.Email && row.Email.toLowerCase().includes(search)) ||
        (row.AssignedResident && row.AssignedResident.toLowerCase().includes(search)) ||
        (row.Shift && row.Shift.toLowerCase().includes(search))
      );
    }

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">No caregiver access logs found.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    for (const row of data) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-staff', row.StaffNumber);
      tr.innerHTML = `
        <td>${row.StaffNumber || '-'}</td>
        <td class="password-cell" data-password="${row.Password || ''}"></td>
        <td>${row.Fullname || '-'}</td>
        <td>${row.ContactNo || '-'}</td>
        <td>${row.Email || '-'}</td>
        <td>${row.AssignedResident || '-'}</td>
        <td>${row.Shift || '-'}</td>
      `;
      tr.addEventListener('click', handleRowClick);
      tbody.appendChild(tr);
    }
    selectedRow = null;
    selectedStaffNumber = null;
    updatePasswordDisplay();
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #d9534f;">Failed to load caregiver data. Please try again later.</td></tr>';
    console.error('Error loading caregivers:', e);
  }
}

function updatePasswordDisplay() {
  document.querySelectorAll('.password-cell').forEach(cell => {
    const pw = cell.getAttribute('data-password');
    if (!pw) {
      cell.textContent = '-';
    } else if (showPasswords) {
      cell.textContent = pw;
    } else {
      cell.textContent = '•'.repeat(pw.length);
    }
  });
  const btn = document.getElementById('togglePasswordBtn');
  btn.textContent = showPasswords ? "Hide Passwords" : "Show Passwords";
  btn.innerHTML = `<i class="fas ${showPasswords ? 'fa-eye-slash' : 'fa-eye'}"></i> ${btn.textContent}`;
}

function loadCaregiversWithToggle(filterText = "") {
  loadCaregivers(filterText);
}

document.addEventListener('DOMContentLoaded', function() {
  // Dark mode loader
  if (localStorage.getItem('vh-darkmode') === '1') {
    document.body.classList.add('dark-mode');
  }
  loadCaregiversWithToggle();
  setTimeout(() => {
    document.getElementById('loaderOverlay').classList.remove('show');
  }, 1500);
});

document.getElementById('searchInput').addEventListener('input', function() {
  loadCaregiversWithToggle(this.value);
});

document.getElementById('togglePasswordBtn').addEventListener('click', function() {
  showPasswords = !showPasswords;
  updatePasswordDisplay();
});

document.querySelector('.action-btn.edit').addEventListener('click', function() {
  if (!selectedStaffNumber) {
    alert('Please select a caregiver row to edit.');
    return;
  }
  window.location.href = `formedit.html?staffNumber=${encodeURIComponent(selectedStaffNumber)}`;
});

// Delete functionality with modal
document.getElementById('deleteBtn').addEventListener('click', function() {
  if (!selectedStaffNumber) {
    alert('Please select a caregiver row to delete.');
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
    const res = await fetch(`/api/caregivers/${encodeURIComponent(selectedStaffNumber)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    alert('Caregiver record deleted successfully.');
    selectedRow = null;
    selectedStaffNumber = null;
    loadCaregiversWithToggle();
  } catch (err) {
    alert('Failed to delete caregiver record.');
  }
});

document.getElementById('residentLink').addEventListener('click', function (e) {
  e.preventDefault();
  const targetUrl = this.getAttribute('href');
  document.getElementById('loaderOverlay').classList.add('show');
  setTimeout(() => {
    window.location.href = targetUrl;
  }, 800);
});