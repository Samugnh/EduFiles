const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const https = require('https');
const path = require('path');
const mongoose = require('mongoose'); // <--- Añadido para la base de datos

// --- CONFIGURACIÓN DE MONGODB ---

const mongoURI = 'mongodb+srv://samugnh2022v_db_user:l4glcrTCG8L0nk8@cluster0.abcde.mongodb.net/EduFiles?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('Error de conexión:', err));

// Definimos el esquema del Estudiante para la nube
const EstudianteSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    cedula: String,
    curso: String,
    fechaRegistro: { type: Date, default: Date.now }
});

const Estudiante = mongoose.model('Estudiante', EstudianteSchema);

let mainWindow;
let ventanaModal;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    icon: path.join(__dirname, 'icon-small.ico'), 
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
                        message: `Hay una versión nueva: ${versionNueva}`,
                        buttons: ['Descargar', 'Más tarde']
                    }).then(result => {
                        if (result.response === 0) shell.openExternal(release.html_url);
                    });
                }
            } catch (e) { console.log(e); }
        });
    });
}

function createModalWindow(tipo, payload) {
    if (ventanaModal) ventanaModal.close();

    ventanaModal = new BrowserWindow({
        width: tipo === 'detalle' ? 650 : 500,
        height: tipo === 'eliminar' ? 300 : 650,
        parent: mainWindow,
        modal: true,
        show: false,
        resizable: false,
        icon: path.join(__dirname, 'icon-small.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    if (tipo === 'agregar') ventanaModal.loadFile('agregar-registro.html');
    else if (tipo === 'modificar') ventanaModal.loadFile('modificar-registro.html');
    else if (tipo === 'eliminar') ventanaModal.loadFile('eliminar-registro.html');
    else if (tipo === 'detalle') {
        const id = payload && payload.id ? String(payload.id) : '';
        ventanaModal.loadFile('ver-registro.html', { query: { id: id } });
    }

    ventanaModal.once('ready-to-show', () => ventanaModal.show());
    ventanaModal.on('closed', () => ventanaModal = null);
}

app.whenReady().then(() => {
    createWindow();
    verificarActualizacion();
});

// --- EVENTOS IPC ACTUALIZADOS PARA LA NUBE ---

ipcMain.on('abrir-modal', (event, tipo, payload) => {
    createModalWindow(tipo, payload);
});

// 1. GUARDAR EN LA NUBE
ipcMain.on('guardar-registro', async (event, datos) => {
    try {
        const nuevoEstudiante = new Estudiante(datos);
        await nuevoEstudiante.save();
        if (mainWindow) mainWindow.webContents.send('registro-guardado', datos);
        if (ventanaModal) ventanaModal.close();
    } catch (err) {
        console.error('Error al guardar:', err);
    }
});

// 2. MODIFICAR EN LA NUBE
ipcMain.on('modificar-registro', async (event, datos) => {
    try {
        await Estudiante.findByIdAndUpdate(datos.id, datos);
        if (mainWindow) mainWindow.webContents.send('registro-modificado', datos);
        if (ventanaModal) ventanaModal.close();
    } catch (err) {
        console.error('Error al modificar:', err);
    }
});

// 3. ELIMINAR DE LA NUBE
ipcMain.on('eliminar-registro', async (event, id) => {
    try {
        await Estudiante.findByIdAndDelete(id);
        if (mainWindow) mainWindow.webContents.send('registro-eliminado', id);
        if (ventanaModal) ventanaModal.close();
    } catch (err) {
        console.error('Error al eliminar:', err);
    }
});

ipcMain.on('cerrar-modal', () => {
    if (ventanaModal) ventanaModal.close();
});