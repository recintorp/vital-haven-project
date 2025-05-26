// --- StaffNumber: Ensure StaffNumber is set from login/session ---
const StaffNumber = localStorage.getItem('StaffNumber');
if (!StaffNumber) {
  alert('Staff Number not found. Please log in again.');
  window.location.href = 'login.html';
}

let assignedResidents = [];
let medicationsData = [];
let currentMedication = null;
let medUpdateTimer = null;

// DOM elements
const medicationsTableBody = document.getElementById('medicationsTableBody');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshMedications');
const addMedicationBtn = document.getElementById('addMedication');
const medicationModal = document.getElementById('medicationModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelMedicationBtn = document.getElementById('cancelMedication');
const saveMedicationBtn = document.getElementById('saveMedication');
const modalResidentSelect = document.getElementById('modalResidentSelect');
const medicationNameInput = document.getElementById('medicationName');
const medicationDosageInput = document.getElementById('medicationDosage');
const medicationTimeInput = document.getElementById('medicationTime');
const medicationFrequencyInput = document.getElementById('medicationFrequency');
const medicationPriorityInput = document.getElementById('medicationPriority');
const modalCheckbox = document.getElementById('modalCheckbox');

function formatTime12h(t) {
  if (!t) return '';
  if (t.includes('T')) t = t.split('T')[1];
  t = t.replace('Z', '').split('.')[0];
  let [hour, minute] = t.split(':');
  hour = parseInt(hour, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h}:${minute.padStart(2, '0')}${ampm}`;
}

async function fetchAssignedResidents() {
  try {
    const res = await fetch(`/api/residents?AssignedCaregiver=${encodeURIComponent(StaffNumber)}`);
    if (!res.ok) throw new Error("Failed to fetch residents");
    const data = await res.json();
    assignedResidents = data;
    renderResidentOptions();
  } catch (e) {
    assignedResidents = [];
    renderResidentOptions();
  }
}

function renderResidentOptions() {
  modalResidentSelect.innerHTML = "";
  if (!assignedResidents.length) {
    modalResidentSelect.innerHTML = `<option value="">No assigned residents</option>`;
    return;
  }
  assignedResidents.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.ResidentID;
    opt.textContent = r.Fullname;
    modalResidentSelect.appendChild(opt);
  });
}

async function fetchMedications(filterText = "") {
  let url = `/api/medications?staffNumber=${encodeURIComponent(StaffNumber)}`;
  if (filterText) url += `&q=${encodeURIComponent(filterText)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch medications");
    medicationsData = await res.json();
  } catch (e) {
    medicationsData = [];
  }
  renderMedicationsTable();
  startMedUpdateTimer();
}

function renderMedicationsTable() {
  if (!Array.isArray(medicationsData) || !medicationsData.length) {
    medicationsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">No medications scheduled for today.</td></tr>';
    return;
  }
  let tableHtml = '';
  const now = new Date();
  medicationsData.forEach(med => {
    let medTimeStr = med.Time;
    let displayTime = formatTime12h(medTimeStr);

    let [h, m] = (medTimeStr.includes('T') ? medTimeStr.split('T')[1] : medTimeStr).replace('Z','').split(':');
    h = parseInt(h, 10);
    m = parseInt(m, 10);
    const medTime = new Date(now);
    medTime.setHours(h, m, 0, 0);

    let medStatus = '';
    if (med.LastAdministered) {
      medStatus = 'completed';
    } else if (now >= medTime) {
      medStatus = 'due';
    } else {
      medStatus = 'pending';
    }

    let statusLabel = '';
    if (medStatus === 'completed') {
      statusLabel = `<span class="time-indicator"><i class="fas fa-check-circle"></i> Administered at ${med.LastAdministered ? new Date(med.LastAdministered).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}) : displayTime}</span>`;
    } else if (medStatus === 'due') {
      statusLabel = `<span class="time-indicator"><i class="fas fa-bell"></i> Due</span>`;
    } else {
      statusLabel = `<span class="time-indicator"><i class="fas fa-clock"></i> Pending</span>`;
    }

    tableHtml += `
      <tr data-id="${med.MedicationID}">
        <td>${med.Fullname || ''}</td>
        <td>${med.MedicationName}</td>
        <td>${med.Dosage}</td>
        <td>${displayTime}</td>
        <td>${med.Frequency ? med.Frequency.toUpperCase() : ''}</td>
        <td>
          <div class="status-badge status-${medStatus}">${medStatus}</div>
          ${statusLabel}
          <div class="priority-indicator priority-${med.Priority}"></div>
        </td>
      </tr>`;
  });
  medicationsTableBody.innerHTML = tableHtml;
  addTableRowEventListeners();
}

function startMedUpdateTimer() {
  if (medUpdateTimer) clearInterval(medUpdateTimer);
  medUpdateTimer = setInterval(renderMedicationsTable, 60 * 1000);
}

function addTableRowEventListeners() {
  const rows = medicationsTableBody.querySelectorAll('tr');
  rows.forEach(row => {
    row.addEventListener('click', () => {
      const medicationId = row.getAttribute('data-id');
      currentMedication = medicationsData.find(m => m.MedicationID == medicationId);
      openMedicationModal(currentMedication);
    });
  });
}

function openMedicationModal(medication = null) {
  if (medication) {
    currentMedication = medication;
    modalResidentSelect.value = medication.ResidentID;
    medicationNameInput.value = medication.MedicationName;
    medicationDosageInput.value = medication.Dosage;
    medicationTimeInput.value = (medication.Time.includes('T') ? medication.Time.split('T')[1].slice(0,5) : medication.Time.slice(0,5));
    medicationFrequencyInput.value = medication.Frequency;
    medicationPriorityInput.value = medication.Priority;
    modalCheckbox.classList.toggle('checked', !!medication.LastAdministered);
    document.querySelector('.modal-title').textContent = 'Edit Medication';
    saveMedicationBtn.textContent = 'Update';
  } else {
    currentMedication = null;
    modalResidentSelect.value = "";
    medicationNameInput.value = '';
    medicationDosageInput.value = '';
    medicationTimeInput.value = '';
    medicationFrequencyInput.value = 'daily';
    medicationPriorityInput.value = 'medium';
    modalCheckbox.classList.remove('checked');
    document.querySelector('.modal-title').textContent = 'Add Medication';
    saveMedicationBtn.textContent = 'Save';
  }
  medicationModal.classList.add('show');
}

function closeMedicationModal() {
  medicationModal.classList.remove('show');
  currentMedication = null;
}

async function saveMedication() {
  const ResidentID = modalResidentSelect.value;
  const MedicationName = medicationNameInput.value.trim();
  const Dosage = medicationDosageInput.value.trim();
  const Time = medicationTimeInput.value;
  const Frequency = medicationFrequencyInput.value;
  const Priority = medicationPriorityInput.value;
  const isCompleted = modalCheckbox.classList.contains('checked');
  const LastAdministered = isCompleted ? new Date().toISOString() : null;

  if (!ResidentID || !MedicationName || !Dosage || !Time) {
    alert('Please fill in all required fields');
    return;
  }

  const payload = {
    ResidentID,
    StaffNumber,
    MedicationName,
    Dosage,
    Time,
    Frequency,
    Priority,
    LastAdministered
  };

  if (currentMedication && currentMedication.MedicationID) {
    const res = await fetch(`/api/medications/${currentMedication.MedicationID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      await fetchMedications();
      closeMedicationModal();
    } else {
      alert("Failed to update medication.");
    }
  } else {
    const res = await fetch("/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      await fetchMedications();
      closeMedicationModal();
    } else {
      alert("Failed to add medication.");
    }
  }
}

modalCheckbox.addEventListener('click', () => {
  modalCheckbox.classList.toggle('checked');
});

closeModalBtn.addEventListener('click', closeMedicationModal);
cancelMedicationBtn.addEventListener('click', closeMedicationModal);
saveMedicationBtn.addEventListener('click', saveMedication);
refreshBtn.addEventListener('click', () => fetchMedications(searchInput.value));
addMedicationBtn.addEventListener('click', () => openMedicationModal());
searchInput.addEventListener('input', () => fetchMedications(searchInput.value));

medicationModal.addEventListener('click', (e) => {
  if (e.target === medicationModal) closeMedicationModal();
});

document.addEventListener('DOMContentLoaded', async function() {
  // Dark mode loader
  if (localStorage.getItem('vh-darkmode') === '1') {
    document.body.classList.add('dark-mode');
  }
  await fetchAssignedResidents();
  await fetchMedications();
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