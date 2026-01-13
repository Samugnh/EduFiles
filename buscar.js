const store = require('./studentStore')

function renderResults(query) {
  const container = document.getElementById('resultados')
  if (!container) return

  const matches = store.findStudentsByQuery(query)
  container.innerHTML = ''

  if (!query || !store.normalizeText(query)) {
    const title = document.createElement('p')
    title.textContent = 'Todos los estudiantes:'
    container.appendChild(title)
  }

  if (matches.length === 0) {
    const p = document.createElement('p')
    p.textContent = 'No se encontraron estudiantes con ese nombre/apellido.'
    container.appendChild(p)
    return
  }

  for (const s of matches) {
    const p = document.createElement('p')
    const full = store.getFullName(s)
    p.textContent = `${full} — ${s?.curso ?? ''}`.trim()
    container.appendChild(p)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('searchForm')
  const input = document.getElementById('searchInput')

  renderResults('')

  if (input) {
    input.addEventListener('input', () => {
      renderResults(input.value)
    })
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      renderResults(input?.value ?? '')
    })
  }
})
