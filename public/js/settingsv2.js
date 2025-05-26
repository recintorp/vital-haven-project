// Alert functions
function showAlert(message, type) {
  const alertContainer = document.getElementById('alertContainer');
  const alertId = 'alert-' + Date.now();

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.id = alertId;

  const icon = document.createElement('i');
  icon.className = 'alert-icon fas ' +
    (type === 'success' ? 'fa-check-circle' :
      type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle');

  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;

  const closeBtn = document.createElement('span');
  closeBtn.className = 'alert-close';
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  closeBtn.onclick = () => hideAlert(alertId);

  alert.appendChild(icon);
  alert.appendChild(messageSpan);
  alert.appendChild(closeBtn);
  alertContainer.appendChild(alert);

  // Show alert with animation
  setTimeout(() => {
    alert.classList.add('show');
  }, 10);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideAlert(alertId);
  }, 5000);
}

function hideAlert(id) {
  const alert = document.getElementById(id);
  if (alert) {
    alert.classList.remove('show');
    setTimeout(() => {
      alert.remove();
    }, 400);
  }
}

// Loader functions
function showLoader() {
  document.getElementById('loaderOverlay').classList.add('show');
}
function hideLoader() {
  document.getElementById('loaderOverlay').classList.remove('show');
}

// Navigation with loader
document.querySelectorAll('a.menu-link').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const targetUrl = this.getAttribute('href');
    showLoader();
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 800);
  });
});
const medicationLink = document.getElementById('medicationLink');
if (medicationLink) {
  medicationLink.addEventListener('click', function (e) {
    e.preventDefault();
    const targetUrl = this.getAttribute('href');
    showLoader();
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 800);
  });
}
const signOutLink = document.getElementById('signOutLink');
if (signOutLink) {
  signOutLink.addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.removeItem('StaffNumber');
    showLoader();
    setTimeout(() => {
      window.location.href = 'Login.html';
    }, 800);
  });
}

// Dropdown functionality
const caregiverDropdown = document.getElementById('caregiverDropdown');
const dropdownMenu = caregiverDropdown ? caregiverDropdown.querySelector('.dropdown-menu') : null;
if (caregiverDropdown && dropdownMenu) {
  caregiverDropdown.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });
  document.addEventListener('click', function () {
    dropdownMenu.classList.remove('show');
  });
}

// Add active state to settings form sections when clicked
document.querySelectorAll('form.settings-form section').forEach(section => {
  section.addEventListener('click', function () {
    this.style.transform = 'translateY(-2px)';
    this.style.boxShadow = 'var(--shadow-md)';
    setTimeout(() => {
      this.style.transform = '';
      this.style.boxShadow = 'var(--shadow-sm)';
    }, 200);
  });
});

const searchInput = document.querySelector('.search');
if (searchInput) {
  searchInput.addEventListener('input', function (e) {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length > 2) {
      // In a real app, you would filter settings sections here
      console.log('Searching for:', searchTerm);
    }
  });
}

// Password field toggle (setup after DOM loaded)
document.addEventListener('DOMContentLoaded', function () {
  function setupPasswordToggle(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    btn.addEventListener('click', function () {
      if (input.type === 'password') {
        input.type = 'text';
        btn.querySelector('i').classList.remove('fa-eye');
        btn.querySelector('i').classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        btn.querySelector('i').classList.remove('fa-eye-slash');
        btn.querySelector('i').classList.add('fa-eye');
      }
    });
  }
  setupPasswordToggle('currentPassword', 'toggleCurrentPassword');
  setupPasswordToggle('newPassword', 'toggleNewPassword');
  setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');

  // Dark mode and Caregiver info
  const staffNumber = localStorage.getItem('StaffNumber');
  if (localStorage.getItem('vh-darkmode') === '1') {
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeCheckbox').checked = true;
  } else {
    document.body.classList.remove('dark-mode');
    document.getElementById('darkModeCheckbox').checked = false;
  }
  // Dark mode checkbox event
  document.getElementById('darkModeCheckbox').addEventListener('change', function () {
    if (this.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('vh-darkmode', '1');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.removeItem('vh-darkmode');
    }
  });

  // Set staff name and autofill current password
  if (staffNumber) {
    try {
      fetch('/api/caregivers/' + encodeURIComponent(staffNumber)).then(async resp => {
        if (resp.ok) {
          const caregiver = await resp.json();
          document.getElementById('caregiverFirstName').textContent = caregiver.Fullname ? caregiver.Fullname.split(' ')[0] : '-';
          if (caregiver.Password) {
            document.getElementById('currentPassword').value = caregiver.Password;
          }
        }
      });
    } catch (e) {
      document.getElementById('caregiverFirstName').textContent = '-';
    }
  }
  setTimeout(hideLoader, 800);
});

// Save form and update password in Caregivers table (send full object)
document.getElementById('settingsForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  showLoader();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const staffNumber = localStorage.getItem('StaffNumber');
  if (!currentPassword || !newPassword || !confirmPassword) {
    showAlert('Please complete all password fields.', 'error');
    hideLoader();
    return;
  }
  if (newPassword !== confirmPassword) {
    showAlert('New password and confirmation do not match.', 'error');
    hideLoader();
    return;
  }
  try {
    // 1. Fetch full caregiver object
    const resp = await fetch('/api/caregivers/' + encodeURIComponent(staffNumber));
    if (!resp.ok) throw new Error();
    const caregiver = await resp.json();
    // 2. Validate password
    if (caregiver.Password !== currentPassword) {
      showAlert('Current password is incorrect.', 'error');
      hideLoader();
      return;
    }
    // 3. Update password in object
    caregiver.Password = newPassword;
    // 4. PUT full caregiver object
    const updateResp = await fetch('/api/caregivers/' + encodeURIComponent(staffNumber), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Password: caregiver.Password,
        Fullname: caregiver.Fullname,
        ContactNo: caregiver.ContactNo,
        Email: caregiver.Email,
        AssignedResident: caregiver.AssignedResident,
        Shift: caregiver.Shift
      })
    });
    if (!updateResp.ok) throw new Error();
    showAlert('Settings saved successfully!', 'success');
  } catch {
    showAlert('Failed to update settings. Please try again.', 'error');
  }
  hideLoader();
});