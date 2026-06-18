export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(value) ? value : 0)
}

export function parseCurrency(value: string): number {
  return parseNumberBR(value.replace(/R\$\s?/g, ''))
}

export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(date)
}

export function parseNumberBR(value: string | number): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const compact = value.trim().replace(/\s/g, '')
  const normalized = compact.includes(',') ? compact.replace(/\./g, '').replace(',', '.') : compact
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}
