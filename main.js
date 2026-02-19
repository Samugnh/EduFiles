const { app, BrowserWindow, ipcMain, shell } = require('electron');
const mongoose = require('mongoose');
const path = require('path');
const https = require('https');
const pkg = require('./package.json');

let mainWindow;

// --- SISTEMA DE ACTUALIZACIONES (GITHUB) ---
// Comprobamos si hay una nueva versión comparando nuestro package.json con el de GitHub
function verificarActualizaciones() {
    const url = 'https://raw.githubusercontent.com/Samugnh/EduFiles/main/package.json';

    https.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            try {
                const remotePkg = JSON.parse(body);
                const localVersion = pkg.version;
                const remoteVersion = remotePkg.version;

                if (remoteVersion !== localVersion) {
                    console.log(`[Update] Nueva versión disponible: ${remoteVersion}`);
                    if (mainWindow) {
                        mainWindow.webContents.send('nueva-version', {
                            local: localVersion,
                            remota: remoteVersion,
                            url: 'https://github.com/Samugnh/EduFiles'
                        });
                    }
                }
            } catch (e) {
                console.error('Error al verificar versión remota:', e);
            }
        });
    }).on('error', (err) => {
        console.error('Error de red al buscar actualizaciones:', err);
    });
}

// Configuramos la conexión a nuestra base de datos en la nube (MongoDB Atlas)
const mongoURI = "mongodb+srv://samugnh2022v_db_user:l4gIcrGTCG8L0nk8@cluster0.8p0grkz.mongodb.net/?appName=Cluster0";

// Intentamos conectarnos a la base de datos. Si algo falla, lo avisamos en la consola.
mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log('¡Conexión exitosa a MongoDB Atlas!');
    })
    .catch(err => {
        console.error('Oye, hubo un problema al conectar con la base de datos:', err);
    });

// Aquí definimos qué datos vamos a guardar de cada estudiante
const Estudiante = mongoose.model('Estudiante', new mongoose.Schema({
    nombres: String, apellidos: String, curso: String, paralelo: String, edad: String,
    cedulaEstudiante: String, fechaNacimiento: String, sexo: String,
    jornada: String, anioLectivo: String, email: String, telefono: String,
    direccion: String, nombreRepresentante: String, cedulaRepresentante: String,
    telefonoRepresentante: String, foto: String, fechaRegistro: { type: Date, default: Date.now },
    // Nuevos campos
    codigoEstudiante: String, nacionalidad: String, etnia: String, discapacidad: String,
    direccionRepresentante: String, descripcionObservaciones: String
}));

const Usuario = mongoose.model('Usuario', new mongoose.Schema({
    usuario: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: String,
    fechaCreacion: { type: Date, default: Date.now }
}));

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    // Empezamos siempre por la pantalla de login para mayor seguridad
    mainWindow.loadFile('login.html');

    // Revisamos si hay actualizaciones después de un par de segundos de abrir
    setTimeout(verificarActualizaciones, 3000);
}

// Esta función se encarga de abrir las ventanitas pequeñas (modales) para agregar, ver o editar
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

// COMUNICACIÓN CON EL FRONTEND (IPC)

// Manejador para registrar nuevos usuarios en el sistema
ipcMain.handle('registrar-usuario', async (event, data) => {
    // Si no hay internet o conexión, le avisamos al usuario para que no se quede esperando
    if (mongoose.connection.readyState !== 1) {
        return { success: false, error: "Parece que no hay conexión. Revisa tu internet o la configuración de Atlas." };
    }
    try {
        const nuevoUsuario = new Usuario(data);
        await nuevoUsuario.save();
        return { success: true };
    } catch (err) {
        console.error("No se pudo crear el usuario:", err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('login-usuario', async (event, { usuario, password }) => {
    if (mongoose.connection.readyState !== 1) {
        return { success: false, error: "No hay conexión con la base de datos. Verifica tu conexión a internet o la whitelist de IP en MongoDB Atlas." };
    }
    try {
        const user = await Usuario.findOne({ usuario, password });
        if (user) {
            // VERIFICACIÓN DE EXPIRACIÓN (solo para usuarios que terminan en punto '.')
            if (usuario.endsWith('.')) {
                let fechaInicio = user.fechaPrimerLogin;

                // Si es su primera vez entrando, grabamos la fecha de hoy
                if (!fechaInicio) {
                    fechaInicio = new Date();
                    await Usuario.findByIdAndUpdate(user._id, { fechaPrimerLogin: fechaInicio });
                    console.log(`Periodo de prueba iniciado para: ${usuario} el ${fechaInicio}`);
                }

                // Calculamos cuántos días han pasado
                const hoy = new Date();
                const diferenciaTiempo = hoy.getTime() - new Date(fechaInicio).getTime();
                const diferenciaDias = diferenciaTiempo / (1000 * 3600 * 24);

                if (diferenciaDias > 7) {
                    console.warn(`Intento de login fallido: La cuenta ${usuario} ha expirado.`);
                    return {
                        success: false,
                        error: "Su periodo de acceso ha expirado. Por favor, contacte con el administrador."
                    };
                }
            }
            return { success: true };
        } else {
            return { success: false, error: "Credenciales inválidas" };
        }
    } catch (err) {
        console.error("Error en login:", err);
        return { success: false, error: "Error de servidor al intentar iniciar sesión." };
    }
});

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