// ESTO ES DE LA VENTANA PRINCIPAL
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const https = require('https');
const path = require('path');

let mainWindow; 
let ventanaModal;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// --- FUNCIÓN PARA VERIFICAR ACTUALIZACIONES ---
function verificarActualizacion() {
    const url = 'https://api.github.com/repos/Samugnh/EduFiles/releases/latest';
    
    https.get(url, { headers: { 'User-Agent': 'mi-app' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const release = JSON.parse(data);
                const versionNueva = release.tag_name.replace('v', '');
                const versionActual = app.getVersion();
                
                if (versionNueva > versionActual) {
                    dialog.showMessageBox({
                        type: 'info',
                        title: 'Actualización disponible',
                        message: `Hay una nueva versión disponible: ${versionNueva}\nTu versión actual: ${versionActual}`,
                        buttons: ['Descargar ahora', 'Más tarde']
                    }).then(result => {
                        if (result.response === 0) {
                            shell.openExternal(release.html_url);
                        }
                    });
                }
            } catch (error) {
                console.log('Error al verificar actualizaciones:', error);
            }
        });
    }).on('error', (error) => {
        console.log('Error de conexión:', error);
    });
}

// --- RESTO DEL CÓDIGO (FUNCIONES Y EVENTOS) ---

function createModalWindow(tipo, payload) {
    if (ventanaModal) {
        ventanaModal.close();
    }

    ventanaModal = new BrowserWindow({
        width: tipo === 'detalle' ? 650 : 500,
        height: tipo === 'eliminar' ? 300 : 650,
        parent: mainWindow,
        modal: true,
        show: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    if (tipo === 'agregar') {
        ventanaModal.loadFile('agregar-registro.html');
    } else if (tipo === 'modificar') {
        ventanaModal.loadFile('modificar-registro.html');
    } else if (tipo === 'eliminar') {
        ventanaModal.loadFile('eliminar-registro.html');
    } else if (tipo === 'detalle') {
        const id = payload && payload.id ? String(payload.id) : '';
        ventanaModal.loadFile('ver-registro.html', { query: { id } });
    }

    ventanaModal.once('ready-to-show', () => {
        ventanaModal.show();
    });

    ventanaModal.on('closed', () => {
        ventanaModal = null;
    });
}

app.whenReady().then(() => {
    createWindow();
    verificarActualizacion(); // ← NUEVA LÍNEA: Verifica actualizaciones al iniciar
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('abrir-modal', (event, tipo, payload) => {
    createModalWindow(tipo, payload);
});

ipcMain.on('guardar-registro', (event, datos) => {
    if (mainWindow) mainWindow.webContents.send('registro-guardado', datos);
    if (ventanaModal) ventanaModal.close();
});

ipcMain.on('modificar-registro', (event, datos) => {
    if (mainWindow) mainWindow.webContents.send('registro-modificado', datos);
    if (ventanaModal) ventanaModal.close();
});

ipcMain.on('eliminar-registro', (event, id) => {
    if (mainWindow) mainWindow.webContents.send('registro-eliminado', id);
    if (ventanaModal) ventanaModal.close();
});

ipcMain.on('cerrar-modal', () => {
    if (ventanaModal) ventanaModal.close();
});