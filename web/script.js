(() => {
  'use strict'
  // Стан застосунку
  const state = {
    isLoggedIn: !!localStorage.getItem("token"),
    username: localStorage.getItem("username") || null,
    highscore: parseInt(localStorage.getItem("highscore")) || 0,
  };
  // Функції

  // UI функції
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
      const response = await fetch(`/user-data`, {
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
    try {
      const response = await fetch(`/api/register`, {
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
      const response = await fetch(`/api/login`, {
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

        const overlay_start = document.getElementById('overlay-game-start');
        const overlay_restart = document.getElementById("overlay-game-restart");
        if (overlay_restart) overlay_restart.style.display = 'none'; 
        if (overlay_start) overlay_start.style.display = 'flex'; 
        running = false; 
        const scene = game.scene.scenes[0];
        if (scene) {
          scene.scene.restart(); 
        }

      } else {
        ui.showError('login-error', data.message || "Невірний логін або пароль");
      }
    } catch (error) {
      ui.showError('login-error', "Сервер не доступний");
    }
  }

  // Видалення аккаунту 
  async function deleteUserAccount() {
    if (!state.isLoggedIn) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.clear();
        state.isLoggedIn = false;
        state.username = null;
        state.highscore = 0;
        const scene = game.scene.scenes[0];
        GameOver(scene);
        ui.updateProfileUI();
        ui.showToast("Ваш акаунт видалено!");
      } else {
        ui.showToast(data.message || "Не вдалося видалити акаунт");
      }
    } catch (error) {
      console.error("Помилка:", error);
      ui.showToast("Помилка сервера");
    }
  }
  // Оновленя таблиці лідерів
  async function updateLeaderboard() {
    const table = document.getElementById('leaderboard-table');
    if (!table) return;

    table.innerHTML = Array(10).fill('<tr><td colspan="3" class="text-center text-muted">-</td></tr>').join('');

    try {
      const response = await fetch(`/api/leaderboard`);
      const topPlayers = await response.json();

      if (response.ok) {
        let rowsHtml = '';
        for (let i = 0; i < 10; i++) {
          const player = topPlayers[i]

          if (player) {
            const isMe = player.username === state.username;
            const rowClass = isMe ? 'table-primary fw-bold' : '';

            rowsHtml += `
            <tr class="${rowClass}">
              <th scope="row">${i + 1}</th>
              <td>${player.username}</td>
              <td class="text-end font-monospace">${player.highScore}</td>
            </tr>
          `;
          } else {
            rowsHtml += `
            <tr class="text-muted">
              <th scope="row">${i + 1}</th>
              <td>-</td>
              <td class="text-end">-</td>
            </tr>
          `;
          }
        }

        table.innerHTML = rowsHtml;
      }
    } catch (error) {
      table.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Помилка мережі</td></tr>';
      console.error("Leaderboard error:", error);
    }
  }

  window.gameoverMenu = async function gameoverMenu(total_score) {
    const overlay_restart = document.getElementById("overlay-game-restart")
    const overlay_start = document.getElementById("overlay-game-start")
    const total_restart_text = document.getElementById('total-restart-text');
    if (overlay_start) overlay_start.style.display = 'none';
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
        await fetch(`/api/save-score`, {
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
    const username_delete_profile = document.getElementById('username-delete-profile');
    const profile_btn = document.getElementById('profile-btn');
    const logout_button = document.getElementById("logout-button");
    const overlay_start = document.getElementById('overlay-game-start');
    const start_button = document.getElementById("start-button");
    const restart_button = document.getElementById("restart-button");
    const leaderboard_btn = document.getElementById('leaderboard-btn');
    const del_account_button = document.getElementById('del-account-button');
    const del_account_confirm_button = document.getElementById('del-account-confirm-button');
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
    // Видалення аккаунту
    del_account_button.addEventListener('click', () => {
      if (username_delete_profile) {
        username_delete_profile.innerText = state.username;
      }
    })
    del_account_confirm_button.addEventListener('click', () => {
      deleteUserAccount();
    })

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

