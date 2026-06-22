import { History, ImagePlus, Minus, PackageCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoneyInput } from '../../components/forms/MoneyInput'
import { NumberInput } from '../../components/forms/NumberInput'
import { StockMovementTable } from '../../components/stock/StockMovementTable'
import { Badge } from '../../components/ui/Badge'
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
import { useConsignments } from '../../hooks/useConsignments'
import { useProjects } from '../../hooks/useProjects'
import { useReadyStock, type ReadyStockInput } from '../../hooks/useReadyStock'
import { useReadyStockMovements } from '../../hooks/useReadyStockMovements'
import { useSales } from '../../hooks/useSales'
import { getDatabaseErrorMessage } from '../../lib/databaseErrors'
import { formatCurrency, parseNumberBR } from '../../lib/formatters'
import { calculateStockIndicators } from '../../lib/stockMovements'
import type { ReadyStockRow } from '../../types/database'

const empty: ReadyStockInput = { projectModelId: null, name: '', quantity: 1, unitCost: 0, salePrice: 0, imageUrl: '', notes: '' }
const stockStatus = { disponivel: 'Disponível', em_consignacao: 'Em consignação', vendido: 'Vendido', esgotado: 'Esgotado', oculto: 'Oculto' }

export function Stock() {
  const stock = useReadyStock()
  const movements = useReadyStockMovements()
  const sales = useSales()
  const consignments = useConsignments()
  const projects = useProjects()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ReadyStockInput>(empty)
  const [editing, setEditing] = useState<ReadyStockRow | null>(null)
  const [deleting, setDeleting] = useState<ReadyStockRow | null>(null)
  const [selling, setSelling] = useState<ReadyStockRow | null>(null)
  const [saleQuantity, setSaleQuantity] = useState(1)
  const [deduct, setDeduct] = useState(false)
  const [saving, setSaving] = useState(false)
  const indicators = useMemo(() => calculateStockIndicators(stock.products, sales.sales, consignments.consignments), [stock.products, sales.sales, consignments.consignments])
  const set = <K extends keyof ReadyStockInput>(key: K, value: ReadyStockInput[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const close = () => { setOpen(false); setEditing(null); setDraft(empty); setDeduct(false) }
  const startEdit = (product: ReadyStockRow) => {
    setEditing(product)
    setDraft({ projectModelId: product.project_model_id, name: product.name, quantity: product.quantity_internal, unitCost: product.unit_cost, salePrice: product.sale_price, imageUrl: product.image_url ?? '', notes: product.notes ?? '' })
    setOpen(true)
  }
  const save = async () => {
    if (!draft.name.trim() || draft.quantity <= 0 || draft.unitCost < 0 || draft.salePrice < 0) return showToast('Preencha nome, quantidade e valores corretamente.', 'error')
    if (deduct && !draft.projectModelId) return showToast('Selecione um modelo para dar baixa automática.', 'error')
    setSaving(true)
    try {
      await stock.saveProduct(draft, editing?.id, !editing && deduct)
      await movements.reload()
      showToast(editing ? 'Produto atualizado com sucesso.' : 'Produto adicionado ao estoque.', 'success')
      close()
    } catch (error) { showToast(getDatabaseErrorMessage(error, error instanceof Error ? error.message : 'Erro ao salvar produto.'), 'error') } finally { setSaving(false) }
  }
  const remove = async () => {
    if (!deleting) return
    try { await stock.deleteProduct(deleting.id); await movements.reload(); showToast('Produto removido do estoque.', 'success'); setDeleting(null) }
    catch (error) { showToast(getDatabaseErrorMessage(error, 'Este produto possui vínculos e não pode ser removido.'), 'error') }
  }
  const sell = async () => {
    if (!selling) return
    try {
      await stock.sellProduct(selling, saleQuantity)
      await movements.reload()
      showToast('Quantidade vendida baixada com sucesso.', 'success')
      setSelling(null); setSaleQuantity(1)
    } catch (error) { showToast(getDatabaseErrorMessage(error, error instanceof Error ? error.message : 'Erro ao baixar venda.'), 'error') }
  }
  const loading = stock.loading || projects.loading || sales.loading || consignments.loading
  const error = stock.error ?? projects.error ?? sales.error ?? consignments.error

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Estoque de produtos prontos</h1><p className="mt-1 text-sm text-slate-600">Acompanhe peças internas, consignadas, vendidas e todo o histórico de movimentações.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Metric label="Peças em estoque interno" value={indicators.internalPieces.toLocaleString('pt-BR')} />
      <Metric label="Peças em consignação" value={indicators.consignedPieces.toLocaleString('pt-BR')} />
      <Metric label="Peças vendidas" value={indicators.soldPieces.toLocaleString('pt-BR')} />
      <Metric label="Valor parado em estoque" value={formatCurrency(indicators.inventoryValue)} />
      <Metric label="Valor em consignação" value={formatCurrency(indicators.consignedValue)} />
      <Metric label="Valor vendido não pago" value={formatCurrency(indicators.soldUnpaidValue)} />
    </div>

    <Card title="Produtos prontos" description="Controle peças disponíveis para venda direta, catálogo e consignação." action={<Button onClick={() => { setDraft(empty); setOpen(true) }}><Plus size={18} />Adicionar produto</Button>}>
      {loading ? <DataLoading /> : error ? <DataError message={getDatabaseErrorMessage(new Error(error), 'Erro ao carregar estoque.')} /> : stock.products.length === 0 ? <EmptyState icon={PackageCheck} title="Estoque de produtos vazio" description="Adicione uma peça pronta e escolha se deseja baixar seus materiais automaticamente." action={<Button onClick={() => setOpen(true)}><Plus size={18} />Adicionar produto</Button>} /> : <div className="grid gap-4 lg:grid-cols-2">{stock.products.map((product) => <article key={product.id} className="rounded-2xl border border-border p-4 sm:p-5">
        <div className="flex gap-4">{product.catalog_image_1_url || product.image_url ? <img src={product.catalog_image_1_url || product.image_url || ''} alt={product.name} className="size-16 rounded-xl object-cover sm:size-20" /> : <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-emerald-50 text-success sm:size-20"><PackageCheck /></span>}
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold">{product.name}</h2><Badge variant={product.status === 'esgotado' ? 'red' : product.status === 'em_consignacao' ? 'orange' : 'green'}>{stockStatus[product.status]}</Badge></div><p className="mt-1 text-xs text-slate-500">{product.public_code || product.internal_code || 'Sem código'}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm"><Quantity label="Interno" value={product.quantity_internal} /><Quantity label="Consignado" value={product.quantity_consigned} /><Quantity label="Vendido" value={product.quantity_sold} /></div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><span><small className="block text-slate-500">Custo unitário</small><strong>{formatCurrency(product.unit_cost)}</strong></span><span><small className="block text-slate-500">Preço de venda</small><strong className="text-success">{formatCurrency(product.sale_price)}</strong></span></div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><Button variant="outline" className="min-h-9 px-3" onClick={() => { setSelling(product); setSaleQuantity(1) }} disabled={product.quantity_internal <= 0}><Minus size={16} />Baixar venda</Button><Button variant="outline" className="min-h-9 px-3" onClick={() => startEdit(product)}><Pencil size={16} />Editar</Button><Button variant="outline" className="min-h-9 px-3" onClick={() => navigate(`/app/catalogo?editar=${product.id}`)}><ImagePlus size={16} />Imagens</Button><Button variant="ghost" className="min-h-9 px-3 text-danger hover:bg-red-50" onClick={() => setDeleting(product)}><Trash2 size={16} />Remover</Button></div>
      </article>)}</div>}
    </Card>

    <Card title="Histórico de movimentações" description="Últimas 100 entradas, saídas, vendas, consignações, devoluções e ajustes." action={<History className="text-primary" size={21} />}>
      {movements.loading ? <DataLoading /> : movements.error ? <DataError message={getDatabaseErrorMessage(new Error(movements.error), 'Erro ao carregar movimentações.')} /> : <StockMovementTable movements={movements.movements} products={stock.products} />}
    </Card>

    <Modal size="lg" open={open} onClose={close} title={editing ? 'Editar produto pronto' : 'Adicionar produto pronto'} footer={<><Button variant="outline" onClick={close}>Cancelar</Button><Button loading={saving} onClick={() => void save()}>Salvar produto</Button></>}><div className="grid gap-4 md:grid-cols-2"><Select containerClassName="md:col-span-2" label="Projeto / modelo" value={draft.projectModelId ?? ''} onChange={(event) => set('projectModelId', event.target.value || null)}><option value="">Sem modelo vinculado</option>{projects.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select><Input containerClassName="md:col-span-2" label="Nome do produto *" value={draft.name} onChange={(event) => set('name', event.target.value)} /><NumberInput label="Quantidade interna *" min="0.001" value={draft.quantity} onChange={(event) => set('quantity', parseNumberBR(event.target.value))} /><MoneyInput label="Custo unitário" value={draft.unitCost} onChange={(event) => set('unitCost', parseNumberBR(event.target.value))} /><MoneyInput label="Preço de venda" value={draft.salePrice} onChange={(event) => set('salePrice', parseNumberBR(event.target.value))} /><Input type="url" label="URL da foto" value={draft.imageUrl} onChange={(event) => set('imageUrl', event.target.value)} /><Textarea containerClassName="md:col-span-2" label="Observações" value={draft.notes} onChange={(event) => set('notes', event.target.value)} />{editing && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:col-span-2"><strong className="block text-sm text-slate-900">Upload de imagens do produto</strong><p className="mt-1 text-sm text-slate-600">Envie a imagem principal e a segunda imagem pelo editor do catálogo.</p><Button type="button" variant="outline" className="mt-3 border-blue-200" onClick={() => { close(); navigate(`/app/catalogo?editar=${editing.id}`) }}><ImagePlus size={17} />Gerenciar imagens</Button></div>}{!editing && <label className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 md:col-span-2"><input className="mt-1 size-4" type="checkbox" checked={deduct} onChange={(event) => setDeduct(event.target.checked)} /><span><strong className="block text-sm text-slate-900">Dar baixa automática nos materiais</strong><small className="mt-1 block text-slate-600">Usa o filamento e os insumos padrão do modelo selecionado.</small></span></label>}</div></Modal>
    <Modal open={Boolean(selling)} onClose={() => setSelling(null)} title="Baixar quantidade vendida" footer={<><Button variant="outline" onClick={() => setSelling(null)}>Cancelar</Button><Button onClick={() => void sell()}>Confirmar venda</Button></>}><NumberInput label={`Quantidade vendida (disponível: ${selling?.quantity_internal ?? 0})`} min="0.001" max={selling?.quantity_internal} value={saleQuantity} onChange={(event) => setSaleQuantity(parseNumberBR(event.target.value))} /></Modal>
    <ConfirmDialog open={Boolean(deleting)} title="Remover produto?" description="O produto será removido do estoque e catálogo. Produtos vinculados a vendas ou consignações não podem ser excluídos." confirmLabel="Remover" onCancel={() => setDeleting(null)} onConfirm={() => void remove()} />
  </div>
}

function Metric({ label, value }: { label: string; value: string }) { return <Card><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card> }
function Quantity({ label, value }: { label: string; value: number }) { return <span className="rounded-lg bg-slate-50 p-2 text-center"><small className="block text-[11px] text-slate-500">{label}</small><strong>{value.toLocaleString('pt-BR')}</strong></span> }
