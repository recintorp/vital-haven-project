// On load, apply dark mode if enabled in localStorage
if (localStorage.getItem('vh-darkmode') === '1') {
  document.body.classList.add('dark-mode');
}

// Sidebar navigation with loader overlay
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

// Resident Summary Panel link
document.getElementById('residentLink').addEventListener('click', function (e) {
  e.preventDefault();
  const targetUrl = this.getAttribute('href');
  document.getElementById('loaderOverlay').classList.add('show');
  setTimeout(() => {
    window.location.href = targetUrl;
  }, 800);
});

// Sign Out redirection with loader
document.getElementById('signOutLink').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('loaderOverlay').classList.add('show');
  setTimeout(() => {
    window.location.href = 'Login.html';
  }, 800);
});

// Inbox button click handler
document.getElementById('inboxButton').addEventListener('click', function () {
  document.getElementById('loaderOverlay').classList.add('show');
  setTimeout(() => {
    window.location.href = 'Inbox.html';
  }, 800);
});

// Admin dropdown toggle
const adminDropdown = document.getElementById('adminDropdown');
const dropdownMenu = adminDropdown.querySelector('.dropdown-menu');

adminDropdown.addEventListener('click', function (e) {
  e.stopPropagation();
  dropdownMenu.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
  if (!adminDropdown.contains(e.target)) {
    dropdownMenu.classList.remove('show');
  }
});

// Mark current menu item as active
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const menuItems = document.querySelectorAll('.menu-item');

menuItems.forEach(item => {
  const link = item.closest('a');
  if (link && link.getAttribute('href') === currentPage) {
    item.classList.add('active');
  }
});

// Focus search input when icon is clicked
document.querySelector('.search-icon').addEventListener('click', function() {
  document.querySelector('.search').focus();
});

// ---- DYNAMIC STATS SECTION ----
async function updateStats() {
  // Active Residents
  let residentCount = 0;
  let residentLastMonth = 0;
  try {
    const res = await fetch('/api/residents');
    const data = await res.json();
    residentCount = data.length;
    residentLastMonth = Math.max(1, Math.round(residentCount / 1.05)); // Simulated, replace with real query if needed
    document.getElementById('residentCount').textContent = residentCount;
    const percent = residentLastMonth
      ? Math.round(((residentCount - residentLastMonth) / residentLastMonth) * 100)
      : 0;
    document.getElementById('residentChange').innerHTML =
      `<i class="fas fa-arrow-up"></i> ${percent}% from last month`;
  } catch (e) {
    document.getElementById('residentCount').textContent = '—';
    document.getElementById('residentChange').innerHTML =
      `<i class="fas fa-minus"></i> N/A`;
  }

  // Caregivers On Duty
  let caregiverCount = 0;
  try {
    const res = await fetch('/api/caregivers');
    const data = await res.json();
    caregiverCount = data.length;
    document.getElementById('caregiverCount').textContent = caregiverCount;
    document.getElementById('caregiverChange').innerHTML =
      `<i class="fas fa-arrow-up"></i> ${caregiverCount} today`;
  } catch (e) {
    document.getElementById('caregiverCount').textContent = '—';
    document.getElementById('caregiverChange').innerHTML =
      `<i class="fas fa-minus"></i> N/A`;
  }

  // Inbox Messages
  let inboxCount = 0;
  try {
    const res = await fetch('/api/emails');
    const data = await res.json();
    inboxCount = data.length;
    document.getElementById('inboxCount').textContent = inboxCount;
    document.getElementById('inboxChange').innerHTML =
      `<i class="fas fa-arrow-up"></i> ${inboxCount} new`;

    // Update inbox count in sidebar, notification badge, and button
    document.getElementById('sidebarInboxCount').textContent = `${inboxCount} new messages`;
    document.getElementById('notifInboxCount').textContent = inboxCount;
    document.getElementById('inboxBtnCount').textContent = inboxCount;
  } catch (e) {
    document.getElementById('inboxCount').textContent = '—';
    document.getElementById('inboxChange').innerHTML =
      `<i class="fas fa-minus"></i> N/A`;
    document.getElementById('sidebarInboxCount').textContent = `Inbox`;
    document.getElementById('notifInboxCount').textContent = '0';
    document.getElementById('inboxBtnCount').textContent = '0';
  }
}

document.addEventListener('DOMContentLoaded', updateStats);