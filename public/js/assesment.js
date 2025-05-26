// Toast Notification
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  document.getElementById('toastMessage').textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Get logged-in staff number from localStorage
function getLoggedInStaffNumber() {
  return localStorage.getItem('StaffNumber');
}

// Populate the resident select dropdown with assigned residents
async function populateResidentSelect() {
  const staffNumber = getLoggedInStaffNumber();
  const residentSelect = document.getElementById('residentSelect');
  residentSelect.innerHTML = `<option value="">Please select a resident</option>`;
  if (!staffNumber) {
    residentSelect.innerHTML = `<option value="">Please log in</option>`;
    return;
  }
  try {
    const res = await fetch(`/api/residents?AssignedCaregiver=${encodeURIComponent(staffNumber)}`);
    if (!res.ok) throw new Error('Failed to fetch residents');
    const residents = await res.json();
    if (!residents.length) {
      residentSelect.innerHTML = `<option value="">No assigned residents</option>`;
      return;
    }
    let options = `<option value="">Please select a resident</option>`;
    for (const r of residents) {
      options += `<option value="${r.ResidentID}">${r.Fullname}</option>`;
    }
    residentSelect.innerHTML = options;
  } catch (e) {
    residentSelect.innerHTML = `<option value="">Failed to load residents</option>`;
  }
}

// Update date/time field
function updateDateTime() {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  document.getElementById('assessmentDate').value = formattedDate;
}

// Load assessments for this caregiver's assigned residents
async function loadAssessments(filterText = "") {
  const staffNumber = getLoggedInStaffNumber();
  const log = document.getElementById('assessmentLog');
  log.innerHTML = '<div class="log-item"><div class="log-item-header">Loading assessments...</div></div>';
  if (!staffNumber) {
    log.innerHTML = '<div class="log-item"><div class="log-item-header">Please log in</div></div>';
    return;
  }
  try {
    let url = `/api/assessments?staffNumber=${encodeURIComponent(staffNumber)}`;
    if (filterText && filterText.trim()) url += `&q=${encodeURIComponent(filterText)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch assessments');
    const assessments = await res.json();
    renderAssessmentsLog(assessments);
  } catch (e) {
    log.innerHTML = '<div class="log-item"><div class="log-item-header">Failed to load assessments</div></div>';
  }
}

// Render the recent assessments log
function renderAssessmentsLog(assessments) {
  const log = document.getElementById('assessmentLog');
  if (!assessments.length) {
    log.innerHTML = '<div class="log-item"><div class="log-item-header">No assessments found</div></div>';
    return;
  }
  let html = '';
  for (const a of assessments) {
    const date = new Date(a.AssessmentDate || a.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const notesPreview = a.Notes ? (a.Notes.length > 150 ? a.Notes.substring(0, 150) + '...' : a.Notes) : '';
    html += `
      <div class="log-item" data-id="${a.AssessmentID || a.id}">
        <div class="log-item-header">
          <span class="log-resident">${a.Fullname || a.residentName}</span>
          <span class="log-date">${formattedDate}</span>
        </div>
        <div class="log-content">${notesPreview}</div>
      </div>
    `;
  }
  log.innerHTML = html;
  addLogItemEventListeners(assessments);
}

// Add click event listeners to log items for modal viewing
function addLogItemEventListeners(assessments) {
  const items = document.querySelectorAll('.log-item');
  items.forEach((item, idx) => {
    item.addEventListener('click', () => {
      const a = assessments[idx];
      openViewAssessmentModal(a);
    });
  });
}

// Open modal to view assessment details
function openViewAssessmentModal(assessment) {
  document.getElementById('viewResidentName').value = `${assessment.Fullname || assessment.residentName}`;
  const date = new Date(assessment.AssessmentDate || assessment.date);
  document.getElementById('viewAssessmentDate').value = date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  document.getElementById('viewAssessmentNotes').value = assessment.Notes || assessment.notes || '';
  document.getElementById('viewAssessmentModal').classList.add('show');
}
document.getElementById('closeViewModal').onclick = () => document.getElementById('viewAssessmentModal').classList.remove('show');
document.getElementById('closeViewAssessment').onclick = () => document.getElementById('viewAssessmentModal').classList.remove('show');
document.getElementById('viewAssessmentModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('viewAssessmentModal')) document.getElementById('viewAssessmentModal').classList.remove('show');
});

// Save a new assessment to the backend
async function saveAssessment() {
  const residentId = document.getElementById('residentSelect').value;
  const notes = document.getElementById('assessmentNotes').value.trim();
  const staffNumber = getLoggedInStaffNumber();
  
  if (!residentId) {
    showToast('Please select a resident');
    return;
  }
  if (!notes) {
    showToast('Please enter assessment notes');
    return;
  }
  if (!staffNumber) {
    showToast('Please log in');
    return;
  }
  
  try {
    document.getElementById('loaderOverlay').classList.add('show');
    const data = {
      ResidentID: parseInt(residentId),
      StaffNumber: staffNumber,
      Notes: notes
    };
    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save assessment');
    
    document.getElementById('assessmentNotes').value = '';
    loadAssessments();
    showToast('Assessment saved successfully!');
  } catch(e) {
    showToast('Failed to save assessment. Please try again.');
  } finally {
    document.getElementById('loaderOverlay').classList.remove('show');
  }
}

// Search filter
document.getElementById('searchInput').addEventListener('input', function() {
  loadAssessments(this.value);
});

// Save assessment button
document.getElementById('saveAssessment').addEventListener('click', saveAssessment);

// Update date and time every minute
setInterval(updateDateTime, 60000);

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  updateDateTime();
  populateResidentSelect();
  loadAssessments();
  setTimeout(() => {
    document.getElementById('loaderOverlay').classList.remove('show');
  }, 1000);
});

// Sidebar menu loader animation
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