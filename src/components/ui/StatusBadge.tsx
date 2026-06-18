import { Badge } from './Badge'

const variants = { pendente: 'orange', aprovado: 'green', recusado: 'red', expirado: 'gray', baixado_estoque: 'blue' } as const
export function StatusBadge({ status }: { status: keyof typeof variants }) { return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge> }
