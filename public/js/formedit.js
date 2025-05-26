// Utility to read query params
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

document.addEventListener('DOMContentLoaded', async function() {
  // Password toggle functionality
  const togglePassword = document.getElementById('togglePassword');
  const password = document.getElementById('password');
  togglePassword.addEventListener('click', function() {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  });

  const modal = document.getElementById('confirmationModal');
  const cancelConfirmBtn = document.getElementById('cancelConfirm');
  const confirmSubmitBtn = document.getElementById('confirmSubmit');
  const form = document.getElementById('caregiverForm');
  const responseMessage = document.getElementById('responseMessage');

  // --- Prefill form with caregiver data ---
  const staffNumberParam = getQueryParam('staffNumber');
  if (!staffNumberParam) {
    responseMessage.textContent = "No caregiver to edit (missing staff number).";
    responseMessage.style.color = "var(--error)";
    form.style.display = "none";
  } else {
    try {
      responseMessage.textContent = "Loading caregiver data...";
      responseMessage.style.color = "var(--text-medium)";
      // Fetch caregiver data from backend
      const res = await fetch(`/api/caregivers/${encodeURIComponent(staffNumberParam)}`);
      if (!res.ok) throw new Error('Failed to fetch caregiver data');
      const caregiver = await res.json();
      if (!caregiver || !caregiver.StaffNumber) throw new Error('Caregiver not found.');

      // Fill the fields
      document.getElementById('staffNumber').value = caregiver.StaffNumber;
      document.getElementById('fullname').value = caregiver.Fullname || '';
      document.getElementById('password').value = caregiver.Password || '';
      document.getElementById('contactNo').value = caregiver.ContactNo || '';
      document.getElementById('email').value = caregiver.Email || '';
      if (caregiver.AssignedResident) {
        const residentRadio = document.querySelector(`input[name="AssignedResident"][value="${caregiver.AssignedResident}"]`);
        if (residentRadio) residentRadio.checked = true;
      }
      document.getElementById('shift').value = caregiver.Shift || '';
      responseMessage.textContent = '';
    } catch (err) {
      responseMessage.textContent = "Failed to load caregiver info.";
      responseMessage.style.color = "var(--error)";
      form.style.display = "none";
      return;
    }
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

    // Validate Staff Number
    const staffNumber = document.getElementById('staffNumber');
    if (!staffNumber.value.trim()) {
      document.getElementById('staffNumberError').textContent = 'Staff number is required';
      staffNumber.classList.add('input-error');
      isValid = false;
    } else if (!/^N-\d{6}$/.test(staffNumber.value.trim())) {
      document.getElementById('staffNumberError').textContent = 'Must be in format N-012025';
      staffNumber.classList.add('input-error');
      isValid = false;
    }

    // Validate Password
    const password = document.getElementById('password');
    if (!password.value.trim()) {
      document.getElementById('passwordError').textContent = 'Password is required';
      password.classList.add('input-error');
      isValid = false;
    } else if (password.value.trim().length < 8) {
      document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
      password.classList.add('input-error');
      isValid = false;
    }

    // Validate Full Name
    const fullname = document.getElementById('fullname');
    if (!fullname.value.trim()) {
      document.getElementById('fullnameError').textContent = 'Full name is required';
      fullname.classList.add('input-error');
      isValid = false;
    }

    // Validate Assigned Resident
    const assignedResident = document.querySelector('input[name="AssignedResident"]:checked');
    if (!assignedResident) {
      document.getElementById('assignedResidentError').textContent = 'Please select a resident';
      isValid = false;
    }

    // Validate Shift
    const shift = document.getElementById('shift');
    if (!shift.value) {
      document.getElementById('shiftError').textContent = 'Please select a shift';
      shift.classList.add('input-error');
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
    const assignedResident = document.querySelector('input[name="AssignedResident"]:checked')?.value;
    const data = {
      StaffNumber: document.getElementById('staffNumber').value.trim(),
      Password: document.getElementById('password').value,
      Fullname: document.getElementById('fullname').value.trim(),
      ContactNo: document.getElementById('contactNo').value.trim() || null,
      Email: document.getElementById('email').value.trim() || null,
      AssignedResident: assignedResident,
      Shift: document.getElementById('shift').value
    };
    
    try {
      responseMessage.textContent = 'Processing...';
      responseMessage.style.color = 'var(--text-medium)';
      
      // Send PUT request for update
      const response = await fetch(`/api/caregivers/${encodeURIComponent(data.StaffNumber)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (response.ok) {
        responseMessage.textContent = 'Caregiver updated successfully!';
        responseMessage.style.color = 'var(--primary)';
        // Redirect after successful update (optional)
        setTimeout(() => {
          window.location.href = 'caregiverlogs.html';
        }, 1500);
      } else {
        responseMessage.textContent = result.message || 'Update failed. Please try again.';
        responseMessage.style.color = 'var(--error)';
        // Display server-side validation errors
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

  // Staff number input: readonly in edit mode, no formatting needed
  const staffNumberInput = document.getElementById('staffNumber');
  staffNumberInput.readOnly = true;
});