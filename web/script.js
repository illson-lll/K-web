(() => {
  'use strict'
  // Стан застосунку
  const state = {
    isLoggedIn: !!localStorage.getItem("token"),
    username: localStorage.getItem("username") || null,
    highscore: parseInt(localStorage.getItem("highscore")) || 0,
  };
  // Функції

  // UI функції.
  const ui = {
    showToast(msg) {
      const toastLive = document.getElementById('liveToast')
      const toast_text = document.getElementById("toast-text");

      const toast = bootstrap.Toast.getOrCreateInstance(toastLive)
      if (toast_text) toast_text.innerText = msg;
      toast.show()
    },

    // Помилка при авторизації
    showError(elementId, message) {
      const error_el = document.getElementById(elementId);
      if (error_el) {
        error_el.innerText = message;

        error_el.classList.add('show');
        setTimeout(() => {
          error_el.classList.remove('show');
        }, 3000);
      }
    },
    updateProfileUI() {
      const profile_text = document.getElementById('profile-text');
      const personal_best_text = document.getElementById('personal-best-text');
      const personal_best_profile = document.getElementById('personal-best-profile');
      const username_profile = document.getElementById('username-profile');
      if (profile_text) {
        profile_text.innerText = state.username || "Увійти";
      }
      if (personal_best_text) {
        personal_best_text.innerText = state.highscore;
      }
      if (personal_best_profile) personal_best_profile.innerText = state.highscore;
      if (username_profile) username_profile.innerText = state.username;
    },
  }

  // Синхронізація в разі зміни ніку чи рекорду.
  async function syncWithServer() {
    if (!state.isLoggedIn) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://${window.location.hostname}:3000/api/user-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        state.highscore = data.highScore;
        localStorage.setItem('highscore', data.highScore);
        ui.updateProfileUI();
      }
    } catch (error) {
      console.error("Помилка серверу:", error);
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
        ui.showToast("Реєстрація успішна!");
        const regModal = bootstrap.Modal.getInstance(document.getElementById('reg-modal'));
        if (regModal) regModal.hide();
        new bootstrap.Modal(document.getElementById('login-modal')).show();
      } else {
        ui.showError('reg-error', data.message || "Помилка реєстрації");
      }
    } catch (error) {
      ui.showError('reg-error', "Сервер не доступний");
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
        localStorage.setItem('highscore', data.highScore);
        state.isLoggedIn = true;
        state.username = data.username;
        state.highscore = data.highScore;
        ui.updateProfileUI();
        ui.showToast("Ви ввійшли!")
      } else {
        ui.showError('login-error', data.message || "Невірний логін або пароль");
      }
    } catch (error) {
      ui.showError('login-error', "Сервер не доступний");
    }
  }
  // Заповнення таблиці
  async function updateLeaderboard() {
    const table = document.getElementById('leaderboard-table');
    if (!table) return;

    table.innerHTML = Array(10).fill('<tr><td colspan="3" class="text-center text-muted">-</td></tr>').join('');

    try {
      const response = await fetch(`http://${window.location.hostname}:3000/api/leaderboard`);
      const top_players = await response.json();

      if (response.ok) {
        let rows_html = '';
        for (let i = 0; i < 10; i++) {
          const player = top_players[i]

          if (player) {
            const is_loggined_player = player.username === state.username;
            const row_class = is_loggined_player ? 'table-primary fw-bold' : '';

            rows_html += `
            <tr class="${row_class}">
              <th scope="row">${i + 1}</th>
              <td>${player.username}</td>
              <td class="text-end font-monospace">${player.highScore}</td>
            </tr>
          `;
          } else {
            rows_html += `
            <tr class="text-muted">
              <th scope="row">${i + 1}</th>
              <td>-</td>
              <td class="text-end">-</td>
            </tr>
          `;
          }
        }
        table.innerHTML = rows_html;
      }
    } catch (error) {
      table.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Помилка мережі</td></tr>';
      console.error("Leaderboard error:", error);
    }
  }

  window.gameoverMenu = async function gameoverMenu(total_score) {
    const overlay_restart = document.getElementById("overlay-game-restart")
    const total_restart_text = document.getElementById('total-restart-text');
    if (overlay_restart) overlay_restart.style.display = 'flex';
    if (total_restart_text) total_restart_text.innerText = total_score;

    if (total_score > state.highscore) {
      state.highscore = total_score;
      localStorage.setItem("highscore", total_score);
      ui.updateProfileUI();
      ui.showToast(`Новий рекорд: ${total_score}! 🏆`);
    }

    if (state.isLoggedIn) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://${window.location.hostname}:3000/api/save-score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ score: total_score })
        });
      } catch (error) {
        console.error("Помилка серверу:", error);
      }
    }
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
    const leaderboard_btn = document.getElementById('leaderboard-btn');

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (token && username) {
      state.isLoggedIn = true;
      state.username = username;
      ui.updateProfileUI();
      syncWithServer();
    }


    if (login_modal && profile_btn) {
      const loginModal = new bootstrap.Modal(login_modal);
      const profileModal = new bootstrap.Modal(profile_modal);
      profile_btn.addEventListener('click', () => {
        const username = localStorage.getItem("username");
        if (!username) {
          loginModal.show();
        } else {
          ui.updateProfileUI();
          profileModal.show();
        }
      });
    }

    // Початок гри
    start_button.addEventListener('click', () => {
      overlay_start.style.display = 'none';
      const scene = game.scene.scenes[0];
      RestartGame(scene);
    })
    // Рестарт
    restart_button.addEventListener('click', () => {
      overlay_restart.style.display = 'none';
      const scene = game.scene.scenes[0];
      RestartGame(scene);
    })
    // Вихід з аккаунту
    logout_button.addEventListener('click', () => {
      localStorage.clear();
      state.isLoggedIn = false;
      state.username = null;
      state.highscore = 0;
      const scene = game.scene.scenes[0];
      GameOver(scene);
      ui.updateProfileUI();
      ui.showToast("Ви вийшли!");
    });
    // Заповнення таблиці
    leaderboard_btn.addEventListener('click', () => updateLeaderboard())

    // Клієнтська валідація
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

