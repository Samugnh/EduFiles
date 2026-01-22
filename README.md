# 📁 EduFiles - Sistema de Gestión Estudiantil

**EduFiles** es una aplicación de escritorio robusta y moderna desarrollada con **Electron.js**, diseñada para simplificar la gestión de información estudiantil. Permite administrar registros académicos de manera eficiente, segura y local.

---

## ✨ Características Principales

*   **📋 Gestión Completa (CRUD):**
    *   **Crear:** Agrega nuevos estudiantes con detalles completos.
    *   **Leer:** Visualiza la lista de estudiantes organizada automáticamente.
    *   **Actualizar:** Modifica la información existente fácilmente.
    *   **Eliminar:** Borra registros obsoletos.
*   **🔍 Búsqueda Inteligente:** Filtra estudiantes por nombre o apellido en tiempo real.
*   **💾 Almacenamiento en la nube:** Los datos se guardan en una base de datos llamada MongoDB lo cual facilita el uso de la aplicacion en cualquier computadora.
*   **🎨 Interfaz Intuitiva:** Diseño limpio y fácil de usar.

---

## 🚀 Descarga e Instalación

### Opción 1: Ejecutable (Windows)
Para usar la aplicación inmediatamente sin configurar nada:
👉 **[Descargar EduFiles v1.0.0](https://github.com/Samugnh/EduFiles/releases/download/v.0.0/EduFiles.Setup.1.0.0.exe)**

### Opción 2: Para Desarrolladores (Código Fuente)

Si deseas explorar el código o contribuir, sigue estos pasos:

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Samugnh/EduFiles.git
    cd EduFiles
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Ejecutar en modo desarrollo:**
    ```bash
    npm start
    ```

---

## 🛠️ Tecnologías Utilizadas

*   **Core:** [Electron.js](https://www.electronjs.org/)
*   **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
*   **Persistencia:** Base de Datos(MongoDB)
*   **Control de Versiones:** Git & GitHub

---

## 📂 Estructura del Proyecto

*   `main.js`: Proceso principal de Electron.
*   `studentStore.js`: Lógica de almacenamiento y manipulación de datos.
*   `*.html`: Vistas de la aplicación (Lista, Agregar, Buscar, etc.).
*   `styles.css`: Estilos globales.

---

Hecho por [Samugnh](https://github.com/Samugnh)