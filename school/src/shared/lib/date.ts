export function formatDate(value?: string | Date | null) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function toDateInputValue(source: Date) {
  const year = source.getFullYear()
  const month = String(source.getMonth() + 1).padStart(2, '0')
  const day = String(source.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function toTimeInputValue(value?: string | null, withSeconds = false) {
  const fallback = withSeconds ? '07:30:00' : '07:30'

  if (!value) {
    return fallback
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return withSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`
}

export function toIsoDateTime(dateInput: string, timeInput: string) {
  const [year, month, day] = dateInput.split('-').map((item) => Number(item))
  const [hours, minutes, secondsRaw] = timeInput.split(':').map((item) => Number(item))
  const seconds = Number.isInteger(secondsRaw) ? secondsRaw : 0

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds)
  ) {
    return new Date().toISOString()
  }

  return new Date(year, month - 1, day, hours, minutes, seconds, 0).toISOString()
}
