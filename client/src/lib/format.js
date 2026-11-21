export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${String(value).replace(' ', 'T')}Z`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatMinutes(total) {
  if (!total) return '0 min'
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (!hours) return `${minutes} min`
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`
}

export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}
