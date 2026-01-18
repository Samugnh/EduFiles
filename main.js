function createModalWindow(tipo, payload) {
    if (ventanaModal) {
        ventanaModal.close();
    }

    ventanaModal = new BrowserWindow({
        width: tipo === 'detalle' ? 650 : 500,
        height: tipo === 'eliminar' ? 300 : 650,
        parent: mainWindow,
        modal: true,
        show: false, // Se crea oculta para evitar el parpadeo blanco
        resizable: false,
        icon: path.join(__dirname, 'icon-small.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // --- ESTA ES LA PARTE QUE FALTABA: CARGAR LOS ARCHIVOS ---
    if (tipo === 'agregar') {
        ventanaModal.loadFile('agregar-registro.html');
    } else if (tipo === 'modificar') {
        ventanaModal.loadFile('modificar-registro.html');
    } else if (tipo === 'eliminar') {
        ventanaModal.loadFile('eliminar-registro.html');
    } else if (tipo === 'detalle') {
        const id = payload && payload.id ? String(payload.id) : '';
        ventanaModal.loadFile('ver-registro.html', { query: { id: id } });
    }

    // --- MOSTRAR LA VENTANA CUANDO ESTÉ LISTA ---
    ventanaModal.once('ready-to-show', () => {
        ventanaModal.show();
    });

    ventanaModal.on('closed', () => {
        ventanaModal = null;
    });
}