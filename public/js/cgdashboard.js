// --- Helper functions for storage ---
function getLoggedInStaffNumber() {
  return localStorage.getItem('StaffNumber');
}

// Fetch stats from backend
async function fetchAssignedResidents(StaffNumber) {
  const resp = await fetch(`/api/residents?assignedCaregiver=${encodeURIComponent(StaffNumber)}`);
  if (!resp.ok) return [];
  return await resp.json();
}
async function fetchMedications(StaffNumber) {
  const resp = await fetch(`/api/medications?staffNumber=${encodeURIComponent(StaffNumber)}`);
  if (!resp.ok) return [];
  return await resp.json();
}
async function fetchAssessments(StaffNumber) {
  const resp = await fetch(`/api/assessments?staffNumber=${encodeURIComponent(StaffNumber)}`);
  if (!resp.ok) return [];
  return await resp.json();
}
async function fetchCaregiver(StaffNumber) {
  const resp = await fetch('/api/caregivers/' + encodeURIComponent(StaffNumber));
  if (!resp.ok) throw new Error('Caregiver not found');
  return await resp.json();
}

function countMedicationsDue(medications) {
  const now = new Date();
  let due = 0;
  let overdue = 0;
  medications.forEach(med => {
    if (!med.LastAdministered) {
      let t = med.Time;
      if (t && t.includes('T')) t = t.split('T')[1];
      t = t ? t.replace('Z', '').split('.')[0] : '00:00';
      let [hour, minute] = t.split(':');
      hour = parseInt(hour, 10);
      minute = parseInt(minute, 10);
      const medTime = new Date(now);
      medTime.setHours(hour, minute, 0, 0);
      if (now >= medTime) {
        due++;
        if (now - medTime > 30 * 60 * 1000) overdue++;
      }
    }
  });
  return { due, overdue };
}
function countPendingMedications(medications) {
  let pending = 0;
  medications.forEach(med => {
    if (!med.LastAdministered) {
      let t = med.Time;
      if (t && t.includes('T')) t = t.split('T')[1];
      t = t ? t.replace('Z', '').split('.')[0] : '00:00';
      let [hour, minute] = t.split(':');
      hour = parseInt(hour, 10);
      minute = parseInt(minute, 10);
      const now = new Date();
      const medTime = new Date(now);
      medTime.setHours(hour, minute, 0, 0);
      if (now < medTime) pending++;
    }
  });
  return pending;
}

// --- UI/Loader events ---
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
const medicationLink = document.getElementById('medicationLink');
if (medicationLink) {
  medicationLink.addEventListener('click', function (e) {
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
    localStorage.removeItem('StaffNumber');
    document.getElementById('loaderOverlay').classList.add('show');
    setTimeout(() => {
      window.location.href = 'Login.html';
    }, 800);
  });
}
const tasksButton = document.getElementById('tasksButton');
if (tasksButton) {
  tasksButton.addEventListener('click', function () {
    document.getElementById('loaderOverlay').classList.add('show');
    setTimeout(() => {
      window.location.href = 'medtrck.html';
    }, 800);
  });
}
const caregiverDropdown = document.getElementById('caregiverDropdown');
const dropdownMenu = caregiverDropdown ? caregiverDropdown.querySelector('.dropdown-menu') : null;
if (caregiverDropdown && dropdownMenu) {
  caregiverDropdown.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });
  document.addEventListener('click', function (e) {
    if (!caregiverDropdown.contains(e.target)) {
      dropdownMenu.classList.remove('show');
    }
  });
}

const searchIcon = document.querySelector('.search-icon');
if (searchIcon) {
  searchIcon.addEventListener('click', function() {
    const searchInput = document.querySelector('.search');
    if (searchInput) searchInput.focus();
  });
}

// --- Main Dynamic Data Section ---
document.addEventListener('DOMContentLoaded', async function() {
  const StaffNumber = getLoggedInStaffNumber();
  if (!StaffNumber) {
    window.location.href = 'Login.html';
    return;
  }
  if (localStorage.getItem('vh-darkmode') === '1') {
    document.body.classList.add('dark-mode');
  }
  try {
    // Fetch all the needed data
    const [caregiver, residents, medications, assessments] = await Promise.all([
      fetchCaregiver(StaffNumber),
      fetchAssignedResidents(StaffNumber),
      fetchMedications(StaffNumber),
      fetchAssessments(StaffNumber)
    ]);

    // Mini profile
    document.getElementById('miniProfileName').textContent = caregiver.Fullname || '-';
    document.getElementById('miniProfileStaffId').textContent = `Staff ID: ${caregiver.StaffNumber || '-'}`;
    document.getElementById('miniProfileShift').textContent = `Shift: ${caregiver.Shift || '-'}`;
    document.getElementById('miniProfileAssigned').textContent = `Assigned Resident: ${caregiver.AssignedResident !== undefined ? caregiver.AssignedResident : '-'}`;

    // Top bar
    document.getElementById('caregiverFirstName').textContent = caregiver.Fullname ? caregiver.Fullname.split(' ')[0] : '-';

    // Greeting
    const firstName = caregiver.Fullname ? caregiver.Fullname.split(' ')[0] : '-';
    document.getElementById('dashboardGreeting').textContent = `Welcome Back, ${firstName}!`;

    // Assigned Residents stat - show AssignedResident from Caregivers table if present, else count from residents
    const assignedResidentCount = (caregiver.AssignedResident !== undefined && caregiver.AssignedResident !== null)
      ? caregiver.AssignedResident
      : residents.length;
    document.getElementById('statAssignedResidents').textContent = assignedResidentCount;

    // Remove resident name list below count in Assigned Residents
    document.getElementById('statAssignedList').textContent = '';

    // Medications Due stats
    const { due: medsDue, overdue: medsOverdue } = countMedicationsDue(medications);
    document.getElementById('statMedicationsDue').textContent = medsDue;
    document.getElementById('statMedicationsOverdue').innerHTML = `<i class="fas fa-exclamation-circle"></i> ${medsOverdue} overdue`;

    // Health Assessments stat - change title to Health Records, remove due by/line
    document.getElementById('healthAssessTitle').textContent = 'Health Records';
    document.getElementById('statHealthAssessments').textContent = assessments.length;
    var statAssessmentDue = document.getElementById('statAssessmentDue');
    if (statAssessmentDue) statAssessmentDue.remove();

    // Pending Medications stat
    document.getElementById('pendingMedsTitle').textContent = 'Pending Medications';
    const medsPending = countPendingMedications(medications);
    document.getElementById('statPendingMedications').textContent = medsPending;
    document.getElementById('statPendingLabel').textContent = `${medsPending} pending`;

    // Dashboard card pending message
    document.getElementById('dashboardTasks').textContent = `You have ${medsPending} pending medications.`;

    // Set notification badge to number of ResidentID that match the AssignedCaregiver
    document.getElementById('notificationBadge').textContent = residents.length;
  } catch (e) {
    window.location.href = 'Login.html';
  }
});