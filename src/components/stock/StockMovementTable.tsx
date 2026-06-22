import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { formatDate } from '../../lib/formatters'
import { stockMovementLabels, stockMovementReference, stockMovementVariant } from '../../lib/stockMovements'
import type { ReadyStockMovementRow, ReadyStockRow } from '../../types/database'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { Table } from '../ui/Table'

const outgoing = new Set<ReadyStockMovementRow['movement_type']>(['saida_venda', 'saida_consignacao'])

export function StockMovementTable({ movements, products }: { movements: ReadyStockMovementRow[]; products: ReadyStockRow[] }) {
  if (movements.length === 0) return <EmptyState icon={ArrowDownToLine} title="Nenhuma movimentação registrada" description="Entradas, vendas, consignações, devoluções e ajustes aparecerão aqui." />
  const names = new Map(products.map((product) => [product.id, product.name]))
  return <Table headers={['Data', 'Produto', 'Movimento', 'Quantidade', 'Referência']}>
    {movements.map((movement) => {
      const isOutgoing = outgoing.has(movement.movement_type) || (movement.movement_type === 'ajuste_manual' && movement.description?.toLocaleLowerCase('pt-BR').includes('reducao'))
      return <tr key={movement.id}>
        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(movement.created_at)}</td>
        <td className="px-4 py-3"><strong className="block text-slate-900">{names.get(movement.ready_stock_id) ?? 'Produto removido'}</strong>{movement.description && <small className="mt-1 block max-w-xs text-slate-500">{movement.description}</small>}</td>
        <td className="px-4 py-3"><Badge variant={stockMovementVariant(movement.movement_type)}>{isOutgoing ? <ArrowUpFromLine className="mr-1" size={13} /> : <ArrowDownToLine className="mr-1" size={13} />}{stockMovementLabels[movement.movement_type]}</Badge></td>
        <td className={`whitespace-nowrap px-4 py-3 font-bold ${isOutgoing ? 'text-amber-700' : 'text-success'}`}>{isOutgoing ? '-' : '+'}{movement.quantity.toLocaleString('pt-BR')}</td>
        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{stockMovementReference(movement)}</td>
      </tr>
    })}
  </Table>
}
