const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Registros.js cargado');
    
    const btnAgregar = document.getElementById('btnAgregar');
    const btnModificar = document.getElementById('btnModificar');
    const btnEliminar = document.getElementById('btnEliminar');

    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            console.log('Botón Agregar clickeado');
            ipcRenderer.send('abrir-modal', 'agregar');
        });
    }

    if (btnModificar) {
        btnModificar.addEventListener('click', () => {
            console.log('Botón Modificar clickeado');
            ipcRenderer.send('abrir-modal', 'modificar');
        });
    }

    if (btnEliminar) {
        btnEliminar.addEventListener('click', () => {
            console.log('Botón Eliminar clickeado');
            ipcRenderer.send('abrir-modal', 'eliminar');
        });
    }

    // Escuchar respuestas
    ipcRenderer.on('registro-guardado', (event, datos) => {
        console.log('Registro guardado:', datos);
        alert('Registro agregado exitosamente');
    });

    ipcRenderer.on('registro-modificado', (event, datos) => {
        console.log('Registro modificado:', datos);
        alert('Registro modificado exitosamente');
    });

    ipcRenderer.on('registro-eliminado', (event, id) => {
        console.log('Registro eliminado:', id);
        alert('Registro eliminado exitosamente');
    });
});