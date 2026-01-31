const { ipcRenderer } = require('electron');

async function cargarCarpetasEstudiantes() {
    const contenedor = document.getElementById('contenedorCarpetas');
    if (!contenedor) return;

    const modalCurso = document.getElementById('modalCurso');
    const tituloModal = document.getElementById('tituloModalCurso');
    const contenidoModal = document.getElementById('contenidoModalCurso');
    const spanCerrar = document.getElementsByClassName("close-modal-curso")[0];

    // Cerrar modal al hacer click en X
    if (spanCerrar) {
        spanCerrar.onclick = function () {
            modalCurso.classList.remove('visible');
        }
    }

    // Cerrar modal al hacer click fuera
    window.onclick = function (event) {
        if (event.target == modalCurso) {
            modalCurso.classList.remove('visible');
        }
    }

    // Definir los cursos fijos
    const cursos = ["1ro", "2do", "3ro"];

    contenedor.innerHTML = ''; // Limpiar

    cursos.forEach(curso => {
        const folder = document.createElement('div');
        folder.className = 'folder-card';

        folder.innerHTML = `
            <div class="folder-icon">
                <!-- SVG Folder Icon -->
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20,6h-8l-2-2H4C2.9,4,2.01,4.9,2.01,6L2,18c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M20,18H4V8h16V18z"/>
                </svg>
            </div>
            <div class="folder-name">${curso}</div>
        `;

        folder.addEventListener('click', async () => {
            try {
                // Abrir modal y mostrar loading o limpiar previo
                tituloModal.innerText = `Estudiantes de ${curso}`;
                contenidoModal.innerHTML = '<p>Cargando...</p>';
                modalCurso.classList.add('visible');

                // Pedir todos los estudiantes (o idealmente filtrar en query, pero usamos lo que hay por ahora)
                const todosEstudiantes = await ipcRenderer.invoke('obtener-estudiantes');

                // Filtrar por curso (asumiendo que el campo 'curso' coincide con "1ro", "2do", "3ro")
                const estudiantesCurso = todosEstudiantes.filter(est => est.curso && est.curso.includes(curso));

                contenidoModal.innerHTML = '';

                if (estudiantesCurso.length === 0) {
                    contenidoModal.innerHTML = '<p>No hay estudiantes en este curso.</p>';
                } else {
                    estudiantesCurso.forEach(estudiante => {
                        const card = document.createElement('div');
                        card.className = 'estudiante-card'; // Reutilizamos estilo de card

                        const nombreCompleto = `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`;
                        const fotoSrc = estudiante.foto || 'icon-small.ico';

                        card.innerHTML = `
                            <img src="${fotoSrc}" class="card-foto" alt="Foto">
                            <h3 class="card-nombre">${nombreCompleto}</h3>
                            <p class="card-curso">${estudiante.curso || ''}</p>
                        `;

                        // Al hacer click en un estudiante dentro del modal, abrir su detalle
                        card.addEventListener('click', (e) => {
                            e.stopPropagation(); // Evitar cerrar algo si fuera el caso
                            const idUnico = estudiante._id.toString();
                            ipcRenderer.send('abrir-modal', 'detalle', { id: idUnico });
                        });

                        contenidoModal.appendChild(card);
                    });
                }

            } catch (error) {
                console.error("Error al cargar estudiantes del curso:", error);
                contenidoModal.innerHTML = '<p>Error al cargar datos.</p>';
            }
        });

        contenedor.appendChild(folder);
    });
}

// Cargar al abrir la ventana
document.addEventListener('DOMContentLoaded', cargarCarpetasEstudiantes);

// Escuchas para actualizar la vista cuando ocurran cambios en Atlas
ipcRenderer.on('registro-guardado', () => cargarCarpetasEstudiantes());
ipcRenderer.on('registro-eliminado', () => cargarCarpetasEstudiantes());
ipcRenderer.on('registro-modificado', () => cargarCarpetasEstudiantes());