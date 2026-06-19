export function buildWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, '')
  const number = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits
  if (number.length < 10) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
