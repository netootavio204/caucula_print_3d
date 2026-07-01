import { ImageIcon, MessageCircle } from 'lucide-react'
import { Button } from '../ui/Button'

export interface CatalogCardProduct {
  id: string
  public_code: string | null
  public_name: string | null
  public_description: string | null
  category: string | null
  catalog_image_1_url: string | null
  catalog_image_2_url: string | null
  company_name?: string | null
  company_phone?: string | null
  company_logo_url?: string | null
}

export function ProductCatalogCard({ product, onConsult }: { product: CatalogCardProduct; onConsult?: () => void }) {
  return <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
    <div className="relative aspect-[4/3] bg-slate-100">
      {product.catalog_image_1_url ? <img src={product.catalog_image_1_url} alt={product.public_name ?? 'Produto do catalogo'} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><ImageIcon size={42} /></div>}
      {product.catalog_image_2_url && <img src={product.catalog_image_2_url} alt="Segunda imagem do produto" className="absolute bottom-3 right-3 size-20 rounded-xl border-2 border-white object-cover shadow-lg" />}
    </div>
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Codigo para orcamento</span>
          <span className="mt-1 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-extrabold text-primary">{product.public_code || 'SEM CODIGO'}</span>
        </div>
        {product.category && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{product.category}</span>}
      </div>
      <h3 className="mt-3 text-lg font-bold text-slate-900">{product.public_name || 'Nome publico do produto'}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{product.public_description || 'Adicione uma descricao publica para visualizar o card completo.'}</p>
      {onConsult && <Button fullWidth className="mt-5" onClick={onConsult}><MessageCircle size={18} />Consultar Produto</Button>}
    </div>
  </article>
}
