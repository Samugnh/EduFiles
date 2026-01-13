const { ipcRenderer } = require('electron')
const store = require('./studentStore')

const DEFAULT_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="#e5e7eb"/>
      <circle cx="64" cy="50" r="22" fill="#9ca3af"/>
      <path d="M26 116c7-22 25-34 38-34h0c13 0 31 12 38 34" fill="#9ca3af"/>
  </svg>`
)}`

function createStudentCard(estudiante) {
  const el = document.createElement('div')
  el.className = 'cajon'

  el.style.cursor = 'pointer'
  el.addEventListener('click', () => {
    ipcRenderer.send('abrir-modal', 'detalle', { id: estudiante?.id })
  })

  const foto = document.createElement('img')
  foto.className = 'student-photo'
  foto.alt = 'Foto del estudiante'
  foto.src = estudiante?.foto || DEFAULT_PHOTO

  const name = document.createElement('div')
  name.className = 'student-name'
  name.textContent = store.getFullName(estudiante) || '(Sin nombre)'

  const course = document.createElement('div')
  course.className = 'student-course'
  course.textContent = estudiante?.curso ? String(estudiante.curso) : '(Sin curso)'

  el.appendChild(foto)
  el.appendChild(name)
  el.appendChild(course)

  return el
}

function render() {
  const container = document.getElementById('contenedorCarpetas')
  if (!container) return

  container.innerHTML = ''

  const students = store.sortStudents(store.loadStudents())

  if (students.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'cajon'
    empty.textContent = 'Aún no hay estudiantes registrados'
    container.appendChild(empty)
    return
  }

  for (const s of students) {
    container.appendChild(createStudentCard(s))
  }
}

document.addEventListener('DOMContentLoaded', () => {
  render()

  // Si el usuario agrega/modifica/elimina desde una ventana modal, refrescamos.
  ipcRenderer.on('registro-guardado', () => render())
  ipcRenderer.on('registro-modificado', () => render())
  ipcRenderer.on('registro-eliminado', () => render())
})
