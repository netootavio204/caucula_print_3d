import { useCallback, useEffect, useState } from 'react'
import { deleteCatalogProductImage, replaceCatalogProductImage, uploadCatalogProductImage, type CatalogImagePosition } from '../lib/storage'
import { supabase } from '../lib/supabase'
import type { ReadyStockRow } from '../types/database'
import { useAuth } from './useAuth'

export interface CatalogProductInput {
  publicCode: string
  publicName: string
  publicDescription: string
  category: string
}

function catalogFields(input: CatalogProductInput) {
  return {
    public_code: input.publicCode.trim() || null,
    public_name: input.publicName.trim() || null,
    public_description: input.publicDescription.trim() || null,
    category: input.category.trim() || null,
  }
}

export function canPublishCatalogProduct(product: Pick<ReadyStockRow, 'public_code' | 'public_name' | 'public_description' | 'catalog_image_1_url'>) {
  return Boolean(
    product.public_code?.trim()
    && product.public_name?.trim()
    && product.public_description?.trim()
    && product.catalog_image_1_url?.trim(),
  )
}

export function useCatalog() {
  const { user } = useAuth()
  const [products, setProducts] = useState<ReadyStockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) { setProducts([]); setLoading(false); return }
    setLoading(true)
    const { data, error: queryError } = await supabase
      .from('ready_stock')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (queryError) setError(queryError.message)
    else { setProducts(data ?? []); setError(null) }
    setLoading(false)
  }, [user])

  useEffect(() => { void load() }, [load])

  const requireUser = () => {
    if (!user) throw new Error('Faça login para administrar o catálogo.')
    return user
  }

  const getProduct = (id: string) => {
    const product = products.find((item) => item.id === id)
    if (!product) throw new Error('Produto não encontrado.')
    return product
  }

  const saveCatalogProduct = async (id: string, input: CatalogProductInput) => {
    const currentUser = requireUser()
    const current = getProduct(id)
    const fields = catalogFields(input)
    if (current.is_catalog_visible && !canPublishCatalogProduct({ ...current, ...fields })) {
      throw new Error('Oculte o produto antes de remover dados obrigatórios do catálogo.')
    }
    const { error: mutationError } = await supabase
      .from('ready_stock')
      .update(fields)
      .eq('id', id)
      .eq('user_id', currentUser.id)
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }

  const publishProduct = async (id: string) => {
    const currentUser = requireUser()
    const product = getProduct(id)
    if (!canPublishCatalogProduct(product)) {
      throw new Error('Para publicar este produto, adicione código, nome, descrição e imagem principal.')
    }
    const { error: mutationError } = await supabase
      .from('ready_stock')
      .update({ is_catalog_visible: true })
      .eq('id', id)
      .eq('user_id', currentUser.id)
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }

  const hideProduct = async (id: string) => {
    const currentUser = requireUser()
    const { error: mutationError } = await supabase
      .from('ready_stock')
      .update({ is_catalog_visible: false })
      .eq('id', id)
      .eq('user_id', currentUser.id)
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }

  const uploadProductImage = async (id: string, position: CatalogImagePosition, file: File) => {
    const currentUser = requireUser()
    const product = getProduct(id)
    const currentPath = position === 1 ? product.catalog_image_1_path : product.catalog_image_2_path
    const result = currentPath
      ? await replaceCatalogProductImage({ file, readyStockId: id, position, currentPath })
      : await uploadCatalogProductImage({ file, readyStockId: id, position })
    const imageFields = position === 1
      ? { catalog_image_1_path: result.path, catalog_image_1_url: result.url }
      : { catalog_image_2_path: result.path, catalog_image_2_url: result.url }
    const { error: mutationError } = await supabase
      .from('ready_stock')
      .update(imageFields)
      .eq('id', id)
      .eq('user_id', currentUser.id)
    if (mutationError) {
      await deleteCatalogProductImage(result.path)
      throw new Error(mutationError.message)
    }
    await load()
  }

  const removeProductImage = async (id: string, position: CatalogImagePosition) => {
    const currentUser = requireUser()
    const product = getProduct(id)
    const path = position === 1 ? product.catalog_image_1_path : product.catalog_image_2_path
    if (!path) return
    await deleteCatalogProductImage(path)
    const imageFields = position === 1
      ? { catalog_image_1_path: null, catalog_image_1_url: null, is_catalog_visible: false }
      : { catalog_image_2_path: null, catalog_image_2_url: null }
    const { error: mutationError } = await supabase
      .from('ready_stock')
      .update(imageFields)
      .eq('id', id)
      .eq('user_id', currentUser.id)
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }

  const deleteProduct = async (id: string) => {
    const currentUser = requireUser()
    const product = getProduct(id)
    for (const path of [product.catalog_image_1_path, product.catalog_image_2_path]) {
      if (path) await deleteCatalogProductImage(path)
    }
    const { error: deleteError } = await supabase
      .from('ready_stock')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.id)
    if (deleteError) throw new Error(deleteError.message)
    await load()
  }

  return {
    products,
    loading,
    error,
    reload: load,
    saveCatalogProduct,
    publishProduct,
    hideProduct,
    uploadProductImage,
    removeProductImage,
    deleteProduct,
  }
}
