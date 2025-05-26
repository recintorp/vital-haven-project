document.addEventListener('DOMContentLoaded', function() {
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
      
      // Use relative path for deployment flexibility
      const response = await fetch('/api/caregivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (response.ok) {
        responseMessage.textContent = 'Caregiver registered successfully!';
        responseMessage.style.color = 'var(--primary)';
        form.reset();
        
        // Redirect after successful registration (optional)
        setTimeout(() => {
          window.location.href = 'caregiverlogs.html';
        }, 1500);
      } else {
        responseMessage.textContent = result.message || 'Registration failed. Please try again.';
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

  // Staff number input formatting
  const staffNumberInput = document.getElementById('staffNumber');
  staffNumberInput.addEventListener('input', function(e) {
    // Get cursor position before any changes
    const cursorPosition = this.selectionStart;
    // Auto-insert N- if field is empty
    if (this.value.length === 0) {
      this.value = 'N-';
      return;
    }
    // Ensure it starts with N-
    if (!this.value.startsWith('N-')) {
      this.value = 'N-' + this.value.replace(/[^0-9]/g, '');
    }
    // After N-, only allow digits
    if (this.value.length > 2) {
      const prefix = this.value.substring(0, 2);
      const numbers = this.value.substring(2).replace(/[^0-9]/g, '');
      this.value = prefix + numbers;
    }
    // Limit to 8 characters total (N- + 6 digits)
    if (this.value.length > 8) {
      this.value = this.value.substring(0, 8);
    }
    // Restore cursor position (adjusting for any changes we made)
    if (cursorPosition === 1 && this.value === 'N-') {
      this.setSelectionRange(2, 2);
    } else {
      this.setSelectionRange(cursorPosition, cursorPosition);
    }
  });
  
  staffNumberInput.addEventListener('paste', function(e) {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const cleaned = pastedText.replace(/[^0-9]/g, '');
    this.value = 'N-' + cleaned.substring(0, 6);
  });
});