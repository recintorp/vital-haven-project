// Enhanced loader functions
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

const residentLink = document.getElementById('residentLink');
if (residentLink) {
  residentLink.addEventListener('click', function (e) {
    e.preventDefault();
    const targetUrl = this.getAttribute('href');
    showLoader();
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 800);
  });
}

// Sign out functionality
const signOutLink = document.getElementById('signOutLink');
if (signOutLink) {
  signOutLink.addEventListener('click', function (e) {
    e.preventDefault();
    showLoader();
    setTimeout(() => {
      window.location.href = 'Login.html';
    }, 800);
  });
}

// Enhanced dropdown functionality
const adminDropdown = document.querySelector('.admin-dropdown');
const dropdownMenu = adminDropdown ? adminDropdown.querySelector('.dropdown-menu') : null;

if (adminDropdown && dropdownMenu) {
  adminDropdown.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });
  document.addEventListener('click', function () {
    dropdownMenu.classList.remove('show');
  });
}

// Add active state to settings form sections when clicked
document.querySelectorAll('form.settings-form section').forEach(section => {
  section.addEventListener('click', function() {
    this.style.transform = 'translateY(-2px)';
    this.style.boxShadow = 'var(--shadow-md)';
    setTimeout(() => {
      this.style.transform = '';
      this.style.boxShadow = 'var(--shadow-sm)';
    }, 200);
  });
});

// Search functionality placeholder
const searchInput = document.querySelector('.search');
if (searchInput) {
  searchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    if(searchTerm.length > 2) {
      // In a real app, you would filter settings sections here
      console.log('Searching for:', searchTerm);
    }
  });
}

// --------- DARK MODE TOGGLE LOGIC ---------
function setDarkModeVars(enable) {
  if (enable) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('vh-darkmode', '1');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.removeItem('vh-darkmode');
  }
}
// On load, set dark mode from localStorage
document.addEventListener('DOMContentLoaded', function() {
  const darkModeCheckbox = document.getElementById('darkModeCheckbox');
  // Check stored preference
  if (localStorage.getItem('vh-darkmode') === '1') {
    document.body.classList.add('dark-mode');
    if (darkModeCheckbox) darkModeCheckbox.checked = true;
  } else {
    document.body.classList.remove('dark-mode');
    if (darkModeCheckbox) darkModeCheckbox.checked = false;
  }
  if (darkModeCheckbox) {
    darkModeCheckbox.addEventListener('change', function() {
      setDarkModeVars(this.checked);
    });
  }
});