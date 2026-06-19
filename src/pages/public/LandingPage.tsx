import { ArrowDown, LoaderCircle, MessageCircle, Sparkles } from 'lucide-react'
import { PublicCatalogGrid } from '../../components/catalog/PublicCatalogGrid'
import type { CatalogCardProduct } from '../../components/catalog/ProductCatalogCard'
import { Button } from '../../components/ui/Button'
import { DataError } from '../../components/ui/DataState'
import { useToast } from '../../components/ui/Toast'
import { usePublicCatalog } from '../../hooks/usePublicCatalog'
import { getDatabaseErrorMessage } from '../../lib/databaseErrors'
import { buildWhatsAppUrl } from '../../lib/whatsapp'

export function LandingPage() {
  const catalog = usePublicCatalog()
  const { showToast } = useToast()

  const openWhatsApp = (phone: string, message: string) => {
    const url = buildWhatsAppUrl(phone, message)
    if (!url) return false
    window.open(url, '_blank', 'noopener,noreferrer')
    return true
  }

  const consultProduct = (product: CatalogCardProduct) => {
    const code = product.public_code ?? ''
    const name = product.public_name ?? ''
    const message = `Olá, tenho interesse no produto ${code} - ${name}.`
    if (product.company_phone && openWhatsApp(product.company_phone, message)) return
    showToast(`Informe o código do produto ao entrar em contato: ${code}`, 'info')
  }

  const contact = () => {
    const productWithPhone = catalog.products.find((product) => product.company_phone)
    if (productWithPhone?.company_phone) {
      openWhatsApp(productWithPhone.company_phone, 'Olá, gostaria de saber mais sobre os produtos do catálogo.')
      return
    }
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
    showToast('Escolha um produto e informe o código ao entrar em contato.', 'info')
  }

  return <>
    <section className="relative overflow-hidden px-4 pb-24 pt-36 sm:px-6 sm:pb-28 sm:pt-44 lg:px-8">
      <div className="absolute left-1/2 top-16 size-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
      <div className="absolute -right-28 top-72 size-80 rounded-full bg-accent/10 blur-[100px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200"><Sparkles size={17} />Peças impressas em 3D</span>
          <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">Peças 3D personalizadas<br /><span className="bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">e prontas para você.</span></h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">Confira nosso catálogo de modelos impressos em 3D. Para valores e encomendas, entre em contato informando o código do produto.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button className="px-6" onClick={contact}><MessageCircle size={18} />Entrar em contato</Button>
            <a href="#catalogo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">Ver catálogo <ArrowDown size={18} /></a>
          </div>
        </div>
      </div>
    </section>

    <section id="catalogo" className="bg-slate-50 px-4 py-20 text-slate-900 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div><span className="text-sm font-bold uppercase tracking-wider text-primary">Catálogo público</span><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Encontre sua próxima peça</h2><p className="mt-4 max-w-2xl leading-7 text-slate-600">Consulte imagens e detalhes de cada modelo. Use o código exibido no card para conversar sobre sua encomenda.</p></div>
        <div className="mt-10">
          {catalog.loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-white py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin text-primary" size={22} />Carregando catálogo...</div> : catalog.error ? <DataError message={getDatabaseErrorMessage(new Error(catalog.error), 'Não foi possível carregar o catálogo.')} /> : <PublicCatalogGrid products={catalog.products} onConsult={consultProduct} />}
        </div>
      </div>
    </section>

    <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">© 2026 CalculaPrint 3D. Peças impressas em 3D.</footer>
  </>
}
