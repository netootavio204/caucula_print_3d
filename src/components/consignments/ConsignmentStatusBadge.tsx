import type { ConsignmentRow } from '../../types/database'

const labels: Record<ConsignmentRow['status'], string> = {
  em_consignacao: 'Em consignação',
  parcialmente_vendido: 'Parcialmente vendido',
  vendido_nao_pago: 'Vendido não pago',
  vendido_pago: 'Vendido pago',
  parcialmente_pago: 'Parcialmente pago',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

export function ConsignmentStatusBadge({ status }: { status: ConsignmentRow['status'] }) {
  const color = status === 'cancelado'
    ? 'bg-red-50 text-red-700'
    : status === 'vendido_pago' || status === 'finalizado'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'parcialmente_pago' || status === 'vendido_nao_pago'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-blue-50 text-blue-700'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{labels[status]}</span>
}
