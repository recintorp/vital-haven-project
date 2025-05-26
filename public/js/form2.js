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

  // Populate caregivers dropdown from the API
  fetch('/api/caregivers')
    .then(res => res.json())
    .then(data => {
      assignedCaregiverSelect.innerHTML = '<option value="">Select a caregiver</option>';
      data.forEach(cg => {
        if (cg.StaffNumber)
          assignedCaregiverSelect.innerHTML += `<option value="${cg.StaffNumber}">${cg.StaffNumber}${cg.Fullname ? ' - ' + cg.Fullname : ''}</option>`;
      });
    })
    .catch(() => {
      // Optionally display an error or leave as is
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

  // Remove file button
  removeFileBtn.addEventListener('click', function() {
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

    // Validate Full Name
    const fullname = document.getElementById('fullname');
    if (!fullname.value.trim()) {
      document.getElementById('fullnameError').textContent = 'Full name is required';
      fullname.classList.add('input-error');
      isValid = false;
    }

    // Validate Date of Birth
    const dateOfBirth = document.getElementById('dateOfBirth');
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

    // Validate Gender
    const gender = document.querySelector('input[name="Gender"]:checked');
    if (!gender) {
      document.getElementById('genderError').textContent = 'Please select a gender';
      isValid = false;
    }

    // Validate medical file is required
    if (!fileInput.files || fileInput.files.length === 0) {
      document.getElementById('medicalInfoError').textContent = 'Medical file is required';
      isValid = false;
    } else {
      const fileSize = fileInput.files[0].size / 1024 / 1024; // in MB
      if (fileSize > 5) {
        document.getElementById('medicalInfoError').textContent = 'File size must be less than 5MB';
        isValid = false;
      }
    }

    // Validate Assigned Caregiver
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
    formData.append('Fullname', document.getElementById('fullname').value.trim());
    formData.append('DateOfBirth', document.getElementById('dateOfBirth').value);
    formData.append('Gender', document.querySelector('input[name="Gender"]:checked').value);
    formData.append('ContactNo', document.getElementById('contactNo').value.trim() || '');
    formData.append('AssignedCaregiver', assignedCaregiverSelect.value);

    // Add file (required)
    if (fileInput.files && fileInput.files.length > 0) {
      formData.append('MedicalFilePath', fileInput.files[0]);
    }

    try {
      responseMessage.textContent = 'Processing...';
      responseMessage.style.color = 'var(--text-medium)';
      const response = await fetch('/api/residents', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        responseMessage.textContent = 'Resident registered successfully!';
        responseMessage.style.color = 'var(--primary)';
        form.reset();
        clearFileSelection();
        setTimeout(() => {
          window.location.href = 'residents.html';
        }, 1500);
      } else {
        responseMessage.textContent = result.message || 'Registration failed. Please try again.';
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
  document.getElementById('dateOfBirth').setAttribute('max', today);
});