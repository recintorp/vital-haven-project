document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('confirmationModal');
  const cancelConfirmBtn = document.getElementById('cancelConfirm');
  const confirmSubmitBtn = document.getElementById('confirmSubmit');
  const form = document.getElementById('residentForm');
  const responseMessage = document.getElementById('responseMessage');
  const fileInput = document.getElementById('medicalFile');
  const fileInfo = document.getElementById('fileInfo');
  const fileNameDisplay = document.getElementById('fileName');
  const removeFileBtn = document.getElementById('removeFile');
  const assignedCaregiverSelect = document.getElementById('assignedCaregiver');
  const currentFileDiv = document.getElementById('currentFile');
  const currentFileLink = document.getElementById('currentFileLink');
  const fullname = document.getElementById('fullname');
  const dateOfBirth = document.getElementById('dateOfBirth');
  const contactNo = document.getElementById('contactNo');
  let existingFilePath = null;

  // Get resident ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const residentId = urlParams.get('id');
  if (!residentId) {
    alert('No resident selected for editing.');
    window.location.href = 'residents.html';
    return;
  }

  // Populate caregivers dropdown from the API
  fetch('/api/caregivers')
    .then(res => res.json())
    .then(data => {
      assignedCaregiverSelect.innerHTML = '<option value="">Select a caregiver</option>';
      data.forEach(cg => {
        if (cg.StaffNumber)
          assignedCaregiverSelect.innerHTML += `<option value="${cg.StaffNumber}">${cg.StaffNumber}${cg.Fullname ? ' - ' + cg.Fullname : ''}</option>`;
      });
    });

  // Fetch current resident data and populate form
  fetch(`/api/residents/${residentId}`)
    .then(res => res.json())
    .then(data => {
      fullname.value = data.Fullname || '';
      dateOfBirth.value = data.DateOfBirth ? data.DateOfBirth.split('T')[0] : '';
      contactNo.value = data.ContactNo || '';
      // Set gender
      if (data.Gender) {
        const genderRadio = document.querySelector(`input[name="Gender"][value="${data.Gender}"]`);
        if (genderRadio) genderRadio.checked = true;
      }
      // Set assigned caregiver (wait for caregivers to load)
      const setCaregiver = () => {
        assignedCaregiverSelect.value = data.AssignedCaregiver || '';
      };
      if (assignedCaregiverSelect.options.length > 1) setCaregiver();
      else assignedCaregiverSelect.addEventListener('change', setCaregiver, { once: true });

      // Show current file
      if (data.MedicalFilePath) {
        existingFilePath = data.MedicalFilePath;
        const fileName = existingFilePath.split(/[\\/]/).pop();
        currentFileLink.textContent = fileName;
        currentFileLink.href = `/uploads/${fileName}`;
        currentFileDiv.style.display = 'block';
      }
    })
    .catch(() => {
      alert('Failed to load resident data.');
      window.location.href = 'residents.html';
    });

  // File upload display
  fileInput.addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
      fileNameDisplay.textContent = this.files[0].name;
      fileInfo.style.display = 'flex';
    } else {
      clearFileSelection();
    }
  });

  removeFileBtn && removeFileBtn.addEventListener('click', function() {
    clearFileSelection();
  });

  function clearFileSelection() {
    fileInput.value = '';
    fileNameDisplay.textContent = '';
    fileInfo.style.display = 'none';
  }

  function showModal() { modal.style.display = 'flex'; }
  function hideModal() { modal.style.display = 'none'; }

  function clearErrors() {
    document.querySelectorAll('.error').forEach(el => el.textContent = '');
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  }

  function validateForm() {
    let isValid = true;
    clearErrors();

    if (!fullname.value.trim()) {
      document.getElementById('fullnameError').textContent = 'Full name is required';
      fullname.classList.add('input-error');
      isValid = false;
    }
    if (!dateOfBirth.value) {
      document.getElementById('dateOfBirthError').textContent = 'Date of birth is required';
      dateOfBirth.classList.add('input-error');
      isValid = false;
    } else {
      const dob = new Date(dateOfBirth.value);
      const today = new Date();
      if (dob > today) {
        document.getElementById('dateOfBirthError').textContent = 'Date cannot be in the future';
        dateOfBirth.classList.add('input-error');
        isValid = false;
      }
    }
    const gender = document.querySelector('input[name="Gender"]:checked');
    if (!gender) {
      document.getElementById('genderError').textContent = 'Please select a gender';
      isValid = false;
    }
    // File is NOT required for update, but if present must be valid
    if (fileInput.files && fileInput.files.length > 0) {
      const fileSize = fileInput.files[0].size / 1024 / 1024;
      if (fileSize > 5) {
        document.getElementById('medicalInfoError').textContent = 'File size must be less than 5MB';
        isValid = false;
      }
    }
    if (!assignedCaregiverSelect.value) {
      document.getElementById('assignedCaregiverError').textContent = 'Assigned caregiver is required';
      assignedCaregiverSelect.classList.add('input-error');
      isValid = false;
    }
    return isValid;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!validateForm()) return;
    showModal();
  });

  confirmSubmitBtn.addEventListener('click', async function() {
    hideModal();
    const formData = new FormData();
    formData.append('Fullname', fullname.value.trim());
    formData.append('DateOfBirth', dateOfBirth.value);
    formData.append('Gender', document.querySelector('input[name="Gender"]:checked').value);
    formData.append('ContactNo', contactNo.value.trim() || '');
    formData.append('AssignedCaregiver', assignedCaregiverSelect.value);

    // Add file (optional)
    if (fileInput.files && fileInput.files.length > 0) {
      formData.append('MedicalFilePath', fileInput.files[0]);
    }

    try {
      responseMessage.textContent = 'Processing...';
      responseMessage.style.color = 'var(--text-medium)';
      const response = await fetch(`/api/residents/${residentId}`, {
        method: 'PUT',
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        responseMessage.textContent = 'Resident updated successfully!';
        responseMessage.style.color = 'var(--primary)';
        setTimeout(() => {
          window.location.href = 'residents.html';
        }, 1200);
      } else {
        responseMessage.textContent = result.message || 'Update failed. Please try again.';
        responseMessage.style.color = 'var(--error)';
        if (result.errors) {
          for (const [field, message] of Object.entries(result.errors)) {
            const errorElement = document.getElementById(`${field}Error`);
            if (errorElement) {
              errorElement.textContent = message;
              const inputElement = document.getElementById(field);
              if (inputElement) inputElement.classList.add('input-error');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      responseMessage.textContent = 'Network error. Please check your connection and try again.';
      responseMessage.style.color = 'var(--error)';
    }
  });

  cancelConfirmBtn.addEventListener('click', hideModal);

  // Set maximum date to today for date of birth
  const today = new Date().toISOString().split('T')[0];
  dateOfBirth.setAttribute('max', today);
});