(() => {
  'use strict'

  document.addEventListener('DOMContentLoaded', () => {

    const login_modal = document.getElementById('login-modal');
    const profile_btn = document.getElementById('profile-btn');

    if (login_modal && profile_btn) {
      const loginModal = new bootstrap.Modal(login_modal);
      profile_btn.addEventListener('click', () => {
        loginModal.show();
      });
    }

    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {

      form.addEventListener('submit', event => {
        if (form.id === 'reg-form') {
          const password = document.getElementById('reg-password');
          const confirm = document.getElementById('reg-password-confirm');

          if (password.value !== confirm.value) {
            confirm.setCustomValidity('Passwords do not match');
          } else {
            confirm.setCustomValidity('');
          }
        }
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        } else {
          event.preventDefault();
          alert("Успіх валідації.");
        }

        form.classList.add('was-validated');
      }, false);
    });

  });
})();