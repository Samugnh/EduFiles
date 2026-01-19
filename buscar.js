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
        div.className = 'resultado-item'; // Puedes darle estilo en styles.css
        div.style.padding = "10px";
        div.style.borderBottom = "1px solid #ccc";
        
        div.innerHTML = `
            <strong>${s.nombres} ${s.apellidos}</strong> — ${s.curso || 'Sin curso'} <br>
            <small>Cédula: ${s.cedulaEstudiante} | Jornada: ${s.jornada}</small>
        `;
        container.appendChild(div);
    }
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