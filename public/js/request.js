document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('requestForm');
  const discardBtn = document.getElementById('discardBtn');
  const returnBtn = document.getElementById('returnBtn');
  const discardModal = document.getElementById('discardModal');
  const yesBtn = discardModal.querySelector('button.yes');
  const noBtn = discardModal.querySelector('button.no');
  const successMessage = document.getElementById('successMessage');
  const sendBtn = form.querySelector('.btn.send');

  // Show modal when discard button clicked
  discardBtn.addEventListener('click', () => {
    discardModal.style.display = 'flex';
  });

  // Yes button: redirect to index.html
  yesBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // No button: close modal
  noBtn.addEventListener('click', () => {
    discardModal.style.display = 'none';
  });

  // Return button: redirect to index.html
  returnBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Actual POST to backend
  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    sendBtn.classList.add('loading');
    sendBtn.disabled = true;
    const message = document.getElementById('message').value;

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: message })
      });
      if (!response.ok) throw new Error('Failed to send request');
      // Hide form and show success message
      form.style.display = 'none';
      successMessage.style.display = 'block';
    } catch (err) {
      alert('Failed to send request. Please try again later.');
    } finally {
      sendBtn.classList.remove('loading');
      sendBtn.disabled = false;
    }
  });

  // Close modal if clicked outside modal content
  window.addEventListener('click', (e) => {
    if (e.target === discardModal) {
      discardModal.style.display = 'none';
    }
  });

  // Add animation to textarea placeholder text
  const textarea = document.getElementById('message');
  textarea.addEventListener('focus', function() {
    if (this.value === this.defaultValue) {
      this.value = '';
    }
  });

  textarea.addEventListener('blur', function() {
    if (this.value === '') {
      this.value = this.defaultValue;
    }
  });
});