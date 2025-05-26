// DOM Elements
const images = document.querySelectorAll('.visual img');
const indicators = document.querySelectorAll('.indicator-dot');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const loginButton = document.getElementById('loginButton');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const requestAccountLink = document.getElementById('requestAccountLink');
const invalidCredentialsPrompt = document.getElementById('invalidCredentialsPrompt');
const lockPrompt = document.getElementById('lockPrompt');
const inputInvalidPrompt = document.getElementById('inputInvalidPrompt');
const countdownDisplay = document.getElementById('countdown');
const customAlert = document.getElementById('customAlert');
const alertMessage = document.getElementById('alertMessage');
const welcomeText = document.getElementById('welcomeText');
const welcomeSubtext = document.getElementById('welcomeSubtext');

// Carousel functionality
let currentImageIndex = 0;
let carouselInterval;

function startCarousel() {
  carouselInterval = setInterval(() => {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    updateCarousel(currentImageIndex);
  }, 5000);
}

function updateCarousel(index) {
  images.forEach((img, i) => img.classList.toggle('active', i === index));
  indicators.forEach((dot, i) => dot.classList.toggle('active', i === index));
}

// Toggle password visibility
togglePassword.addEventListener('click', function() {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  this.classList.toggle('fa-eye-slash');
  this.classList.toggle('fa-eye');
});

// Indicator dots click handler
indicators.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    clearInterval(carouselInterval);
    currentImageIndex = index;
    updateCarousel(currentImageIndex);
    startCarousel();
  });
});

// Login attempts tracking
let attempts = 0;
const maxAttempts = 3;
const lockDuration = 10000; // 10 seconds
let lockTimer;
let countdownInterval;

// Security modal attempts
let securityAttempts = 0;
const maxSecurityAttempts = 3;
let securityCountdown;

// Track login type: "admin" or "caregiver"
let loginType = "caregiver";

// Show custom alert
function showAlert(message, type = 'info') {
  alertMessage.textContent = message;
  customAlert.style.backgroundColor = type === 'error' ? '#dc3545' : 
                                    type === 'success' ? '#28a745' : 
                                    type === 'warning' ? '#ffc107' : 
                                    '#4c7c2d';
  customAlert.style.animation = 'none';
  customAlert.offsetHeight;
  customAlert.style.display = 'flex';
  customAlert.style.animation = 'slideIn 0.3s forwards';
  setTimeout(() => {
    customAlert.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => {
      customAlert.style.display = 'none';
    }, 300);
  }, 3000);
}

function lockFormFields() {
  invalidCredentialsPrompt.style.display = 'none';
  lockPrompt.style.display = 'block';
  usernameInput.disabled = true;
  passwordInput.disabled = true;
  loginButton.disabled = true;
  let secondsLeft = 10;
  countdownDisplay.textContent = secondsLeft;
  countdownInterval = setInterval(() => {
    secondsLeft--;
    countdownDisplay.textContent = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      unlockFormFields();
    }
  }, 1000);
}

function unlockFormFields() {
  usernameInput.disabled = false;
  passwordInput.disabled = false;
  loginButton.disabled = false;
  usernameInput.value = '';
  passwordInput.value = '';
  invalidCredentialsPrompt.style.display = 'none';
  lockPrompt.style.display = 'none';
  inputInvalidPrompt.style.display = 'none';
  attempts = 0;
}

function showSecurityModal() {
  document.getElementById('securityModal').style.display = 'flex';
  document.getElementById('invalidVerificationPrompt').style.display = 'none';
  document.getElementById('securityLockPrompt').style.display = 'none';
  document.getElementById('securityCodeInput').value = '';
  document.getElementById('securityCodeInput').disabled = false;
  document.getElementById('verifyButton').disabled = false;
}

function closeSecurityModal() {
  document.getElementById('securityModal').style.display = 'none';
}

function lockSecurityFields() {
  document.getElementById('invalidVerificationPrompt').style.display = 'none';
  document.getElementById('securityLockPrompt').style.display = 'block';
  const securityCodeInput = document.getElementById('securityCodeInput');
  const verifyButton = document.getElementById('verifyButton');
  securityCodeInput.disabled = true;
  verifyButton.disabled = true;
  let secondsLeft = 10;
  document.getElementById('securityCountdown').textContent = secondsLeft;
  securityCountdown = setInterval(() => {
    secondsLeft--;
    document.getElementById('securityCountdown').textContent = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(securityCountdown);
      unlockSecurityFields();
      closeSecurityModal();
    }
  }, 1000);
}

function unlockSecurityFields() {
  document.getElementById('securityCodeInput').disabled = false;
  document.getElementById('verifyButton').disabled = false;
  document.getElementById('invalidVerificationPrompt').style.display = 'none';
  document.getElementById('securityLockPrompt').style.display = 'none';
  securityAttempts = 0;
}

// Security Code Verification (only for admin)
function verifySecurityCode() {
  const codeInput = document.getElementById('securityCodeInput');
  const code = codeInput.value.trim();
  if (code === "08092003") {
    closeSecurityModal();
    showWelcomeScreen();
  } else {
    securityAttempts++;
    document.getElementById('invalidVerificationPrompt').style.display = 'block';
    if (securityAttempts >= maxSecurityAttempts) {
      lockSecurityFields();
    }
  }
}

function showWelcomeScreen() {
  document.querySelector('.container').style.opacity = '0';
  document.querySelector('.container').style.pointerEvents = 'none';
  const welcomeScreen = document.getElementById('welcomeScreen');
  welcomeScreen.style.display = 'flex';
  if (loginType === "admin") {
    welcomeText.textContent = "Welcome Admin";
    welcomeSubtext.textContent = "Loading your dashboard...";
  } else {
    welcomeText.textContent = "Welcome Caregiver";
    welcomeSubtext.textContent = "Loading your dashboard...";
  }
  setTimeout(() => {
    welcomeScreen.classList.add('fade-out');
  }, 1500);
  setTimeout(() => {
    if (loginType === "admin") {
      window.location.href = 'Overview.html';
    } else {
      window.location.href = 'cgdashboard.html';
    }
  }, 2500);
}

// Form submission handler (ADMIN and CAREGIVER login)
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const StaffNumber = usernameInput.value.trim();
  const Password = passwordInput.value.trim();
  invalidCredentialsPrompt.style.display = 'none';
  inputInvalidPrompt.style.display = 'none';
  if (!StaffNumber || !Password) {
    inputInvalidPrompt.style.display = 'block';
    return;
  }
  if (StaffNumber === 'admin' && Password === '1234') {
    loginType = "admin";
    showSecurityModal(); // Only admin needs security code!
    return;
  }
  // Caregiver login API (no security code for caregivers)
  try {
    const res = await fetch('/api/caregivers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ StaffNumber, Password }) // Use capitalized keys everywhere!
    });
    if (res.status === 200) {
      loginType = "caregiver";
      // SET StaffNumber IN localStorage (for ALL future pages!)
      localStorage.setItem('StaffNumber', StaffNumber); // <--- Use capitalized key!
      showWelcomeScreen();
    } else {
      attempts++;
      invalidCredentialsPrompt.style.display = 'block';
      if (attempts >= maxAttempts) {
        lockFormFields();
      }
    }
  } catch (err) {
    showAlert('Server error. Please try again.', 'error');
  }
});

forgotPasswordLink.addEventListener('click', function(e) {
  e.preventDefault();
  showAlert('Directly go to the Admin Office, to inquire about your password.', 'info');
});

requestAccountLink.addEventListener('click', function(e) {
  e.preventDefault();
  showAlert('Account request has been sent to the administrator.', 'success');
  setTimeout(() => {
    window.location.href = 'request.html';
  }, 3000);
});

// Initialize UI state
startCarousel();
updateCarousel(0);
invalidCredentialsPrompt.style.display = 'none';
lockPrompt.style.display = 'none';
inputInvalidPrompt.style.display = 'none';
document.getElementById('invalidVerificationPrompt').style.display = 'none';
document.getElementById('securityLockPrompt').style.display = 'none';