import { Plus, Trash2 } from 'lucide-react'
import type { ConsignmentInput } from '../../hooks/useConsignments'
import { calculateConsignmentItem } from '../../lib/consignmentCalculations'
import { formatCurrency, parseNumberBR } from '../../lib/formatters'
import type { ClientRow, ReadyStockRow } from '../../types/database'
import { MoneyInput } from '../forms/MoneyInput'
import { NumberInput } from '../forms/NumberInput'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

interface Props {
  value: ConsignmentInput
  onChange: (value: ConsignmentInput) => void
  clients: ClientRow[]
  products: ReadyStockRow[]
  editing?: boolean
}

export function ConsignmentForm({ value, onChange, clients, products, editing = false }: Props) {
  const set = <K extends keyof ConsignmentInput>(key: K, next: ConsignmentInput[K]) => onChange({ ...value, [key]: next })
  const setItem = (index: number, changes: Partial<ConsignmentInput['items'][number]>) => set('items', value.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item))
  const total = value.items.reduce((sum, item) => {
    try { return sum + calculateConsignmentItem(item.quantitySent, 0, 0, item.unitPrice, 0).totalConsignedValue } catch { return sum }
  }, 0)

  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2">
      <Select label="Consignatário *" value={value.consigneeClientId} onChange={(event) => set('consigneeClientId', event.target.value)}>
        <option value="">Selecione</option>
        {clients.filter((client) => client.client_type === 'consignatario' || client.client_type === 'ambos').map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </Select>
      <Input label="Código do lote" placeholder="Gerado automaticamente" value={value.consignmentCode} onChange={(event) => set('consignmentCode', event.target.value)} />
      <Input type="date" label="Data de envio *" value={value.sentDate} onChange={(event) => set('sentDate', event.target.value)} />
      <Input type="date" label="Previsão de acerto" value={value.expectedSettlementDate} onChange={(event) => set('expectedSettlementDate', event.target.value)} />
      <Textarea containerClassName="md:col-span-2" label="Observações" value={value.notes} onChange={(event) => set('notes', event.target.value)} />
    </div>

    {!editing && <div>
      <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">Itens do lote</h3><Button type="button" variant="outline" className="min-h-9 px-3" onClick={() => set('items', [...value.items, { readyStockId: '', quantitySent: 1, unitPrice: 0 }])}><Plus size={16} />Adicionar item</Button></div>
      <div className="space-y-3">{value.items.map((item, index) => {
        const product = products.find((candidate) => candidate.id === item.readyStockId)
        return <div key={index} className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[minmax(0,1fr)_130px_160px_auto] md:items-end">
          <Select label="Produto *" value={item.readyStockId} onChange={(event) => { const selected = products.find((candidate) => candidate.id === event.target.value); setItem(index, { readyStockId: event.target.value, unitPrice: selected?.consignment_price || selected?.sale_price || 0 }) }}>
            <option value="">Selecione</option>
            {products.filter((candidate) => candidate.quantity_internal > 0 || candidate.id === item.readyStockId).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} ({candidate.quantity_internal} disponíveis)</option>)}
          </Select>
          <NumberInput label="Quantidade *" min="0.001" max={product?.quantity_internal} value={item.quantitySent} onChange={(event) => setItem(index, { quantitySent: parseNumberBR(event.target.value) })} />
          <MoneyInput label="Preço unitário" value={item.unitPrice} onChange={(event) => setItem(index, { unitPrice: parseNumberBR(event.target.value) })} />
          <Button type="button" variant="ghost" className="min-h-11 px-3 text-danger" disabled={value.items.length === 1} onClick={() => set('items', value.items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remover item"><Trash2 size={17} /></Button>
        </div>
      })}</div>
      <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm">Valor total consignado: <strong>{formatCurrency(total)}</strong></div>
    </div>}
  </div>
}
