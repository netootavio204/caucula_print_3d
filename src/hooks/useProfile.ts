import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ProfileRow } from '../types/database'
import { useAuth } from './useAuth'

export type ProfileInput = Pick<ProfileRow, 'company_name' | 'company_phone' | 'company_email' | 'company_instagram' | 'company_address' | 'company_city' | 'company_state' | 'company_logo_url'>

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: queryError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (queryError) { setError(queryError.message); setLoading(false); return }
    if (data) { setProfile(data); setError(null); setLoading(false); return }
    const { data: created, error: createError } = await supabase.from('profiles').upsert({ id: user.id, full_name: String(user.user_metadata.full_name ?? user.email?.split('@')[0] ?? 'Usuário'), email: user.email ?? '' }, { onConflict: 'id' }).select().single()
    if (createError) setError(createError.message); else { setProfile(created); setError(null) }
    setLoading(false)
  }, [user])
  useEffect(() => { void load() }, [load])

  const saveProfile = async (input: ProfileInput) => {
    const { data, error: mutationError } = await supabase.from('profiles').update(input).eq('id', user!.id).select().single()
    if (mutationError) throw new Error(mutationError.message)
    setProfile(data)
  }
  return { profile, loading, error, reload: load, saveProfile }
}
