const { ipcRenderer } = require('electron');

const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('error-msg');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    const result = await ipcRenderer.invoke('login-usuario', { usuario, password });

    if (result.success) {
        window.location.href = 'index.html';
    } else {
        errorMsg.innerText = result.error;
        errorMsg.style.display = 'block';
    }
});
