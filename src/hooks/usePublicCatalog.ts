import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PublicCatalogRow, PublicCompanyRow } from '../types/database'

export type PublicCatalogProduct = PublicCatalogRow & Pick<PublicCompanyRow, 'company_name' | 'company_phone' | 'company_logo_url'>

export function usePublicCatalog() {
  const [products, setProducts] = useState<PublicCatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: catalogRows, error: catalogError } = await supabase
      .from('public_catalog_view')
      .select('*')
      .eq('is_catalog_visible', true)
      .order('created_at', { ascending: false })

    if (catalogError) {
      setProducts([])
      setError(catalogError.message)
      setLoading(false)
      return
    }

    const safeRows = (catalogRows ?? []).filter((product) => (
      product.is_catalog_visible
      && product.public_code?.trim()
      && product.public_name?.trim()
      && product.public_description?.trim()
      && product.catalog_image_1_url?.trim()
    ))
    const ownerIds = [...new Set(safeRows.map((product) => product.user_id))]
    let companies: PublicCompanyRow[] = []

    if (ownerIds.length > 0) {
      const { data, error: companyError } = await supabase
        .from('public_company_view')
        .select('*')
        .in('user_id', ownerIds)
      if (companyError) {
        setProducts([])
        setError(companyError.message)
        setLoading(false)
        return
      }
      companies = data ?? []
    }

    const companiesByUser = new Map(companies.map((company) => [company.user_id, company]))
    setProducts(safeRows.map((product) => {
      const company = companiesByUser.get(product.user_id)
      return {
        ...product,
        company_name: company?.company_name ?? null,
        company_phone: company?.company_phone ?? null,
        company_logo_url: company?.company_logo_url ?? null,
      }
    }))
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  return { products, loading, error, reload: load }
}
