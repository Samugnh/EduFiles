// Login local — los usuarios se guardan en localStorage bajo la clave 'usuarios'

const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('error-msg');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;

    try {
        const raw = localStorage.getItem('usuarios');
        const usuarios = raw ? JSON.parse(raw) : [];

        const user = usuarios.find(u => u.usuario === usuario && u.password === password);

        if (user) {
            window.location.href = 'index.html';
        } else {
            errorMsg.innerText = 'Credenciales inválidas. Verifica tu usuario y contraseña.';
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        console.error('Algo salió mal al intentar entrar:', err);
        errorMsg.innerText = 'Error al iniciar sesión.';
        errorMsg.style.display = 'block';
    }
});
