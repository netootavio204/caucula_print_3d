import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ClientRow } from '../types/database'
import { useAuth } from './useAuth'

export interface ClientInput { name: string; document: string | null; phone: string | null; email: string | null; instagram: string | null; address: string | null; city: string | null; state: string | null; notes: string | null; client_type: ClientRow['client_type'] }
export interface ClientWithMetrics extends ClientRow { budget_count: number; closed_budget_count: number; total_sold: number }

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<ClientWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [clientResult, budgetResult] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('budgets').select('client_id,status,suggested_price').eq('user_id', user.id),
    ])
    const queryError = clientResult.error ?? budgetResult.error
    if (queryError) setError(queryError.message)
    else {
      const budgets = budgetResult.data ?? []
      setClients((clientResult.data ?? []).map((client) => {
        const related = budgets.filter((budget) => budget.client_id === client.id)
        const closed = related.filter((budget) => budget.status === 'aprovado' || budget.status === 'baixado_estoque')
        return { ...client, budget_count: related.length, closed_budget_count: closed.length, total_sold: closed.reduce((sum, budget) => sum + Number(budget.suggested_price), 0) }
      }))
      setError(null)
    }
    setLoading(false)
  }, [user])
  useEffect(() => { void load() }, [load])

  const save = async (input: ClientInput, id?: string) => {
    const query = id ? supabase.from('clients').update(input).eq('id', id).eq('user_id', user!.id) : supabase.from('clients').insert({ ...input, user_id: user!.id })
    const { error: mutationError } = await query
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }
  const deleteClient = async (id: string) => {
    const { error: deleteError } = await supabase.from('clients').delete().eq('id', id).eq('user_id', user!.id)
    if (deleteError) throw new Error(deleteError.message)
    await load()
  }
  return { clients, loading, error, reload: load, saveClient: save, deleteClient }
}
