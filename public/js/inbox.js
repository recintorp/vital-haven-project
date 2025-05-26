// Utility functions
function showNotification(id) {
  const notification = document.getElementById(id);
  notification.classList.add('show');
  setTimeout(() => {
    hideNotification(id);
  }, 5000);
}
function hideNotification(id) {
  document.getElementById(id).classList.remove('show');
}

// Navigation and dropdown functionality
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

// Email loading and management
let currentEmails = [];

async function loadEmails(filterText = "") {
  const emailList = document.getElementById('emailList');
  const emailContent = document.getElementById('emailContent');
  
  emailList.innerHTML = '<div class="empty-state">Loading emails...</div>';
  emailContent.innerHTML = '<div class="empty-state">Loading...</div>';

  try {
    const res = await fetch('/api/emails');
    if (!res.ok) throw new Error('Failed to fetch emails');
    let emails = await res.json();

    // Filter emails if search text is provided
    if (filterText) {
      const search = filterText.toLowerCase();
      emails = emails.filter(email => 
        (email.EmailID && email.EmailID.toString().includes(search)) ||
        (email.Body && email.Body.toLowerCase().includes(search))
      );
    }
    currentEmails = emails;

    if (!currentEmails.length) {
      emailList.innerHTML = '<div class="empty-state">No emails found</div>';
      emailContent.innerHTML = '<div class="empty-state">No emails available</div>';
      return;
    }

    emailList.innerHTML = currentEmails.map(email => `
      <div class="email-row" data-id="${email.EmailID}">
        <div class="email-info">
          <div class="email-id">Request #${email.EmailID}</div>
          <div class="preview">${email.Body.replace(/\n/g, ' ').slice(0, 60)}${email.Body.length > 60 ? '...' : ''}</div>
        </div>
        <button class="delete-btn" data-id="${email.EmailID}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');

    // Click handler for email rows
    Array.from(document.getElementsByClassName('email-row')).forEach(row => {
      row.addEventListener('click', function(e) {
        // Don't trigger row click if delete button was clicked
        if (e.target.closest('.delete-btn')) return;

        // Remove selected class from all rows
        Array.from(document.getElementsByClassName('email-row')).forEach(r =>
          r.classList.remove('selected'));
        // Add selected class to clicked row
        this.classList.add('selected');

        // Find and display the selected email
        const email = currentEmails.find(e => e.EmailID == this.dataset.id);
        emailContent.innerHTML = `
          <h2>Request #${email.EmailID}</h2>
          <pre>${email.Body}</pre>
        `;
      });
    });

    // Add click handlers for delete buttons
    Array.from(document.getElementsByClassName('delete-btn')).forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const emailId = this.getAttribute('data-id');
        showDeleteModal(emailId);
      });
    });

    // Auto-select first email if available
    document.querySelector('.email-row')?.click();
  } catch (err) {
    console.error('Error loading emails:', err);
    emailList.innerHTML = '<div class="empty-state" style="color:#d9534f;">Failed to load emails</div>';
    emailContent.innerHTML = '<div class="empty-state" style="color:#d9534f;">Error loading content</div>';
  }
}

// Delete functionality
let emailToDelete = null;
function showDeleteModal(emailId) {
  emailToDelete = emailId;
  document.getElementById('deleteModal').classList.add('show');
}

const cancelDeleteBtn = document.getElementById('cancelDelete');
if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener('click', function() {
    document.getElementById('deleteModal').classList.remove('show');
    emailToDelete = null;
  });
}

const confirmDeleteBtn = document.getElementById('confirmDelete');
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', async function() {
    document.getElementById('deleteModal').classList.remove('show');
    try {
      const res = await fetch(`/api/emails/${emailToDelete}`, { 
        method: 'DELETE' 
      });
      if (!res.ok) throw new Error('Delete failed');
      showNotification('deleteSuccessNotification');
      loadEmails(document.getElementById('emailSearch').value);
      emailToDelete = null;
    } catch (err) {
      console.error('Error deleting email:', err);
      alert('Failed to delete email. Please try again.');
    }
  });
}

// Load emails on page load
document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('vh-darkmode') === '1') {
    document.body.classList.add('dark-mode');
  }
  loadEmails();
  setTimeout(() => {
    document.getElementById('loaderOverlay').classList.remove('show');
  }, 1500);
});

// Add search functionality
const emailSearch = document.getElementById('emailSearch');
if (emailSearch) {
  emailSearch.addEventListener('input', function() {
    loadEmails(this.value);
  });
}