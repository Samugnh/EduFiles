const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const https = require('https');
const pkg = require('./package.json');

let mainWindow;

// Compara la versión local con la del repo en GitHub
// Si hay una más nueva, le avisamos al usuario con un banner
function verificarActualizaciones() {
    const url = 'https://raw.githubusercontent.com/Samugnh/EduFiles/main/package.json';

    https.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            try {
                const remotePkg = JSON.parse(body);
                if (remotePkg.version !== pkg.version) {
                    console.log(`Hay una actualización disponible: v${remotePkg.version}`);
                    if (mainWindow) {
                        mainWindow.webContents.send('nueva-version', {
                            local: pkg.version,
                            remota: remotePkg.version,
                            url: 'https://github.com/Samugnh/EduFiles'
                        });
                    }
                }
            } catch (e) {
                console.error('No se pudo leer el package.json remoto:', e);
            }
        });
    }).on('error', (err) => {
        console.error('Sin internet o error de red al buscar updates:', err);
    });
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    // Siempre empezamos por el login
    mainWindow.loadFile('login.html');

    // Le damos unos segundos para que cargue antes de buscar actualizaciones
    setTimeout(verificarActualizaciones, 3000);
}

// Abre una ventana modal según el tipo: detalle, agregar, modificar o eliminar
function createModalWindow(type, data) {
    let modalWindow = new BrowserWindow({
        width: 850, height: 700, parent: mainWindow, modal: true, show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    const queryParams = (data && data.id) ? `?id=${data.id}` : '';

    let fileTarget = 'Registros.html';
    switch (type) {
        case 'detalle':   fileTarget = 'ver-registro.html'; break;
        case 'agregar':   fileTarget = 'agregar-registro.html'; break;
        case 'modificar': fileTarget = 'modificar-registro.html'; break;
        case 'eliminar':  fileTarget = 'eliminar-registro.html'; break;
        default:          fileTarget = 'Registros.html';
    }

    modalWindow.loadFile(path.join(__dirname, fileTarget), { search: queryParams });

    modalWindow.once('ready-to-show', () => {
        if (modalWindow && !modalWindow.isDestroyed()) modalWindow.show();
    });
}

// --- Manejo de mensajes desde el renderer ---

ipcMain.on('abrir-modal', (event, type, data) => createModalWindow(type, data));

ipcMain.on('cerrar-modal', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win && win !== mainWindow) win.close();
});

// El renderer terminó una operación y quiere avisar a la ventana principal
ipcMain.on('registro-guardado', () => {
    if (mainWindow) mainWindow.webContents.send('registro-guardado');
});

ipcMain.on('registro-modificado', () => {
    if (mainWindow) mainWindow.webContents.send('registro-modificado');
});

ipcMain.on('registro-eliminado', () => {
    if (mainWindow) mainWindow.webContents.send('registro-eliminado');
});

// Cierra el modal y de paso manda el evento a la ventana principal para recargar
ipcMain.on('cerrar-modal-y-notificar', (event, tipo) => {
    if (mainWindow) mainWindow.webContents.send(tipo);
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
});

// Abre una ventana dediacada solo para imprimir la ficha del estudiante
ipcMain.on('abrir-impresion', (event, estudiante) => {
    let printWindow = new BrowserWindow({
        width: 800, height: 600,
        parent: mainWindow,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    printWindow.loadFile(path.join(__dirname, 'imprimir.html'));

    printWindow.once('ready-to-show', () => {
        printWindow.show();
        printWindow.webContents.send('datos-impresion', estudiante);
    });
});

// Para los links que van al navegador externo (ej. GitHub)
ipcMain.on('abrir-link-externo', (event, url) => {
    shell.openExternal(url);
});

app.whenReady().then(createMainWindow);