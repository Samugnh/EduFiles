// Registro de usuario — se guarda todo en localStorage bajo la clave 'usuarios'

const registroForm = document.getElementById('registroForm');
const errorMsg = document.getElementById('error-msg');

registroForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!usuario || !password) {
        errorMsg.innerText = 'Usuario y contraseña son obligatorios.';
        errorMsg.style.display = 'block';
        return;
    }

    try {
        const raw = localStorage.getItem('usuarios');
        const usuarios = raw ? JSON.parse(raw) : [];

        // No queremos duplicados
        if (usuarios.find(u => u.usuario === usuario)) {
            errorMsg.innerText = 'Ese nombre de usuario ya está en uso.';
            errorMsg.style.display = 'block';
            return;
        }

        usuarios.push({ usuario, email, password, fechaCreacion: new Date().toISOString() });
        localStorage.setItem('usuarios', JSON.stringify(usuarios));

        alert('Usuario registrado exitosamente');
        window.location.href = 'login.html';
    } catch (err) {
        console.error('No se pudo guardar el usuario:', err);
        errorMsg.innerText = 'Error al guardar el usuario.';
        errorMsg.style.display = 'block';
    }
});
