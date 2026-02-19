const { ipcRenderer } = require('electron');

// Función auxiliar para obtener elementos del DOM con verificación
function getEl(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`Elemento con id "${id}" no encontrado.`);
    return el;
}

async function cargarCarpetasEstudiantes() {
    console.log("Estamos preparando las carpetas de los cursos...");
    const contenedor = getEl('contenedorCarpetas');
    if (!contenedor) return;

    // Estos son todos los niveles que manejamos en la institución
    const cursos = [
        "Inicial 1", "Inicial 2",
        "1ro EGB", "2do EGB", "3ro EGB", "4to EGB", "5to EGB",
        "6to EGB", "7mo EGB", "8vo EGB", "9no EGB", "10mo EGB",
        "1ro Técnico", "2do Técnico", "3ro Técnico",
        "1ro Ciencias", "2do Ciencias", "3ro Ciencias"
    ];

    contenedor.innerHTML = ''; // Limpiamos para que no se dupliquen al recargar

    cursos.forEach(curso => {
        // Creamos visualmente cada carpeta
        const folder = document.createElement('div');
        folder.className = 'folder-card';
        folder.innerHTML = `
            <div class="folder-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20,6h-8l-2-2H4C2.9,4,2.01,4.9,2.01,6L2,18c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M20,18H4V8h16V18z"/>
                </svg>
            </div>
            <div class="folder-name">${curso}</div>
        `;

        // Al hacer clic, decidimos si mostramos paralelos o la lista directa (para técnicos)
        folder.addEventListener('click', async () => {
            console.log(`Abriendo: ${curso}`);
            const esTecnico = curso.toLowerCase().includes('técnico');
            if (esTecnico) {
                await mostrarEstudiantes(curso);
            } else {
                await mostrarParalelos(curso);
            }
        });

        contenedor.appendChild(folder);
    });
}

async function mostrarParalelos(curso) {
    const modalCurso = getEl('modalCurso');
    const tituloModal = getEl('tituloModalCurso');
    const contenidoModal = getEl('contenidoModalCurso');

    if (!modalCurso || !contenidoModal) return;

    tituloModal.innerText = `Paralelos de ${curso}`;
    contenidoModal.innerHTML = '';
    modalCurso.classList.add('visible');

    const esInicial = curso.toLowerCase().includes('inicial');
    const paralelos = esInicial ? ["A", "B"] : ["A", "B", "C"];

    paralelos.forEach(paralelo => {
        const pFolder = document.createElement('div');
        pFolder.className = 'folder-card';
        pFolder.style.width = '150px';
        pFolder.style.height = '140px';

        pFolder.innerHTML = `
            <div class="folder-icon" style="width: 48px; height: 48px;">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20,6h-8l-2-2H4C2.9,4,2.01,4.9,2.01,6L2,18c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M20,18H4V8h16V18z"/>
                </svg>
            </div>
            <div class="folder-name" style="font-size: 1.1rem;">Paralelo ${paralelo}</div>
        `;

        pFolder.addEventListener('click', async (e) => {
            e.stopPropagation();
            await mostrarEstudiantes(curso, paralelo);
        });

        contenidoModal.appendChild(pFolder);
    });
}

async function mostrarEstudiantes(curso, paralelo = null) {
    const modalCurso = getEl('modalCurso');
    const tituloModal = getEl('tituloModalCurso');
    const contenidoModal = getEl('contenidoModalCurso');

    if (!modalCurso || !contenidoModal) return;

    tituloModal.innerText = paralelo ? `Estudiantes - ${curso} "${paralelo}"` : `Estudiantes de ${curso}`;
    contenidoModal.innerHTML = '<p>Cargando estudiantes...</p>';
    modalCurso.classList.add('visible');

    try {
        const todosEstudiantes = await ipcRenderer.invoke('obtener-estudiantes');
        console.log(`Total estudiantes obtenidos: ${todosEstudiantes.length}`);

        const estudiantesFiltrados = todosEstudiantes.filter(est => {
            if (!est.curso) return false;
            const coincideCurso = est.curso.trim().toLowerCase() === curso.trim().toLowerCase();
            if (paralelo) {
                const coincideParalelo = est.paralelo && est.paralelo.trim().toUpperCase() === paralelo.trim().toUpperCase();
                return coincideCurso && coincideParalelo;
            }
            return coincideCurso;
        });

        contenidoModal.innerHTML = '';

        if (estudiantesFiltrados.length === 0) {
            contenidoModal.innerHTML = '<p>No hay estudiantes registrados en este curso/paralelo.</p>';
            if (paralelo) {
                const btnVolver = document.createElement('div');
                btnVolver.innerHTML = `<span>← Volver a Paralelos</span>`;
                btnVolver.className = 'btn-volver-paralelos';
                btnVolver.onclick = () => mostrarParalelos(curso);
                contenidoModal.appendChild(btnVolver);
            }
        } else {
            if (paralelo) {
                const btnVolver = document.createElement('div');
                btnVolver.innerHTML = `<span>← Volver a Paralelos</span>`;
                btnVolver.className = 'btn-volver-paralelos';
                btnVolver.onclick = () => mostrarParalelos(curso);
                contenidoModal.appendChild(btnVolver);
            }

            estudiantesFiltrados.forEach(estudiante => {
                const card = document.createElement('div');
                card.className = 'estudiante-card';

                const nombreCompleto = `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`;
                const DEFAULT_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
                        <rect width="128" height="128" rx="64" fill="#e5e7eb"/>
                        <circle cx="64" cy="50" r="22" fill="#9ca3af"/>
                        <path d="M26 116c7-22 25-34 38-34h0c13 0 31 12 38 34" fill="#9ca3af"/>
                    </svg>`
                )}`;
                const fotoSrc = estudiante.foto || DEFAULT_SVG;

                card.innerHTML = `
                    <img src="${fotoSrc}" class="card-foto" alt="Foto">
                    <h3 class="card-nombre">${nombreCompleto}</h3>
                    <p class="card-curso">${estudiante.curso || ''} ${estudiante.paralelo ? `"${estudiante.paralelo}"` : ''}</p>
                `;

                card.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ipcRenderer.send('abrir-modal', 'detalle', { id: estudiante._id });
                });

                contenidoModal.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Error al cargar estudiantes:", error);
        contenidoModal.innerHTML = '<p>Error crítico al cargar los datos de la base de datos.</p>';
    }
}

// Inicialización de eventos de cierre de modal
document.addEventListener('DOMContentLoaded', () => {
    cargarCarpetasEstudiantes();

    const modalCurso = getEl('modalCurso');
    const spanCerrar = document.querySelector('.close-modal-curso');

    if (spanCerrar && modalCurso) {
        spanCerrar.onclick = () => modalCurso.classList.remove('visible');
    }

    window.onclick = (event) => {
        if (event.target == modalCurso) {
            modalCurso.classList.remove('visible');
        }
    };
});

// Notificación de nueva versión
ipcRenderer.on('nueva-version', (event, info) => {
    const mainContainer = document.querySelector('body');
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
        <div class="update-content">
            <i class="fa-solid fa-circle-up"></i>
            <span>¡Nueva versión disponible! (v${info.remota})</span>
        </div>
        <button id="btnIrGithub" class="btn-update">Actualizar ahora</button>
    `;

    // Lo ponemos al principio del body
    mainContainer.prepend(updateBanner);

    const btnGithub = document.getElementById('btnIrGithub');
    if (btnGithub) {
        btnGithub.onclick = () => {
            ipcRenderer.send('abrir-link-externo', info.url);
        };
    }
});

// Escuchas para actualizar la vista
ipcRenderer.on('registro-guardado', () => cargarCarpetasEstudiantes());
ipcRenderer.on('registro-eliminado', () => cargarCarpetasEstudiantes());
ipcRenderer.on('registro-modificado', () => cargarCarpetasEstudiantes());
