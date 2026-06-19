import { Eye, EyeOff, PackageSearch, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CatalogProductForm } from '../../components/catalog/CatalogProductForm'
import { ProductCatalogCard } from '../../components/catalog/ProductCatalogCard'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataError, DataLoading } from '../../components/ui/DataState'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { canPublishCatalogProduct, useCatalog, type CatalogProductInput } from '../../hooks/useCatalog'
import { getDatabaseErrorMessage } from '../../lib/databaseErrors'
import type { ReadyStockRow } from '../../types/database'

const emptyDraft: CatalogProductInput = { publicCode: '', publicName: '', publicDescription: '', category: '' }

function toDraft(product: ReadyStockRow): CatalogProductInput {
  return {
    publicCode: product.public_code ?? '',
    publicName: product.public_name ?? '',
    publicDescription: product.public_description ?? '',
    category: product.category ?? '',
  }
}

export function Catalog() {
  const catalog = useCatalog()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<CatalogProductInput>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [busyPosition, setBusyPosition] = useState<1 | 2 | null>(null)
  const [deleting, setDeleting] = useState<ReadyStockRow | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const editing = useMemo(() => catalog.products.find((product) => product.id === editingId) ?? null, [catalog.products, editingId])

  useEffect(() => {
    const requestedId = searchParams.get('editar')
    if (!requestedId || catalog.loading || editingId === requestedId) return
    const requestedProduct = catalog.products.find((product) => product.id === requestedId)
    if (requestedProduct) { setEditingId(requestedProduct.id); setDraft(toDraft(requestedProduct)) }
  }, [catalog.loading, catalog.products, editingId, searchParams])

  const openEditor = (product: ReadyStockRow) => { setEditingId(product.id); setDraft(toDraft(product)) }
  const closeEditor = () => { setEditingId(null); setDraft(emptyDraft); setBusyPosition(null); if (searchParams.has('editar')) setSearchParams({}, { replace: true }) }
  const handleError = (error: unknown, fallback: string) => showToast(getDatabaseErrorMessage(error, error instanceof Error ? error.message : fallback), 'error')

  const save = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await catalog.saveCatalogProduct(editing.id, draft)
      showToast('Dados do catálogo salvos.', 'success')
    } catch (error) { handleError(error, 'Erro ao salvar catálogo.') }
    finally { setSaving(false) }
  }

  const upload = async (position: 1 | 2, file: File) => {
    if (!editing) return
    setBusyPosition(position)
    try {
      await catalog.saveCatalogProduct(editing.id, draft)
      await catalog.uploadProductImage(editing.id, position, file)
      showToast(`Imagem ${position} enviada com sucesso.`, 'success')
    } catch (error) { handleError(error, 'Erro ao enviar imagem.') }
    finally { setBusyPosition(null) }
  }

  const removeImage = async (position: 1 | 2) => {
    if (!editing) return
    setBusyPosition(position)
    try {
      await catalog.removeProductImage(editing.id, position)
      showToast(`Imagem ${position} removida.`, 'success')
    } catch (error) { handleError(error, 'Erro ao remover imagem.') }
    finally { setBusyPosition(null) }
  }

  const publish = async (product: ReadyStockRow) => {
    setActionId(product.id)
    try { await catalog.publishProduct(product.id); showToast('Produto publicado no catálogo.', 'success') }
    catch (error) { handleError(error, 'Erro ao publicar produto.') }
    finally { setActionId(null) }
  }

  const hide = async (product: ReadyStockRow) => {
    setActionId(product.id)
    try { await catalog.hideProduct(product.id); showToast('Produto ocultado do catálogo.', 'success') }
    catch (error) { handleError(error, 'Erro ao ocultar produto.') }
    finally { setActionId(null) }
  }

  const removeProduct = async () => {
    if (!deleting) return
    setActionId(deleting.id)
    try {
      await catalog.deleteProduct(deleting.id)
      if (editingId === deleting.id) closeEditor()
      showToast('Produto excluído do estoque e do catálogo.', 'success')
      setDeleting(null)
    } catch (error) { handleError(error, 'Erro ao excluir produto.') }
    finally { setActionId(null) }
  }

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-900">Catálogo</h1><p className="mt-1 text-sm text-slate-600">Prepare os produtos do estoque para publicação e visualize o card público.</p></div>
    <Card title="Produtos do estoque pronto" description="Preencha os dados públicos sem expor preços, custos ou quantidades.">
      {catalog.loading ? <DataLoading /> : catalog.error ? <DataError message={getDatabaseErrorMessage(new Error(catalog.error), 'Erro ao carregar catálogo.')} /> : catalog.products.length === 0 ? <EmptyState icon={PackageSearch} title="Nenhum produto no estoque" description="Cadastre primeiro um produto pronto para preparar seu catálogo." action={<Button onClick={() => navigate('/app/estoque')}>Ir para estoque</Button>} /> : <div className="grid gap-4 lg:grid-cols-2">{catalog.products.map((product) => <article key={product.id} className="rounded-2xl border border-border p-5">
        <div className="flex gap-4">
          {product.catalog_image_1_url ? <img src={product.catalog_image_1_url} alt="" className="size-20 rounded-xl object-cover" /> : <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400"><PackageSearch /></span>}
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold">{product.name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.is_catalog_visible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{product.is_catalog_visible ? 'Público' : 'Oculto'}</span></div><p className="mt-1 text-sm text-slate-500">{product.public_code || 'Código público não definido'}</p><p className="mt-2 text-sm text-slate-600">{product.public_name || 'Nome público não definido'}</p></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-9 px-3" onClick={() => openEditor(product)}><Pencil size={16} />Editar catálogo</Button>
          {product.is_catalog_visible ? <Button variant="outline" className="min-h-9 px-3" loading={actionId === product.id} onClick={() => void hide(product)}><EyeOff size={16} />Ocultar</Button> : <Button className="min-h-9 px-3" loading={actionId === product.id} disabled={!canPublishCatalogProduct(product)} onClick={() => void publish(product)}><Eye size={16} />Publicar</Button>}
          <Button variant="ghost" className="min-h-9 px-3 text-danger hover:bg-red-50" disabled={actionId === product.id} onClick={() => setDeleting(product)}><Trash2 size={16} />Excluir</Button>
        </div>
        {!product.is_catalog_visible && !canPublishCatalogProduct(product) && <p className="mt-3 text-xs text-amber-700">Adicione código, nome, descrição e imagem principal para publicar.</p>}
      </article>)}</div>}
    </Card>

    <Modal size="xl" open={Boolean(editing)} onClose={closeEditor} title={editing ? `Editar catálogo: ${editing.name}` : 'Editar catálogo'} footer={<><Button variant="outline" onClick={closeEditor}>Fechar</Button><Button loading={saving} disabled={Boolean(busyPosition)} onClick={() => void save()}>Salvar alterações</Button></>}>
      {editing && <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"><CatalogProductForm product={editing} value={draft} onChange={setDraft} busyPosition={busyPosition} onUpload={(position, file) => void upload(position, file)} onRemove={(position) => void removeImage(position)} /><aside className="lg:sticky lg:top-0 lg:self-start"><div className="mb-3"><h3 className="font-semibold text-slate-900">Prévia do card público</h3><p className="mt-1 text-sm text-slate-500">Veja como o produto aparecerá na página inicial.</p></div><ProductCatalogCard product={{ ...editing, public_code: draft.publicCode || null, public_name: draft.publicName || null, public_description: draft.publicDescription || null, category: draft.category || null }} /></aside></div>}
    </Modal>

    <ConfirmDialog open={Boolean(deleting)} title="Excluir produto?" description="O produto será excluído do estoque pronto, do catálogo e suas imagens serão removidas do Storage. Esta ação não devolve materiais consumidos." confirmLabel="Excluir produto" onCancel={() => setDeleting(null)} onConfirm={() => void removeProduct()} />
  </div>
}
