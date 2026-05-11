(() => {
  'use strict'

  // Змінні
  let isLoggedIn = false;

  // Функції

  // Спливаюче повідомлення
  function showToast(msg) {
    const toastLive = document.getElementById('liveToast')
    const toast_text = document.getElementById("toast-text");

    const toast = bootstrap.Toast.getOrCreateInstance(toastLive)
    if (toast_text) toast_text.innerText = msg;
    toast.show()
  }

  // Помилка при авторизації
  function showError(elementId, message) {
    const error_el = document.getElementById(elementId);
    if (error_el) {
      error_el.innerText = message;

      error_el.classList.add('show');
      setTimeout(() => {
        error_el.classList.remove('show');
      }, 3000);
    }
  }
  // Реєстрація
  async function registerUser(username, password) {
    console.log(`logging ${username}`);
    try {
      const response = await fetch(`http://${window.location.hostname}:3000/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Реєстрація успішна!");
        const regModal = bootstrap.Modal.getInstance(document.getElementById('reg-modal'));
        if (regModal) regModal.hide();
        new bootstrap.Modal(document.getElementById('login-modal')).show();
      } else {
        showError('reg-error', data.message || "Помилка реєстрації");
      }
    } catch (error) {
      showError('reg-error', "Сервер не доступний");
    }
  }
  // Вхід
  async function loginUser(username, password) {
    console.log(`logging ${username}`);
    try {
      const response = await fetch(`http://${window.location.hostname}:3000/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('login-modal'));
        if (loginModal) loginModal.hide();
        const regModal = bootstrap.Modal.getInstance(document.getElementById("reg-modal"));
        if (regModal) regModal.hide();

        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        const profile_text = document.getElementById("profile-text");
        if (profile_text) profile_text.innerText = data.username;

        isLoggedIn = true;
        showToast("Ви ввійшли!")
      } else {
        showError('login-error', data.message || "Невірний логін або пароль");
      }
    } catch (error) {
      showError('login-error', "Сервер не доступний");
    }
  }

  window.gameoverMenu = async function gameoverMenu(total_score) {
    const overlay_restart = document.getElementById("overlay-game-restart")
    const total_restart_text = document.getElementById('total-restart-text');
    if (overlay_restart) overlay_restart.style.display = 'flex';
    if(total_restart_text) total_restart_text.innerText = total_score;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const overlay_restart = document.getElementById("overlay-game-restart")
    const login_modal = document.getElementById('login-modal');
    const profile_modal = document.getElementById('profile-modal');
    const profile_btn = document.getElementById('profile-btn');
    const profile_text = document.getElementById('profile-text');
    const logout_button = document.getElementById("logout-button");
    const overlay_start = document.getElementById('overlay-game-start');
    const start_button = document.getElementById("start-button");
    const restart_button = document.getElementById("restart-button");
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (token && username) {
      isLoggedIn = true;
      if (profile_text) profile_text.innerText = username;
    }

    if (login_modal && profile_btn) {
      const loginModal = new bootstrap.Modal(login_modal);
      const profileModal = new bootstrap.Modal(profile_modal);
      profile_btn.addEventListener('click', () => {
        const username = localStorage.getItem("username");
        if (!username) {
          loginModal.show();
        } else {
          document.getElementById("username-profile").innerText = `Користувач: ${username}`
          const bestScore = localStorage.getItem("highscore") || 0;
          document.getElementById('personal-best').innerText = `Найкращий результат: ${bestScore}`;
          profileModal.show();
        }
      });
    }
    start_button.addEventListener('click', () => {
      overlay_start.style.display = 'none';
      const scene = game.scene.scenes[0];
      RestartGame(scene);
    })
    restart_button.addEventListener('click', () => {
      overlay_restart.style.display = 'none';
      const scene = game.scene.scenes[0];
      RestartGame(scene);
    })
    logout_button.addEventListener('click', () => {
      localStorage.removeItem("username");
      localStorage.removeItem("token");

      isLoggedIn = false;

      if (profile_text) profile_text.innerText = "Увійти";
      showToast("Ви вийшли!");
    });

    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {

      form.addEventListener('submit', async event => {
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
          console.log("Успіх валідації.");
          if (form.id === 'reg-form') {
            const user = document.getElementById('reg-username').value;
            const pass = document.getElementById('reg-password').value;
            registerUser(user, pass);
          }
          else if (form.id === 'login-form') {
            const user = document.getElementById('login-username').value;
            const pass = document.getElementById('login-password').value;
            loginUser(user, pass);
          }
        }

        form.classList.add('was-validated');
      }, false);
    });

  });
})();

