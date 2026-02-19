const { ipcRenderer } = require('electron');

const registroForm = document.getElementById('registroForm');
const errorMsg = document.getElementById('error-msg');

registroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const result = await ipcRenderer.invoke('registrar-usuario', { usuario, email, password });

    if (result.success) {
        alert('Usuario registrado exitosamente');
        window.location.href = 'login.html';
    } else {
        errorMsg.innerText = result.error;
        errorMsg.style.display = 'block';
    }
});
