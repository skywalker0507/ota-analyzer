export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/** Coerce protobuf number/Long values into a plain number for math/display. */
export function toNumericSize(value: unknown): number {
  if (value == null) {
    return 0
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'object' && value !== null) {
    const longLike = value as { toNumber?: () => number; low?: number; high?: number }
    if (typeof longLike.toNumber === 'function') {
      return longLike.toNumber()
    }
    if (typeof longLike.low === 'number') {
      return longLike.low + (longLike.high ?? 0) * 4294967296
    }
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.URL.revokeObjectURL(url)
}
