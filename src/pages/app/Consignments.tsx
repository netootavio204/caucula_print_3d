import { Ban, Coins, Pencil, Plus, RotateCcw, ShoppingCart, Tags } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConsignmentForm } from '../../components/consignments/ConsignmentForm'
import { ConsignmentItemTable } from '../../components/consignments/ConsignmentItemTable'
import { ConsignmentStatusBadge } from '../../components/consignments/ConsignmentStatusBadge'
import { MoneyInput } from '../../components/forms/MoneyInput'
import { NumberInput } from '../../components/forms/NumberInput'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataError, DataLoading } from '../../components/ui/DataState'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { useClients } from '../../hooks/useClients'
import { useConsignments, type ConsignmentInput, type ConsignmentItemInput, type ConsignmentPaymentInput, type ConsignmentWithItems } from '../../hooks/useConsignments'
import { useReadyStock } from '../../hooks/useReadyStock'
import { calculateConsignmentIndicators, calculateConsignmentItem } from '../../lib/consignmentCalculations'
import { formatCurrency, formatDate, parseNumberBR } from '../../lib/formatters'
import type { ConsignmentItemRow, SaleRow } from '../../types/database'

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
const blank = (): ConsignmentInput => ({ consigneeClientId: '', consignmentCode: '', sentDate: today(), expectedSettlementDate: '', notes: '', items: [{ readyStockId: '', quantitySent: 1, unitPrice: 0 }] })
const blankItem = (): ConsignmentItemInput => ({ readyStockId: '', quantitySent: 1, unitPrice: 0 })
const blankPayment = (): ConsignmentPaymentInput => ({ amount: 0, paymentMethod: null, paymentDate: today(), notes: '' })

type QuantityAction = { kind: 'sale' | 'return'; item: ConsignmentItemRow }

export function Consignments() {
  const hook = useConsignments()
  const clients = useClients()
  const stock = useReadyStock()
  const { showToast } = useToast()
  const [form, setForm] = useState<ConsignmentInput | null>(null)
  const [editing, setEditing] = useState<ConsignmentWithItems | null>(null)
  const [addingTo, setAddingTo] = useState<ConsignmentWithItems | null>(null)
  const [newItem, setNewItem] = useState<ConsignmentItemInput>(blankItem())
  const [quantityAction, setQuantityAction] = useState<QuantityAction | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [paying, setPaying] = useState<ConsignmentItemRow | null>(null)
  const [payment, setPayment] = useState<ConsignmentPaymentInput>(blankPayment())
  const [canceling, setCanceling] = useState<ConsignmentWithItems | null>(null)
  const [busy, setBusy] = useState(false)
  const indicators = useMemo(() => calculateConsignmentIndicators(hook.consignments), [hook.consignments])
  const consignors = clients.clients.filter((client) => client.client_type === 'consignatario' || client.client_type === 'ambos')
  const error = hook.error ?? clients.error ?? stock.error

  const closeForm = () => { setForm(null); setEditing(null) }
  const openEdit = (lot: ConsignmentWithItems) => {
    setEditing(lot)
    setForm({ consigneeClientId: lot.consignee_client_id ?? '', consignmentCode: lot.consignment_code ?? '', sentDate: lot.sent_date, expectedSettlementDate: lot.expected_settlement_date ?? '', notes: lot.notes ?? '', items: [] })
  }
  const save = async () => {
    if (!form?.consigneeClientId || !form.sentDate) return showToast('Selecione o consignatário e informe a data de envio.', 'error')
    if (!editing) {
      if (form.items.length === 0 || form.items.some((item) => !item.readyStockId)) return showToast('Adicione ao menos um produto válido.', 'error')
      if (new Set(form.items.map((item) => item.readyStockId)).size !== form.items.length) return showToast('Não repita o mesmo produto no lote.', 'error')
      try { form.items.forEach((item) => calculateConsignmentItem(item.quantitySent, 0, 0, item.unitPrice, 0)) } catch (validationError) { return showToast(validationError instanceof Error ? validationError.message : 'Itens inválidos.', 'error') }
    }
    try {
      setBusy(true)
      if (editing) await hook.updateConsignment(editing.id, form)
      else await hook.createConsignment(form)
      await stock.reload()
      showToast(editing ? 'Lote atualizado com sucesso.' : 'Lote criado e estoque enviado para consignação.', 'success')
      closeForm()
    } catch (mutationError) { showToast(message(mutationError, 'Erro ao salvar lote.'), 'error') } finally { setBusy(false) }
  }
  const addItem = async () => {
    if (!addingTo || !newItem.readyStockId) return showToast('Selecione um produto.', 'error')
    try {
      calculateConsignmentItem(newItem.quantitySent, 0, 0, newItem.unitPrice, 0)
      setBusy(true)
      await hook.addItem(addingTo.id, newItem)
      await stock.reload()
      showToast('Item adicionado e enviado para consignação.', 'success')
      setAddingTo(null); setNewItem(blankItem())
    } catch (mutationError) { showToast(message(mutationError, 'Erro ao adicionar item.'), 'error') } finally { setBusy(false) }
  }
  const applyQuantity = async () => {
    if (!quantityAction) return
    if (quantity <= 0 || quantity > quantityAction.item.quantity_remaining) return showToast('Informe uma quantidade válida até o limite restante.', 'error')
    try {
      setBusy(true)
      if (quantityAction.kind === 'sale') await hook.registerSale(quantityAction.item.id, quantity)
      else await hook.registerReturn(quantityAction.item.id, quantity)
      await stock.reload()
      showToast(quantityAction.kind === 'sale' ? 'Venda consignada registrada.' : 'Devolução registrada e estoque interno atualizado.', 'success')
      setQuantityAction(null); setQuantity(1)
    } catch (mutationError) { showToast(message(mutationError, 'Erro ao atualizar item.'), 'error') } finally { setBusy(false) }
  }
  const registerPayment = async () => {
    if (!paying) return
    if (payment.amount <= 0 || payment.amount > paying.open_value) return showToast('O pagamento deve ser positivo e não superar o valor em aberto.', 'error')
    try {
      setBusy(true); await hook.registerPayment(paying.id, payment)
      showToast('Pagamento registrado com sucesso.', 'success')
      setPaying(null); setPayment(blankPayment())
    } catch (mutationError) { showToast(message(mutationError, 'Erro ao registrar pagamento.'), 'error') } finally { setBusy(false) }
  }
  const cancel = async () => {
    if (!canceling) return
    try {
      setBusy(true); await hook.cancelConsignment(canceling.id); await stock.reload()
      showToast('Lote cancelado e peças restantes devolvidas ao estoque.', 'success'); setCanceling(null)
    } catch (mutationError) { showToast(message(mutationError, 'Erro ao cancelar lote.'), 'error') } finally { setBusy(false) }
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">Consignação</h1><p className="text-sm text-slate-600">Controle lotes, peças, vendas, devoluções e pagamentos.</p></div><Button onClick={() => { setEditing(null); setForm(blank()) }} disabled={consignors.length === 0}><Plus size={18} />Novo lote</Button></div>
    {consignors.length === 0 && <Card className="border-amber-200 bg-amber-50"><strong>Cadastre um consignatário primeiro.</strong><p className="mt-1 text-sm text-slate-600">Em Meus clientes, defina o tipo como Consignatário ou Ambos para liberar a criação de lotes.</p></Card>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Metric label="Peças em consignação" value={indicators.piecesConsigned.toLocaleString('pt-BR')} /><Metric label="Valor total consignado" value={formatCurrency(indicators.totalConsignedValue)} /><Metric label="Valor vendido" value={formatCurrency(indicators.soldValue)} /><Metric label="Valor pago" value={formatCurrency(indicators.paidValue)} /><Metric label="Valor em aberto" value={formatCurrency(indicators.openValue)} /><Metric label="Lotes ativos" value={String(indicators.activeLots)} /></div>
    {hook.loading || clients.loading || stock.loading ? <DataLoading /> : error ? <DataError message={error} /> : hook.consignments.length === 0 ? <EmptyState icon={Tags} title="Nenhum lote de consignação" description="Crie um lote para enviar produtos do estoque pronto a um consignatário." /> : <div className="space-y-5">{hook.consignments.map((lot) => {
      const clientName = clients.clients.find((client) => client.id === lot.consignee_client_id)?.name ?? 'Consignatário não encontrado'
      const closed = lot.status === 'cancelado' || lot.status === 'finalizado'
      return <Card key={lot.id} className={lot.status === 'cancelado' ? 'opacity-75' : ''}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{lot.consignment_code || 'Lote'}</h2><ConsignmentStatusBadge status={lot.status} /></div><p className="mt-1 text-sm text-slate-600">{clientName} · enviado em {formatDate(lot.sent_date)}{lot.expected_settlement_date ? ` · acerto em ${formatDate(lot.expected_settlement_date)}` : ''}</p>{lot.notes && <p className="mt-2 text-sm text-slate-500">{lot.notes}</p>}</div>
          {!closed && <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-9 px-3" onClick={() => openEdit(lot)}><Pencil size={16} />Editar</Button><Button variant="outline" className="min-h-9 px-3" onClick={() => { setAddingTo(lot); setNewItem(blankItem()) }}><Plus size={16} />Item</Button>{lot.total_sold_value <= 0 && <Button variant="ghost" className="min-h-9 px-3 text-danger" onClick={() => setCanceling(lot)}><Ban size={16} />Cancelar</Button>}</div>}
        </div>
        <div className="my-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><LotValue label="Consignado" value={lot.total_consigned_value} /><LotValue label="Vendido" value={lot.total_sold_value} /><LotValue label="Pago" value={lot.total_paid_value} /><LotValue label="Em aberto" value={lot.total_open_value} /></div>
        <ConsignmentItemTable items={lot.items} disabled={closed} onSale={(item) => { setQuantityAction({ kind: 'sale', item }); setQuantity(1) }} onReturn={(item) => { setQuantityAction({ kind: 'return', item }); setQuantity(1) }} onPayment={(item) => { setPaying(item); setPayment({ ...blankPayment(), amount: item.open_value }) }} />
      </Card>
    })}</div>}

    <Modal size="xl" open={Boolean(form)} onClose={closeForm} title={editing ? 'Editar lote' : 'Novo lote de consignação'} footer={<><Button variant="outline" onClick={closeForm}>Cancelar</Button><Button loading={busy} onClick={() => void save()}>Salvar lote</Button></>}>{form && <ConsignmentForm value={form} onChange={setForm} clients={clients.clients} products={stock.products} editing={Boolean(editing)} />}</Modal>
    <Modal open={Boolean(addingTo)} onClose={() => setAddingTo(null)} title="Adicionar item ao lote" footer={<><Button variant="outline" onClick={() => setAddingTo(null)}>Cancelar</Button><Button loading={busy} onClick={() => void addItem()}>Adicionar item</Button></>}><ItemFields value={newItem} onChange={setNewItem} products={stock.products} /></Modal>
    <Modal open={Boolean(quantityAction)} onClose={() => setQuantityAction(null)} title={quantityAction?.kind === 'sale' ? 'Registrar venda consignada' : 'Registrar devolução'} footer={<><Button variant="outline" onClick={() => setQuantityAction(null)}>Cancelar</Button><Button loading={busy} onClick={() => void applyQuantity()}>{quantityAction?.kind === 'sale' ? <ShoppingCart size={17} /> : <RotateCcw size={17} />}Confirmar</Button></>}><NumberInput label={`Quantidade (restante: ${quantityAction?.item.quantity_remaining ?? 0})`} min="0.001" max={quantityAction?.item.quantity_remaining} value={quantity} onChange={(event) => setQuantity(parseNumberBR(event.target.value))} /></Modal>
    <Modal open={Boolean(paying)} onClose={() => setPaying(null)} title="Registrar pagamento" footer={<><Button variant="outline" onClick={() => setPaying(null)}>Cancelar</Button><Button loading={busy} onClick={() => void registerPayment()}><Coins size={17} />Registrar</Button></>}><div className="grid gap-4"><MoneyInput label={`Valor (em aberto: ${formatCurrency(paying?.open_value ?? 0)})`} value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: parseNumberBR(event.target.value) })} /><Select label="Forma de pagamento" value={payment.paymentMethod ?? ''} onChange={(event) => setPayment({ ...payment, paymentMethod: (event.target.value || null) as SaleRow['payment_method'] })}><option value="">Não informado</option>{['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'outro'].map((method) => <option key={method} value={method}>{method.replaceAll('_', ' ')}</option>)}</Select><Input type="date" label="Data" value={payment.paymentDate} onChange={(event) => setPayment({ ...payment, paymentDate: event.target.value })} /><Textarea label="Observações" value={payment.notes} onChange={(event) => setPayment({ ...payment, notes: event.target.value })} /></div></Modal>
    <ConfirmDialog open={Boolean(canceling)} title="Cancelar lote?" description="Todas as peças ainda restantes serão devolvidas ao estoque interno. Peças vendidas impedem o cancelamento." confirmLabel="Cancelar lote" onCancel={() => setCanceling(null)} onConfirm={() => void cancel()} />
  </div>
}

function ItemFields({ value, onChange, products }: { value: ConsignmentItemInput; onChange: (value: ConsignmentItemInput) => void; products: ReturnType<typeof useReadyStock>['products'] }) {
  const product = products.find((candidate) => candidate.id === value.readyStockId)
  return <div className="grid gap-4"><Select label="Produto *" value={value.readyStockId} onChange={(event) => { const selected = products.find((candidate) => candidate.id === event.target.value); onChange({ ...value, readyStockId: event.target.value, unitPrice: selected?.consignment_price || selected?.sale_price || 0 }) }}><option value="">Selecione</option>{products.filter((candidate) => candidate.quantity_internal > 0).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} ({candidate.quantity_internal} disponíveis)</option>)}</Select><NumberInput label="Quantidade enviada *" min="0.001" max={product?.quantity_internal} value={value.quantitySent} onChange={(event) => onChange({ ...value, quantitySent: parseNumberBR(event.target.value) })} /><MoneyInput label="Preço consignado unitário" value={value.unitPrice} onChange={(event) => onChange({ ...value, unitPrice: parseNumberBR(event.target.value) })} /></div>
}
function Metric({ label, value }: { label: string; value: string }) { return <Card><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card> }
function LotValue({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-slate-50 p-3"><small className="text-slate-500">{label}</small><strong className="mt-1 block">{formatCurrency(value)}</strong></div> }
function message(error: unknown, fallback: string) { return error instanceof Error ? error.message.replace('Estoque', 'Estoque') : fallback }
