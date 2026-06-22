import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ReadyStockMovementRow } from '../types/database'
import { useAuth } from './useAuth'

export function useReadyStockMovements() {
  const { user } = useAuth()
  const [movements, setMovements] = useState<ReadyStockMovementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) { setMovements([]); setLoading(false); return }
    setLoading(true)
    const { data, error: queryError } = await supabase
      .from('ready_stock_movements')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (queryError) setError(queryError.message)
    else { setMovements(data ?? []); setError(null) }
    setLoading(false)
  }, [user])

  useEffect(() => { void load() }, [load])
  return { movements, loading, error, reload: load }
}
