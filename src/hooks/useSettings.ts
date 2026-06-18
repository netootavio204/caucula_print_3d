import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { GlobalSettingsRow } from '../types/database'
import { useAuth } from './useAuth'

export type SettingsInput = Pick<GlobalSettingsRow, 'energy_price_kwh' | 'failure_margin_percent' | 'markup_percent' | 'taxes_percent' | 'card_fee_percent' | 'fixed_ads_cost'>
const defaults: SettingsInput = { energy_price_kwh: 0, failure_margin_percent: 5, markup_percent: 30, taxes_percent: 0, card_fee_percent: 0, fixed_ads_cost: 0 }

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<GlobalSettingsRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: queryError } = await supabase.from('global_settings').select('*').eq('user_id', user.id).maybeSingle()
    if (queryError) { setError(queryError.message); setLoading(false); return }
    if (data) { setSettings(data); setError(null); setLoading(false); return }
    const { data: created, error: createError } = await supabase.from('global_settings').upsert({ ...defaults, user_id: user.id }, { onConflict: 'user_id' }).select().single()
    if (createError) setError(createError.message); else { setSettings(created); setError(null) }
    setLoading(false)
  }, [user])

  useEffect(() => { void load() }, [load])

  const saveSettings = async (input: SettingsInput) => {
    const { data, error: mutationError } = await supabase.from('global_settings').upsert({ ...input, user_id: user!.id }, { onConflict: 'user_id' }).select().single()
    if (mutationError) throw new Error(mutationError.message)
    setSettings(data)
  }
  return { settings, loading, error, reload: load, saveSettings }
}
