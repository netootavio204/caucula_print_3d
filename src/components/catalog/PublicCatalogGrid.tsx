import { PackageSearch } from 'lucide-react'
import { EmptyState } from '../ui/EmptyState'
import { ProductCatalogCard, type CatalogCardProduct } from './ProductCatalogCard'

export function PublicCatalogGrid({ products, onConsult }: { products: CatalogCardProduct[]; onConsult: (product: CatalogCardProduct) => void }) {
  if (products.length === 0) return <EmptyState icon={PackageSearch} title="Nenhum produto disponível" description="Nenhum produto disponível no catálogo no momento." />
  return <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCatalogCard key={product.id} product={product} onConsult={() => onConsult(product)} />)}</div>
}
