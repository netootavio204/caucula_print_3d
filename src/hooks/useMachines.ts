import { useCallback, useEffect, useState } from 'react'
import { EntityInUseError } from '../lib/databaseErrors'
import { supabase } from '../lib/supabase'
import type { MachineRow } from '../types/database'
import { useAuth } from './useAuth'

export interface MachineInput { model: string; consumption_watts: number; maintenance_per_hour: number; machine_value: number; estimated_life_hours: number }

export function useMachines() {
  const { user } = useAuth()
  const [machines, setMachines] = useState<MachineRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => { if (!user) return; setLoading(true); const { data, error: queryError } = await supabase.from('machines').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); if (queryError) setError(queryError.message); else { setMachines(data); setError(null) }; setLoading(false) }, [user])
  useEffect(() => { void load() }, [load])

  const save = async (input: MachineInput, id?: string) => {
    const query = id ? supabase.from('machines').update(input).eq('id', id).eq('user_id', user!.id) : supabase.from('machines').insert({ ...input, user_id: user!.id })
    const { error: mutationError } = await query
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }
  const deleteMachine = async (id: string) => {
    const [budgets, projects] = await Promise.all([
      supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('machine_id', id),
      supabase.from('project_models').select('id', { count: 'exact', head: true }).eq('default_machine_id', id),
    ])
    if (budgets.error) throw new Error(budgets.error.message)
    if (projects.error) throw new Error(projects.error.message)
    if (budgets.count || projects.count) throw new EntityInUseError('Esta máquina está vinculada a um orçamento ou projeto e não pode ser excluída.')
    const { error: deleteError } = await supabase.from('machines').delete().eq('id', id).eq('user_id', user!.id)
    if (deleteError) throw new Error(deleteError.message)
    await load()
  }
  return { machines, loading, error, reload: load, saveMachine: save, deleteMachine }
}
