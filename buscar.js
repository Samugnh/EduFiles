const { ipcRenderer } = require('electron');
const store = require('./studentStore');

let estudiantesCache = [];

// Quita tildes y pone en minúsculas para que la búsqueda no sea sensible a acentos
function normalizar(texto) {
    return texto ? texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
}

function cargarDatos() {
    estudiantesCache = store.loadStudents();
    renderResults(''); // Mostramos todos al inicio
}

function renderResults(query) {
    const container = document.getElementById('resultados');
    if (!container) return;

    const filtro = normalizar(query);

    const matches = estudiantesCache.filter(s => {
        const nombreCompleto = normalizar(`${s.nombres} ${s.apellidos}`);
        return nombreCompleto.includes(filtro);
    });

    container.innerHTML = '';

    if (matches.length === 0) {
        container.innerHTML = '<p>No se encontraron estudiantes.</p>';
        return;
    }

    for (const s of matches) {
        const div = document.createElement('div');
        div.className = 'resultado-item';
        div.style.padding = "10px";
        div.style.borderBottom = "1px solid #ccc";
        div.style.cursor = "pointer";
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";

        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `
            <strong>${s.nombres} ${s.apellidos}</strong> — ${s.curso || 'Sin curso'} ${s.paralelo ? `"${s.paralelo}"` : ''} <br>
            <small>Cédula: ${s.cedulaEstudiante} | Jornada: ${s.jornada}</small>
        `;

        const btnPrint = document.createElement('button');
        btnPrint.innerHTML = '<i class="fa-solid fa-print"></i>';
        btnPrint.className = "btn-print";
        btnPrint.style.marginLeft = "10px";
        btnPrint.style.padding = "8px 12px";
        btnPrint.style.border = "none";
        btnPrint.style.background = "#2daae1";
        btnPrint.style.color = "white";
        btnPrint.style.borderRadius = "8px";
        btnPrint.style.cursor = "pointer";

        // El stopPropagation evita que también se abra el modal de detalle al imprimir
        btnPrint.onclick = (e) => {
            e.stopPropagation();
            imprimirEstudiante(s);
        };

        div.appendChild(infoDiv);
        div.appendChild(btnPrint);

        div.addEventListener('click', () => {
            ipcRenderer.send('abrir-modal', 'detalle', { id: s.id });
        });

        container.appendChild(div);
    }
}

function imprimirEstudiante(estudiante) {
    ipcRenderer.send('abrir-impresion', {
        nombres: estudiante.nombres,
        apellidos: estudiante.apellidos,
        foto: estudiante.foto,
        cedulaEstudiante: estudiante.cedulaEstudiante,
        fechaNacimiento: estudiante.fechaNacimiento,
        edad: estudiante.edad,
        curso: estudiante.curso,
        paralelo: estudiante.paralelo,
        jornada: estudiante.jornada,
        email: estudiante.email,
        nombreRepresentante: estudiante.nombreRepresentante,
        cedulaRepresentante: estudiante.cedulaRepresentante,
        telefonoRepresentante: estudiante.telefonoRepresentante,
        correoRepresentante: estudiante.correoRepresentante,
        codigoEstudiante: estudiante.codigoEstudiante,
        nacionalidad: estudiante.nacionalidad,
        etnia: estudiante.etnia,
        discapacidad: estudiante.discapacidad,
        direccion: estudiante.direccion,
        direccionRepresentante: estudiante.direccionRepresentante,
        descripcionObservaciones: estudiante.descripcionObservaciones
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('searchInput');
    const form = document.getElementById('searchForm');

    cargarDatos();

    if (input) {
        input.addEventListener('input', () => {
            renderResults(input.value);
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            renderResults(input?.value ?? '');
        });
    }
});