import type { ConsignmentItemRow, ConsignmentRow } from '../types/database'

export type ConsignmentItemStatus = ConsignmentItemRow['status']
export type ConsignmentStatus = ConsignmentRow['status']

function finite(value: number) {
  return Number.isFinite(value) ? value : 0
}

export function calculateConsignmentItem(
  quantitySent: number,
  quantitySold: number,
  quantityReturned: number,
  unitPrice: number,
  paidValue: number,
) {
  const sent = finite(quantitySent)
  const sold = finite(quantitySold)
  const returned = finite(quantityReturned)
  const price = finite(unitPrice)
  const paid = finite(paidValue)
  if (sent <= 0) throw new Error('A quantidade enviada deve ser maior que zero.')
  if (sold < 0 || returned < 0 || price < 0 || paid < 0) throw new Error('Quantidades e valores não podem ser negativos.')
  if (sold + returned > sent) throw new Error('A soma vendida e devolvida não pode superar a quantidade enviada.')

  const quantityRemaining = sent - sold - returned
  const totalConsignedValue = sent * price
  const soldValue = sold * price
  if (paid > soldValue) throw new Error('O valor pago não pode superar o valor vendido.')
  const openValue = soldValue - paid
  const status: ConsignmentItemStatus = sold <= 0
    ? quantityRemaining <= 0 ? 'devolvido' : 'em_consignacao'
    : openValue <= 0 ? 'vendido_pago'
    : paid > 0 ? 'parcialmente_pago'
    : 'vendido_nao_pago'

  return { quantityRemaining, totalConsignedValue, soldValue, paidValue: paid, openValue, status }
}

export function calculateConsignmentIndicators(consignments: Array<ConsignmentRow & { items: ConsignmentItemRow[] }>) {
  const active = consignments.filter((lot) => lot.status !== 'cancelado' && lot.status !== 'finalizado')
  return {
    piecesConsigned: active.reduce((sum, lot) => sum + lot.items.reduce((itemSum, item) => itemSum + finite(item.quantity_remaining), 0), 0),
    totalConsignedValue: active.reduce((sum, lot) => sum + finite(lot.total_consigned_value), 0),
    soldValue: consignments.filter((lot) => lot.status !== 'cancelado').reduce((sum, lot) => sum + finite(lot.total_sold_value), 0),
    paidValue: consignments.reduce((sum, lot) => sum + finite(lot.total_paid_value), 0),
    openValue: consignments.filter((lot) => lot.status !== 'cancelado').reduce((sum, lot) => sum + finite(lot.total_open_value), 0),
    activeLots: active.length,
  }
}
