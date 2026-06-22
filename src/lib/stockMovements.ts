import type { ConsignmentItemRow, ConsignmentRow, ReadyStockMovementRow, ReadyStockRow, SaleRow } from '../types/database'

export const stockMovementLabels: Record<ReadyStockMovementRow['movement_type'], string> = {
  entrada_manual: 'Entrada manual',
  entrada_orcamento: 'Entrada por orçamento',
  saida_venda: 'Saída por venda',
  saida_consignacao: 'Envio para consignação',
  devolucao_consignacao: 'Devolução de consignação',
  ajuste_manual: 'Ajuste manual',
  cancelamento_venda: 'Cancelamento de venda',
}

export function stockMovementVariant(type: ReadyStockMovementRow['movement_type']) {
  if (type === 'saida_venda' || type === 'saida_consignacao') return 'orange' as const
  if (type === 'devolucao_consignacao' || type === 'cancelamento_venda' || type === 'entrada_manual' || type === 'entrada_orcamento') return 'green' as const
  return 'blue' as const
}

export function stockMovementReference(movement: ReadyStockMovementRow) {
  if (movement.sale_id) return `Venda ${movement.sale_id.slice(0, 8).toUpperCase()}`
  if (movement.consignment_id) return `Consignação ${movement.consignment_id.slice(0, 8).toUpperCase()}`
  if (movement.budget_id) return `Orçamento ${movement.budget_id.slice(0, 8).toUpperCase()}`
  return 'Movimento manual'
}

export function calculateStockIndicators(
  products: ReadyStockRow[],
  sales: SaleRow[],
  consignments: Array<ConsignmentRow & { items: ConsignmentItemRow[] }>,
) {
  const activeConsignments = consignments.filter((lot) => lot.status !== 'cancelado' && lot.status !== 'finalizado')
  return {
    internalPieces: products.reduce((sum, product) => sum + safe(product.quantity_internal), 0),
    consignedPieces: products.reduce((sum, product) => sum + safe(product.quantity_consigned), 0),
    soldPieces: products.reduce((sum, product) => sum + safe(product.quantity_sold), 0),
    inventoryValue: products.reduce((sum, product) => sum + safe(product.quantity_internal) * safe(product.unit_cost), 0),
    consignedValue: activeConsignments.reduce((sum, lot) => sum + lot.items.reduce((itemSum, item) => itemSum + safe(item.quantity_remaining) * safe(item.consignment_unit_price), 0), 0),
    soldUnpaidValue: sales.filter((sale) => sale.payment_status !== 'cancelado').reduce((sum, sale) => sum + safe(sale.open_value), 0)
      + consignments.filter((lot) => lot.status !== 'cancelado').reduce((sum, lot) => sum + safe(lot.total_open_value), 0),
  }
}

function safe(value: number) { return Number.isFinite(value) ? value : 0 }
