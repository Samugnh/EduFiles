// Utilidades de almacenamiento y búsqueda de estudiantes.
// El proyecto usa nodeIntegration=true, por eso en el renderer se puede usar require().

const STORAGE_KEY = 'estudiantes'

function safeString(value) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function normalizeText(text) {
  // Lowercase + trim + remove accents/diacritics
  const base = safeString(text).trim().toLowerCase()
  // Unicode property escapes requieren un runtime moderno (Electron 38 lo soporta)
  return base.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

function normalizeStudent(raw) {
  if (!raw || typeof raw !== 'object') return raw

  const s = { ...raw }

  // Compatibilidad hacia atrás: versiones antiguas guardaban `nombre`.
  if (s.nombres === undefined && s.nombre !== undefined) {
    s.nombres = s.nombre
  }
  if (s.apellidos === undefined && s.apellido !== undefined) {
    s.apellidos = s.apellido
  }

  if (typeof s.edad === 'string' && s.edad.trim() !== '') {
    s.edad = Number(s.edad)
  }

  return s
}

function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const arr = Array.isArray(parsed) ? parsed : []
    return arr.map(normalizeStudent)
  } catch {
    return []
  }
}

function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
}

const COURSE_ORDER = {
  '1ro Bachillerato Tecnico': 1,
  '2do Bachillerato Tecnico': 2,
  '3ro Bachillerato Tecnico': 3,
}

function getCourseOrder(curso) {
  const key = safeString(curso)
  return COURSE_ORDER[key] ?? 99
}

function getFullName(estudiante) {
  const nombres = safeString(estudiante?.nombres)
  const apellidos = safeString(estudiante?.apellidos)
  return `${nombres} ${apellidos}`.trim()
}

function sortStudents(students) {
  const copy = [...students]

  copy.sort((a, b) => {
    const courseDiff = getCourseOrder(a?.curso) - getCourseOrder(b?.curso)
    if (courseDiff !== 0) return courseDiff

    const aLast = normalizeText(a?.apellidos)
    const bLast = normalizeText(b?.apellidos)
    if (aLast < bLast) return -1
    if (aLast > bLast) return 1

    const aFirst = normalizeText(a?.nombres)
    const bFirst = normalizeText(b?.nombres)
    if (aFirst < bFirst) return -1
    if (aFirst > bFirst) return 1

    return (a?.id ?? 0) - (b?.id ?? 0)
  })

  return copy
}

function addStudent(student) {
  const students = loadStudents()
  const toAdd = {
    ...student,
    id: student?.id ?? Date.now(),
  }

  students.push(toAdd)
  saveStudents(students)
  return toAdd
}

function updateStudent(updated) {
  const students = loadStudents()
  const id = updated?.id

  const idx = students.findIndex((s) => s?.id === id)
  if (idx === -1) return null

  students[idx] = { ...students[idx], ...updated }
  saveStudents(students)
  return students[idx]
}

function deleteStudent(id) {
  const students = loadStudents()
  const next = students.filter((s) => s?.id !== id)
  saveStudents(next)
  return next.length !== students.length
}

function findStudentsByQuery(query) {
  const q = normalizeText(query)
  if (!q) return sortStudents(loadStudents())

  const tokens = q.split(/\s+/).filter(Boolean)
  const students = loadStudents()

  const matches = students.filter((s) => {
    const full = normalizeText(getFullName(s))
    return tokens.every((t) => full.includes(t))
  })

  return sortStudents(matches)
}

module.exports = {
  STORAGE_KEY,
  loadStudents,
  saveStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  findStudentsByQuery,
  sortStudents,
  getFullName,
  normalizeText,
}
