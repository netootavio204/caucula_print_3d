import { useCallback, useEffect, useState } from 'react'
import { EntityInUseError } from '../lib/databaseErrors'
import { supabase } from '../lib/supabase'
import type { SupplyRow } from '../types/database'
import { useAuth } from './useAuth'

export type SupplyUnit = SupplyRow['unit']
export interface SupplyInput { name: string; total_price: number; quantity_purchased: number; unit: SupplyUnit; unit_cost: number; stock_quantity: number }

export function useSupplies() {
  const { user } = useAuth()
  const [supplies, setSupplies] = useState<SupplyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => { if (!user) return; setLoading(true); const { data, error: queryError } = await supabase.from('supplies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); if (queryError) setError(queryError.message); else { setSupplies(data); setError(null) }; setLoading(false) }, [user])
  useEffect(() => { void load() }, [load])

  const save = async (input: SupplyInput, id?: string) => {
    const current = id ? supplies.find((item) => item.id === id) : null
    const adjustedInput = current ? { ...input, stock_quantity: Math.max(0, current.stock_quantity + input.quantity_purchased - current.quantity_purchased) } : input
    const query = id ? supabase.from('supplies').update(adjustedInput).eq('id', id).eq('user_id', user!.id) : supabase.from('supplies').insert({ ...adjustedInput, user_id: user!.id })
    const { error: mutationError } = await query
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }
  const deleteSupply = async (id: string) => {
    const { count, error: countError } = await supabase.from('budget_supplies').select('id', { count: 'exact', head: true }).eq('supply_id', id)
    if (countError) throw new Error(countError.message)
    if (count) throw new EntityInUseError('Este insumo está vinculado a um orçamento e não pode ser excluído.')
    const { error: deleteError } = await supabase.from('supplies').delete().eq('id', id).eq('user_id', user!.id)
    if (deleteError) throw new Error(deleteError.message)
    await load()
  }
  return { supplies, loading, error, reload: load, saveSupply: save, deleteSupply }
}
