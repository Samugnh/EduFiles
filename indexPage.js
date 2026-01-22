const { ipcRenderer } = require('electron');

async function cargarCarpetasEstudiantes() {
    const contenedor = document.getElementById('contenedorCarpetas');
    if (!contenedor) return;

    contenedor.innerHTML = ''; // Limpiar contenido previo

    try {
        // Pedir estudiantes a la base de datos (MongoDB)
        const estudiantes = await ipcRenderer.invoke('obtener-estudiantes');

        if (estudiantes.length === 0) {
            contenedor.innerHTML = '<p style="text-align:center; width:100%; color:#666;">No hay estudiantes registrados.</p>';
            return;
        }

        estudiantes.forEach(estudiante => {
            const card = document.createElement('div');
            card.className = 'estudiante-card'; // Usa la clase definida en styles.css

            const nombreCompleto = `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`;
            const fotoSrc = estudiante.foto || 'icon-small.ico'; // Fallback de imagen

            card.innerHTML = `
                <img src="${fotoSrc}" class="card-foto" alt="Foto">
                <h3 class="card-nombre">${nombreCompleto}</h3>
                <p class="card-curso">${estudiante.curso || 'Sin curso'}</p>
            `;

            // Evento click para abrir la modal con el ID del estudiante
            card.addEventListener('click', () => {
                const idUnico = estudiante._id.toString();
                ipcRenderer.send('abrir-modal', 'detalle', { id: idUnico });
            });

            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error("Error cargando estudiantes:", error);
        contenedor.innerHTML = '<p style="text-align:center; color:red;">Error al cargar estudiantes.</p>';
    }
}

// Cargar al abrir la ventana
document.addEventListener('DOMContentLoaded', cargarCarpetasEstudiantes);

// Escuchas para actualizar la vista cuando ocurran cambios en Atlas
ipcRenderer.on('registro-guardado', () => cargarCarpetasEstudiantes());
ipcRenderer.on('registro-eliminado', () => cargarCarpetasEstudiantes());
ipcRenderer.on('registro-modificado', () => cargarCarpetasEstudiantes());