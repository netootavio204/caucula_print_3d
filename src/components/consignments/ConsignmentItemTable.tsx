import { Coins, RotateCcw, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'
import type { ConsignmentItemRow } from '../../types/database'
import { Button } from '../ui/Button'
import { PaymentStatusBadge } from '../sales/PaymentStatusBadge'

interface Props {
  items: ConsignmentItemRow[]
  disabled?: boolean
  onSale: (item: ConsignmentItemRow) => void
  onReturn: (item: ConsignmentItemRow) => void
  onPayment: (item: ConsignmentItemRow) => void
}

function paymentStatus(item: ConsignmentItemRow) {
  if (item.sold_value <= 0 || item.paid_value <= 0) return 'nao_pago' as const
  return item.open_value > 0 ? 'parcialmente_pago' as const : 'pago' as const
}

export function ConsignmentItemTable({ items, disabled = false, onSale, onReturn, onPayment }: Props) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm">
    <thead><tr className="border-b border-border text-xs uppercase text-slate-500"><th className="px-3 py-3">Produto</th><th className="px-3 py-3">Enviadas</th><th className="px-3 py-3">Vendidas</th><th className="px-3 py-3">Devolvidas</th><th className="px-3 py-3">Restantes</th><th className="px-3 py-3">Preço</th><th className="px-3 py-3">Vendido</th><th className="px-3 py-3">Pago</th><th className="px-3 py-3">Em aberto</th><th className="px-3 py-3">Ações</th></tr></thead>
    <tbody>{items.map((item) => <tr key={item.id} className="border-b border-border last:border-0">
      <td className="px-3 py-4"><strong className="block">{item.product_name}</strong><small className="text-slate-500">{item.product_code || 'Sem código'}</small><span className="mt-1 block"><PaymentStatusBadge status={paymentStatus(item)} /></span></td>
      <td className="px-3 py-4">{item.quantity_sent}</td><td className="px-3 py-4">{item.quantity_sold}</td><td className="px-3 py-4">{item.quantity_returned}</td><td className="px-3 py-4 font-semibold">{item.quantity_remaining}</td>
      <td className="px-3 py-4">{formatCurrency(item.consignment_unit_price)}</td><td className="px-3 py-4">{formatCurrency(item.sold_value)}</td><td className="px-3 py-4 text-success">{formatCurrency(item.paid_value)}</td><td className="px-3 py-4 font-semibold text-amber-700">{formatCurrency(item.open_value)}</td>
      <td className="px-3 py-4"><div className="flex gap-2"><Button variant="outline" className="min-h-9 px-2" disabled={disabled || item.quantity_remaining <= 0} onClick={() => onSale(item)} title="Registrar venda"><ShoppingCart size={15} /></Button><Button variant="outline" className="min-h-9 px-2" disabled={disabled || item.quantity_remaining <= 0} onClick={() => onReturn(item)} title="Registrar devolução"><RotateCcw size={15} /></Button><Button variant="outline" className="min-h-9 px-2" disabled={disabled || item.open_value <= 0} onClick={() => onPayment(item)} title="Registrar pagamento"><Coins size={15} /></Button></div></td>
    </tr>)}</tbody>
  </table></div>
}
