import { Mail, Pencil, Phone, Plus, Search, Trash2, UsersRound } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataError, DataLoading } from '../../components/ui/DataState'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { useClients, type ClientInput, type ClientWithMetrics } from '../../hooks/useClients'
import { getDatabaseErrorMessage } from '../../lib/databaseErrors'
import { formatCurrency } from '../../lib/formatters'

export function Clients() {
  const hook = useClients(); const { showToast } = useToast()
  const [search, setSearch] = useState(''); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<ClientWithMetrics | null>(null); const [deleting, setDeleting] = useState<ClientWithMetrics | null>(null); const [saving, setSaving] = useState(false)
  const filtered = useMemo(() => { const term = search.trim().toLocaleLowerCase('pt-BR'); if (!term) return hook.clients; return hook.clients.filter((client) => [client.name, client.email, client.phone, client.document].some((value) => value?.toLocaleLowerCase('pt-BR').includes(term))) }, [hook.clients, search])
  const close = () => { setOpen(false); setEditing(null) }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    const input: ClientInput = { name: String(data.get('name')).trim(), document: nullable(data.get('document')), phone: nullable(data.get('phone')), email: nullable(data.get('email')), instagram: nullable(data.get('instagram')), address: nullable(data.get('address')), city: nullable(data.get('city')), state: nullable(data.get('state'))?.toUpperCase() ?? null, notes: nullable(data.get('notes')) }
    if (!input.name) { showToast('Informe o nome do cliente.', 'error'); return }
    if (input.state && input.state.length !== 2) { showToast('Informe a UF com duas letras.', 'error'); return }
    setSaving(true); try { await hook.saveClient(input, editing?.id); showToast(editing ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.', 'success'); close() } catch (error) { showToast(getDatabaseErrorMessage(error, 'Erro ao salvar cliente.'), 'error') } finally { setSaving(false) }
  }
  const remove = async () => { if (!deleting) return; try { await hook.deleteClient(deleting.id); showToast('Cliente excluído com sucesso.', 'success'); setDeleting(null) } catch (error) { showToast(getDatabaseErrorMessage(error, 'Erro ao excluir cliente.'), 'error') } }

  return <Card title="Clientes" description="Gerencie contatos e acompanhe o histórico comercial." action={<Button onClick={() => setOpen(true)}><Plus size={18} />Novo cliente</Button>}>
    <div className="mb-5 max-w-md"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, contato ou documento" icon={<Search size={18} />} aria-label="Buscar cliente" /></div>
    {hook.loading ? <DataLoading /> : hook.error ? <DataError message={getDatabaseErrorMessage(new Error(hook.error), 'Erro ao carregar clientes.')} /> : hook.clients.length === 0 ? <EmptyState icon={UsersRound} title="Nenhum cliente cadastrado" description="Cadastre seu primeiro cliente para vinculá-lo aos próximos orçamentos." action={<Button onClick={() => setOpen(true)}><Plus size={18} />Cadastrar cliente</Button>} /> : filtered.length === 0 ? <EmptyState icon={Search} title="Nenhum resultado encontrado" description="Tente buscar usando outro nome, contato ou documento." /> : <Table headers={['Cliente', 'Contato', 'Orçamentos', 'Fechados', 'Total vendido', 'Ações']}>{filtered.map((client) => <tr key={client.id}><td className="px-4 py-3"><p className="font-semibold text-slate-900">{client.name}</p><p className="mt-1 text-xs text-slate-500">{client.document || 'Documento não informado'}</p></td><td className="px-4 py-3 text-slate-600">{client.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{client.phone}</span>}{client.email && <span className="mt-1 flex items-center gap-1.5"><Mail size={14} />{client.email}</span>}{!client.phone && !client.email && <span>-</span>}</td><td className="px-4 py-3 text-center text-slate-600">{client.budget_count}</td><td className="px-4 py-3 text-center text-slate-600">{client.closed_budget_count}</td><td className="whitespace-nowrap px-4 py-3 font-semibold text-success">{formatCurrency(client.total_sold)}</td><td className="px-4 py-2"><div className="flex gap-1"><Button variant="ghost" className="min-h-9 px-2" onClick={() => { setEditing(client); setOpen(true) }} aria-label={`Editar ${client.name}`}><Pencil size={17} /></Button><Button variant="ghost" className="min-h-9 px-2 text-danger hover:bg-red-50" onClick={() => setDeleting(client)} aria-label={`Excluir ${client.name}`}><Trash2 size={17} /></Button></div></td></tr>)}</Table>}
    <Modal open={open} onClose={close} title={editing ? 'Editar cliente' : 'Novo cliente'} footer={<><Button variant="outline" onClick={close}>Cancelar</Button><Button type="submit" form="client-form" loading={saving}>Salvar cliente</Button></>}><form id="client-form" key={editing?.id ?? 'new'} className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2" onSubmit={submit}><Input containerClassName="sm:col-span-2" name="name" label="Nome do cliente ou empresa *" defaultValue={editing?.name} required /><Input name="document" label="CPF / CNPJ" defaultValue={editing?.document ?? ''} /><Input name="phone" label="Telefone / WhatsApp" defaultValue={editing?.phone ?? ''} /><Input name="email" type="email" label="E-mail" defaultValue={editing?.email ?? ''} /><Input name="instagram" label="Instagram / rede social" defaultValue={editing?.instagram ?? ''} /><Input containerClassName="sm:col-span-2" name="address" label="Endereço" defaultValue={editing?.address ?? ''} /><Input name="city" label="Cidade" defaultValue={editing?.city ?? ''} /><Input name="state" label="UF" maxLength={2} defaultValue={editing?.state ?? ''} /><Textarea containerClassName="sm:col-span-2" name="notes" label="Observações" defaultValue={editing?.notes ?? ''} /></form></Modal>
    <ConfirmDialog open={Boolean(deleting)} title="Excluir cliente?" description={`Confirme a exclusão de ${deleting?.name ?? 'este cliente'}. Os orçamentos existentes serão preservados com os dados registrados.`} confirmLabel="Excluir" onCancel={() => setDeleting(null)} onConfirm={() => void remove()} />
  </Card>
}

function nullable(value: FormDataEntryValue | null): string | null { const text = String(value ?? '').trim(); return text || null }
