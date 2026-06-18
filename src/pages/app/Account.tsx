import { Building2, CalendarDays, LogOut, Mail, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataError, DataLoading } from '../../components/ui/DataState'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../hooks/useAuth'
import { useProfile, type ProfileInput } from '../../hooks/useProfile'
import { getDatabaseErrorMessage } from '../../lib/databaseErrors'
import { formatDate } from '../../lib/formatters'

export function Account() {
  const hook = useProfile(); const { signOut } = useAuth(); const { showToast } = useToast(); const [saving, setSaving] = useState(false); const [leaving, setLeaving] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const input: ProfileInput = { company_name: nullable(data.get('company_name')), company_phone: nullable(data.get('company_phone')), company_email: nullable(data.get('company_email')), company_instagram: nullable(data.get('company_instagram')), company_address: nullable(data.get('company_address')), company_city: nullable(data.get('company_city')), company_state: nullable(data.get('company_state'))?.toUpperCase() ?? null, company_logo_url: nullable(data.get('company_logo_url')) }; if (input.company_state && input.company_state.length !== 2) { showToast('Informe a UF com duas letras.', 'error'); return } setSaving(true); try { await hook.saveProfile(input); showToast('Dados da empresa salvos com sucesso.', 'success') } catch (error) { showToast(getDatabaseErrorMessage(error, 'Erro ao salvar dados da empresa.'), 'error') } finally { setSaving(false) } }
  const logout = async () => { setLeaving(true); try { await signOut() } catch { showToast('Não foi possível sair da conta.', 'error'); setLeaving(false) } }

  if (hook.loading) return <Card><DataLoading /></Card>
  if (hook.error) return <Card><DataError message={getDatabaseErrorMessage(new Error(hook.error), 'Erro ao carregar sua conta.')} /></Card>
  if (!hook.profile) return null

  return <div className="space-y-6"><Card title="Dados do usuário" description="Informações vinculadas à autenticação"><div className="grid gap-4 sm:grid-cols-3"><Info icon={UserRound} label="Nome" value={hook.profile.full_name} /><Info icon={Mail} label="E-mail" value={hook.profile.email} /><Info icon={CalendarDays} label="Cadastro" value={formatDate(hook.profile.created_at)} /></div></Card><Card title="Dados da empresa" description="Estas informações serão usadas nos documentos profissionais."><form key={hook.profile.updated_at} className="grid gap-5 sm:grid-cols-2" onSubmit={submit}><Input containerClassName="sm:col-span-2" name="company_name" label="Nome da empresa ou profissional" defaultValue={hook.profile.company_name ?? ''} /><Input name="company_phone" label="WhatsApp / telefone" defaultValue={hook.profile.company_phone ?? ''} /><Input name="company_email" type="email" label="E-mail profissional" defaultValue={hook.profile.company_email ?? ''} /><Input containerClassName="sm:col-span-2" name="company_instagram" label="Instagram / rede social" defaultValue={hook.profile.company_instagram ?? ''} /><Input containerClassName="sm:col-span-2" name="company_address" label="Endereço" defaultValue={hook.profile.company_address ?? ''} /><Input name="company_city" label="Cidade" defaultValue={hook.profile.company_city ?? ''} /><Input name="company_state" label="UF" maxLength={2} defaultValue={hook.profile.company_state ?? ''} /><Input containerClassName="sm:col-span-2" name="company_logo_url" type="url" label="URL da logo (opcional)" defaultValue={hook.profile.company_logo_url ?? ''} /><div className="flex flex-col gap-3 border-t border-border pt-5 sm:col-span-2 sm:flex-row sm:justify-between"><Button type="submit" loading={saving}><Building2 size={18} />Salvar dados da empresa</Button><Button type="button" variant="outline" loading={leaving} onClick={() => void logout()}><LogOut size={18} />Sair da conta</Button></div></form></Card></div>
}

function Info({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary"><Icon size={19} /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p></div></div> }
function nullable(value: FormDataEntryValue | null): string | null { const text = String(value ?? '').trim(); return text || null }
