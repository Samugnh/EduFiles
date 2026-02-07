const { ipcRenderer } = require('electron');

let estudiantesEnNube = []; // Aquí guardaremos la lista que bajemos de Atlas

// Función para normalizar texto (quitar tildes y mayúsculas)
function normalizar(texto) {
    return texto ? texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
}

async function cargarDatosDeLaNube() {
    // Le pedimos al main.js que traiga los datos de MongoDB
    estudiantesEnNube = await ipcRenderer.invoke('obtener-estudiantes');
    renderResults(''); // Mostramos todos al iniciar
}

function renderResults(query) {
    const container = document.getElementById('resultados');
    if (!container) return;

    const filtro = normalizar(query);

    // Filtramos la lista que bajamos de la nube
    const matches = estudiantesEnNube.filter(s => {
        const nombreCompleto = normalizar(`${s.nombres} ${s.apellidos}`);
        return nombreCompleto.includes(filtro);
    });

    container.innerHTML = '';

    if (matches.length === 0) {
        container.innerHTML = '<p>No se encontraron estudiantes en la base de datos.</p>';
        return;
    }

    // Dibujamos los resultados
    for (const s of matches) {
        const div = document.createElement('div');
        div.className = 'resultado-item';
        div.style.padding = "10px";
        div.style.borderBottom = "1px solid #ccc";
        div.style.cursor = "pointer";

        // Usamos flex para alinear contenido (izquierda) y botón (derecha)
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";

        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `
            <strong>${s.nombres} ${s.apellidos}</strong> — ${s.curso || 'Sin curso'} <br>
            <small>Cédula: ${s.cedulaEstudiante} | Jornada: ${s.jornada}</small>
        `;

        const btnPrint = document.createElement('button');
        btnPrint.innerHTML = '<i class="fa-solid fa-print"></i>'; // Icono de imprimir
        btnPrint.className = "btn-print"; // Clase para estilos si se quiere mover al CSS

        // Estilos en línea por ahora para asegurar visibilidad rápida, se puede mover a CSS
        btnPrint.style.marginLeft = "10px";
        btnPrint.style.padding = "8px 12px";
        btnPrint.style.border = "none";
        btnPrint.style.background = "#2daae1";
        btnPrint.style.color = "white";
        btnPrint.style.borderRadius = "8px";
        btnPrint.style.cursor = "pointer";

        btnPrint.onclick = (e) => {
            e.stopPropagation(); // Evitar abrir el modal de ver registro
            imprimirEstudiante(s);
        };

        div.appendChild(infoDiv);
        div.appendChild(btnPrint);

        // Evento click para abrir la modal (en el div contenedor, excepto si se clica el boton)
        div.addEventListener('click', () => {
            const idUnico = s._id.toString();
            ipcRenderer.send('abrir-modal', 'detalle', { id: idUnico });
        });

        container.appendChild(div);
    }
}

function imprimirEstudiante(estudiante) {
    // Enviar al proceso principal para que abra la ventana de impresión
    ipcRenderer.send('abrir-impresion', {
        nombres: estudiante.nombres,
        apellidos: estudiante.apellidos,
        foto: estudiante.foto,
        cedulaEstudiante: estudiante.cedulaEstudiante,
        fechaNacimiento: estudiante.fechaNacimiento,
        edad: estudiante.edad,
        curso: estudiante.curso,
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

    // Cargamos los datos desde Atlas apenas abra la ventana
    cargarDatosDeLaNube();

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