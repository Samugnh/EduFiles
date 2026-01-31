const { app, BrowserWindow, ipcMain } = require('electron');
const mongoose = require('mongoose');
const path = require('path');

let mainWindow;

// Conexión a MongoDB Atlas
const mongoURI = "mongodb+srv://samugnh2022v_db_user:l4gIcrGTCG8L0nk8@cluster0.8p0grkz.mongodb.net/?appName=Cluster0";

mongoose.connect(mongoURI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('Error de conexión:', err));

const Estudiante = mongoose.model('Estudiante', new mongoose.Schema({
    nombres: String, apellidos: String, curso: String, edad: String,
    cedulaEstudiante: String, fechaNacimiento: String, sexo: String,
    jornada: String, anioLectivo: String, email: String, telefono: String,
    direccion: String, nombreRepresentante: String, cedulaRepresentante: String,
    telefonoRepresentante: String, foto: String, fechaRegistro: { type: Date, default: Date.now }
}));

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    mainWindow.loadFile('index.html');
}

function createModalWindow(type, data) {
    let modalWindow = new BrowserWindow({
        width: 850, height: 700, parent: mainWindow, modal: true, show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    const queryParams = (data && data.id) ? `?id=${data.id}` : '';

    let fileTarget = 'Registros.html';
    switch (type) {
        case 'detalle':
            fileTarget = 'ver-registro.html';
            break;
        case 'agregar':
            fileTarget = 'agregar-registro.html';
            break;
        case 'modificar':
            fileTarget = 'modificar-registro.html';
            break;
        case 'eliminar':
            fileTarget = 'eliminar-registro.html';
            break;
        default:
            fileTarget = 'Registros.html';
    }

    modalWindow.loadFile(path.join(__dirname, fileTarget), { search: queryParams });

    modalWindow.once('ready-to-show', () => {
        if (modalWindow && !modalWindow.isDestroyed()) modalWindow.show();
    });
}

ipcMain.handle('obtener-estudiantes', async () => {
    try {
        const docs = await Estudiante.find().sort({ fechaRegistro: -1 }).lean();
        // Convertir _id a string para evitar problemas de serialización en el renderer
        return docs.map(d => ({ ...d, _id: d._id.toString() }));
    }
    catch (err) {
        console.error("Error obteniendo estudiantes:", err);
        return [];
    }
});

// ESTA FUNCIÓN ES LA QUE EVITA QUE LA INFO SE REPITA
ipcMain.handle('obtener-estudiante-por-id', async (event, id) => {
    try {
        console.log("Buscando estudiante con ID:", id);
        const s = await Estudiante.findById(id).lean();
        if (s) {
            s._id = s._id.toString();
        }
        return s;
    }
    catch (err) {
        console.error("Error buscando estudiante por ID:", err);
        return null;
    }
});

ipcMain.on('guardar-registro', async (event, data) => {
    try {
        const nuevoEstudiante = new Estudiante(data);
        await nuevoEstudiante.save();

        // Avisar a la ventana principal para actualizar la vista
        if (mainWindow) {
            mainWindow.webContents.send('registro-guardado');
        }

        // Cerrar la ventana modal (la que envió el evento)
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) win.close();

    } catch (err) {
        console.error('Error al guardar estudiante:', err);
        // Opcional: enviar error de vuelta al renderer si quisieras mostrar alerta
    }
});

// MODIFICAR
ipcMain.on('modificar-registro', async (event, data) => {
    try {
        // data debe tener { id: "...", ...campos }
        // En mongoose usamos findByIdAndUpdate
        // data.id viene del renderer, asegúrate de que sea el _id de mongo o mapearlo
        const { id, ...resto } = data;

        await Estudiante.findByIdAndUpdate(id, resto);

        if (mainWindow) {
            mainWindow.webContents.send('registro-modificado');
        }

        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) win.close();

    } catch (err) {
        console.error('Error al modificar estudiante:', err);
    }
});

// ELIMINAR
ipcMain.on('eliminar-registro', async (event, id) => {
    try {
        await Estudiante.findByIdAndDelete(id);

        if (mainWindow) {
            mainWindow.webContents.send('registro-eliminado');
        }

        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) win.close();

    } catch (err) {
        console.error('Error al eliminar estudiante:', err);
    }
});

ipcMain.on('abrir-modal', (event, type, data) => createModalWindow(type, data));
ipcMain.on('cerrar-modal', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win && win !== mainWindow) win.close();
});

// IMPRIMIR
ipcMain.on('abrir-impresion', (event, estudiante) => {
    let printWindow = new BrowserWindow({
        width: 800, height: 600,
        parent: mainWindow, // Opcional, si quieres que esté "ligada"
        show: false, // Se muestra cuando esté lista
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    printWindow.loadFile(path.join(__dirname, 'imprimir.html'));

    printWindow.once('ready-to-show', () => {
        printWindow.show();
        // Enviar datos apenas esté lista la ventana
        printWindow.webContents.send('datos-impresion', estudiante);
    });
});

app.whenReady().then(createMainWindow);