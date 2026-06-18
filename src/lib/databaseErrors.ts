export class EntityInUseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EntityInUseError'
  }
}

export function getDatabaseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof EntityInUseError) return error.message
  if (!(error instanceof Error)) return fallback
  const message = error.message.toLowerCase()
  if (message.includes('schema cache') || message.includes('could not find the table')) return 'Banco ainda não configurado. Aplique as migrations do Supabase.'
  if (message.includes('row-level security')) return 'Você não tem permissão para alterar este registro.'
  if (message.includes('reserved stock')) return 'O novo peso não pode ser menor que a quantidade já reservada.'
  if (message.includes('foreign key') || message.includes('violates')) return 'Este registro está sendo utilizado e não pode ser excluído.'
  return fallback
}
