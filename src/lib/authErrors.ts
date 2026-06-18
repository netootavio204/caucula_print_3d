export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback

  const message = error.message.toLowerCase()
  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (message.includes('user already registered')) return 'Já existe uma conta com este e-mail.'
  if (message.includes('password should be')) return 'A senha deve ter no mínimo 6 caracteres.'
  if (message.includes('rate limit')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (message.includes('failed to fetch') || message.includes('network')) return 'Não foi possível conectar ao serviço. Verifique sua internet.'
  return fallback
}
