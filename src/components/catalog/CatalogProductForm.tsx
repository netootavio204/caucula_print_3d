import type { CatalogProductInput } from '../../hooks/useCatalog'
import type { ReadyStockRow } from '../../types/database'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { ProductImageUploader } from './ProductImageUploader'

interface CatalogProductFormProps {
  product: ReadyStockRow
  value: CatalogProductInput
  onChange: (value: CatalogProductInput) => void
  busyPosition: 1 | 2 | null
  onUpload: (position: 1 | 2, file: File) => void
  onRemove: (position: 1 | 2) => void
}

export function CatalogProductForm({ product, value, onChange, busyPosition, onUpload, onRemove }: CatalogProductFormProps) {
  const set = <K extends keyof CatalogProductInput>(key: K, next: CatalogProductInput[K]) => onChange({ ...value, [key]: next })
  const uploadDisabled = !value.publicCode.trim()
  return <div className="space-y-6">
    <section className="rounded-2xl border border-border bg-slate-50/60 p-4 sm:p-5">
      <div className="mb-4"><h3 className="font-semibold text-slate-900">Informações públicas</h3><p className="mt-1 text-sm text-slate-500">Estes dados serão exibidos para os visitantes do catálogo.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Código público *" value={value.publicCode} onChange={(event) => set('publicCode', event.target.value)} placeholder="CP-0001" />
        <Input label="Categoria" value={value.category} onChange={(event) => set('category', event.target.value)} placeholder="Miniaturas" />
        <Input containerClassName="md:col-span-2" label="Nome público *" value={value.publicName} onChange={(event) => set('publicName', event.target.value)} placeholder="Nome que aparecerá no catálogo" />
        <Textarea containerClassName="md:col-span-2" label="Descrição pública *" value={value.publicDescription} onChange={(event) => set('publicDescription', event.target.value)} placeholder="Descreva o produto para o cliente" />
      </div>
    </section>
    <section>
      <div className="mb-4"><h3 className="font-semibold text-slate-900">Imagens do produto</h3><p className="mt-1 text-sm text-slate-500">Envie uma imagem principal e, se desejar, uma segunda imagem.</p></div>
      {uploadDisabled && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Informe o código público para liberar o envio das imagens.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <ProductImageUploader position={1} imageUrl={product.catalog_image_1_url} disabled={uploadDisabled || busyPosition === 2} loading={busyPosition === 1} onUpload={(file) => onUpload(1, file)} onRemove={() => onRemove(1)} />
        <ProductImageUploader position={2} imageUrl={product.catalog_image_2_url} disabled={uploadDisabled || busyPosition === 1} loading={busyPosition === 2} onUpload={(file) => onUpload(2, file)} onRemove={() => onRemove(2)} />
      </div>
    </section>
  </div>
}
