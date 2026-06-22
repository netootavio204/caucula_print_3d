import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Json, ReadyStockRow } from '../types/database'
import { useAuth } from './useAuth'

export interface ReadyStockInput { projectModelId: string | null; name: string; quantity: number; unitCost: number; salePrice: number; imageUrl: string; notes: string }

export function useReadyStock() {
  const { user } = useAuth()
  const [products, setProducts] = useState<ReadyStockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: queryError } = await supabase.from('ready_stock').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (queryError) setError(queryError.message)
    else { setProducts(data ?? []); setError(null) }
    setLoading(false)
  }, [user])
  useEffect(() => { void load() }, [load])

  const saveProduct = async (input: ReadyStockInput, id?: string, deductMaterials = false) => {
    const payload = { project_model_id: input.projectModelId, name: input.name, quantity: input.quantity, unit_cost: input.unitCost, sale_price: input.salePrice, image_url: input.imageUrl, notes: input.notes }
    const { error: mutationError } = await supabase.rpc('save_ready_stock', { p_stock: payload as Json, p_stock_id: id ?? null, p_deduct_materials: deductMaterials })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }
  const deleteProduct = async (id: string) => {
    const { error: deleteError } = await supabase.from('ready_stock').delete().eq('id', id).eq('user_id', user!.id)
    if (deleteError) throw new Error(deleteError.message)
    await load()
  }
  const sellProduct = async (product: ReadyStockRow, quantity: number) => {
    if (quantity <= 0 || quantity > product.quantity_internal) throw new Error('Quantidade de venda inválida.')
    const { error: updateError } = await supabase.rpc('record_ready_stock_sale', { p_stock_id: product.id, p_quantity: quantity })
    if (updateError) throw new Error(updateError.message)
    await load()
  }
  return { products, loading, error, reload: load, saveProduct, deleteProduct, sellProduct }
}
