import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { EntityInUseError } from '../lib/databaseErrors'
import type { FilamentRow } from '../types/database'
import { useAuth } from './useAuth'

export interface FilamentInput { type_brand: string; color: string; weight_kg: number; price_paid: number; supplier_image_url: string | null }

export function useFilaments() {
  const { user } = useAuth()
  const [filaments, setFilaments] = useState<FilamentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: queryError } = await supabase.from('filaments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (queryError) setError(queryError.message)
    else { setFilaments(data); setError(null) }
    setLoading(false)
  }, [user])

  useEffect(() => { void load() }, [load])

  const createFilament = async (input: FilamentInput) => {
    const { error: mutationError } = await supabase.rpc('create_filament_with_entry', {
      p_type_brand: input.type_brand, p_color: input.color, p_weight_kg: input.weight_kg,
      p_price_paid: input.price_paid, p_supplier_image_url: input.supplier_image_url,
    })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }

  const updateFilament = async (id: string, input: FilamentInput) => {
    const { error: mutationError } = await supabase.rpc('update_filament_with_adjustment', {
      p_id: id, p_type_brand: input.type_brand, p_color: input.color, p_weight_kg: input.weight_kg,
      p_price_paid: input.price_paid, p_supplier_image_url: input.supplier_image_url,
    })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }

  const deleteFilament = async (id: string) => {
    const { count, error: countError } = await supabase.from('budget_filaments').select('id', { count: 'exact', head: true }).eq('filament_id', id)
    if (countError) throw new Error(countError.message)
    if (count) throw new EntityInUseError('Este filamento está vinculado a um orçamento e não pode ser excluído.')
    const { error: deleteError } = await supabase.from('filaments').delete().eq('id', id).eq('user_id', user!.id)
    if (deleteError) throw new Error(deleteError.message)
    await load()
  }

  return { filaments, loading, error, reload: load, createFilament, updateFilament, deleteFilament }
}
