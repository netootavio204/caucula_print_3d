import { FolderKanban, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MoneyInput } from '../../components/forms/MoneyInput'
import { NumberInput } from '../../components/forms/NumberInput'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataError, DataLoading } from '../../components/ui/DataState'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { useFilaments } from '../../hooks/useFilaments'
import { useMachines } from '../../hooks/useMachines'
import { modelFilamentsFromDetails, useProjects, type ProjectModelFilamentInput, type ProjectModelInput } from '../../hooks/useProjects'
import { useSupplies } from '../../hooks/useSupplies'
import { getDatabaseErrorMessage } from '../../lib/databaseErrors'
import { formatCurrency } from '../../lib/formatters'
import type { ProjectModelRow } from '../../types/database'

const emptyFilament: ProjectModelFilamentInput = { filamentId: '', colorName: '', weightG: 0 }
const emptyProject: ProjectModelInput = {
  name: '',
  description: '',
  localFolderPath: '',
  projectUrl: '',
  thumbnailUrl: '',
  printDays: 0,
  printHours: 0,
  printMinutes: 0,
  printSeconds: 0,
  piecesPerPlate: 1,
  plateQuantity: 1,
  nozzleDiameter: null,
  sizeX: null,
  sizeY: null,
  sizeZ: null,
  defaultMachineId: null,
  defaultFilamentId: null,
  defaultFilamentWeightG: null,
  filaments: [{ ...emptyFilament }],
  supplies: [],
  extraCosts: [],
}

export function Projects() {
  const hook = useProjects()
  const machines = useMachines()
  const filaments = useFilaments()
  const supplies = useSupplies()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ProjectModelInput>(emptyProject)
  const [editing, setEditing] = useState<ProjectModelRow | null>(null)
  const [deleting, setDeleting] = useState<ProjectModelRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)

  const set = <K extends keyof ProjectModelInput>(key: K, value: ProjectModelInput[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const close = () => { setOpen(false); setEditing(null); setDraft(emptyProject) }
  const newProject = () => { setDraft(emptyProject); setEditing(null); setOpen(true) }

  const edit = async (project: ProjectModelRow) => {
    setLoadingEdit(true)
    try {
      const details = await hook.getProject(project.id)
      const model = details.model
      setEditing(model)
      setDraft({
        name: model.name,
        description: model.description ?? '',
        localFolderPath: model.local_folder_path ?? '',
        projectUrl: model.project_url ?? '',
        thumbnailUrl: model.thumbnail_url ?? '',
        printDays: model.print_days,
        printHours: model.print_hours,
        printMinutes: model.print_minutes,
        printSeconds: model.print_seconds,
        piecesPerPlate: model.pieces_per_plate,
        plateQuantity: model.plate_quantity,
        nozzleDiameter: model.nozzle_diameter,
        sizeX: model.size_x,
        sizeY: model.size_y,
        sizeZ: model.size_z,
        defaultMachineId: model.default_machine_id,
        defaultFilamentId: model.default_filament_id,
        defaultFilamentWeightG: model.default_filament_weight_g,
        filaments: modelFilamentsFromDetails(model, details.filaments),
        supplies: details.supplies.map((item) => ({ supplyId: item.supply_id, quantityUsed: item.quantity_used })),
        extraCosts: details.extraCosts.map((item) => ({ name: item.name, value: item.value })),
      })
      setOpen(true)
    } catch (error) {
      showToast(getDatabaseErrorMessage(error, 'Erro ao carregar projeto.'), 'error')
    } finally {
      setLoadingEdit(false)
    }
  }

  useEffect(() => {
    const modelId = searchParams.get('modelo')
    if (!modelId || hook.loading || loadingEdit) return
    const project = hook.projects.find((item) => item.id === modelId)
    if (!project) return
    setSearchParams({}, { replace: true })
    void edit(project)
  }, [hook.loading, hook.projects, loadingEdit, searchParams, setSearchParams])

  const validate = () => {
    if (!draft.name.trim() || draft.piecesPerPlate <= 0 || draft.plateQuantity <= 0 || totalHours(draft) <= 0) return 'Informe nome, tempo e quantidade do projeto.'
    const rows = activeFilaments(draft.filaments)
    if (rows.length === 0) return 'Informe pelo menos um filamento do modelo.'
    if (rows.some((item) => !item.filamentId || item.weightG <= 0)) return 'Selecione o filamento e informe peso maior que zero em cada linha.'
    if (draft.supplies.some((item) => !item.supplyId || item.quantityUsed <= 0) || draft.extraCosts.some((item) => !item.name.trim() || item.value < 0)) return 'Revise os insumos e custos padrao.'
    return null
  }

  const save = async () => {
    const validation = validate()
    if (validation) { showToast(validation, 'error'); return }
    setSaving(true)
    try {
      await hook.saveProject({ ...draft, filaments: activeFilaments(draft.filaments) }, editing?.id)
      showToast(editing ? 'Projeto atualizado com sucesso.' : 'Projeto criado com sucesso.', 'success')
      close()
    } catch (error) {
      showToast(getDatabaseErrorMessage(error, 'Erro ao salvar projeto.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleting) return
    try {
      await hook.deleteProject(deleting.id)
      showToast('Projeto excluído com sucesso.', 'success')
      setDeleting(null)
    } catch (error) {
      showToast(getDatabaseErrorMessage(error, 'Erro ao excluir projeto.'), 'error')
    }
  }

  const setFilament = <K extends keyof ProjectModelFilamentInput>(index: number, key: K, value: ProjectModelFilamentInput[K]) => {
    set('filaments', draft.filaments.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item))
  }
  const addFilament = () => set('filaments', [...draft.filaments, { ...emptyFilament }])
  const removeFilament = (index: number) => set('filaments', draft.filaments.filter((_, itemIndex) => itemIndex !== index))

  const loading = hook.loading || machines.loading || filaments.loading || supplies.loading || loadingEdit
  const error = hook.error ?? machines.error ?? filaments.error ?? supplies.error

  return <Card title="Projetos e modelos" description="Salve configurações para orçamentos recorrentes." action={<Button onClick={newProject}><Plus size={18} />Novo modelo</Button>}>
    {loading ? <DataLoading /> : error ? <DataError message={getDatabaseErrorMessage(new Error(error), 'Erro ao carregar projetos.')} /> : hook.projects.length === 0 ? <EmptyState icon={FolderKanban} title="Nenhum projeto cadastrado" description="Crie um modelo para preencher futuros orçamentos automaticamente." action={<Button onClick={newProject}><Plus size={18} />Criar modelo</Button>} /> : <div className="grid gap-4 lg:grid-cols-2">{hook.projects.map((project) => {
      const modelFilaments = modelFilamentsFromDetails(project, hook.filamentsForProject(project))
      const totalWeight = modelFilaments.reduce((sum, item) => sum + item.weightG, 0)
      return <article key={project.id} className="rounded-2xl border border-border p-5">
        <div className="flex gap-4">
          {project.thumbnail_url ? <img src={project.thumbnail_url} alt="" className="size-16 rounded-xl object-cover" /> : <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary"><FolderKanban /></span>}
          <div className="min-w-0">
            <h2 className="truncate font-bold">{project.name}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description || 'Sem descrição'}</p>
            <p className="mt-2 text-xs text-slate-500">{project.pieces_per_plate * project.plate_quantity} peça(s) • {totalHours(project).toFixed(2)} h • {totalWeight.toLocaleString('pt-BR')} g</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Filamentos do modelo</p>
          <div className="mt-2 space-y-1">{modelFilaments.map((row, index) => <p key={`${row.filamentId}-${index}`} className="text-sm text-slate-700">{filamentLabel(row.filamentId, row.colorName, filaments.filaments)}: <strong>{row.weightG.toLocaleString('pt-BR')} g</strong></p>)}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="min-h-9 px-3" onClick={() => navigate(`/app/orcamento?modelo=${project.id}`)}><Play size={16} />Usar no orçamento</Button>
          <Button variant="outline" className="min-h-9 px-3" onClick={() => void edit(project)}><Pencil size={16} />Editar</Button>
          <Button variant="ghost" className="min-h-9 px-3 text-danger hover:bg-red-50" onClick={() => setDeleting(project)}><Trash2 size={16} />Excluir</Button>
        </div>
      </article>
    })}</div>}

    <Modal open={open} onClose={close} title={editing ? 'Editar modelo' : 'Novo modelo'} size="lg" footer={<><Button variant="outline" onClick={close}>Cancelar</Button><Button loading={saving} onClick={() => void save()}>Salvar modelo</Button></>}>
      <div className="min-w-0 space-y-6 overflow-x-hidden">
        <ModalSection title="Informações básicas">
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Input containerClassName="md:col-span-2 min-w-0" label="Nome do projeto *" value={draft.name} onChange={(event) => set('name', event.target.value)} />
            <Textarea containerClassName="md:col-span-2 min-w-0" label="Descrição / observações" value={draft.description} onChange={(event) => set('description', event.target.value)} />
            <Input containerClassName="min-w-0" label="Caminho da pasta local" value={draft.localFolderPath} onChange={(event) => set('localFolderPath', event.target.value)} />
            <Input containerClassName="min-w-0" type="url" label="URL do projeto" value={draft.projectUrl} onChange={(event) => set('projectUrl', event.target.value)} />
            <Input containerClassName="md:col-span-2 min-w-0 [&_input]:truncate" type="url" label="URL da miniatura" value={draft.thumbnailUrl} onChange={(event) => set('thumbnailUrl', event.target.value)} />
          </div>
        </ModalSection>

        <ModalSection title="Tempo e produção">
          <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
            <NumberInput label="Dias" value={draft.printDays} onChange={(event) => set('printDays', number(event.target.value))} />
            <NumberInput label="Horas" value={draft.printHours} onChange={(event) => set('printHours', number(event.target.value))} />
            <NumberInput label="Minutos" value={draft.printMinutes} onChange={(event) => set('printMinutes', number(event.target.value))} />
            <NumberInput label="Segundos" value={draft.printSeconds} onChange={(event) => set('printSeconds', number(event.target.value))} />
            <NumberInput label="Peças/bandeja" min="1" value={draft.piecesPerPlate} onChange={(event) => set('piecesPerPlate', number(event.target.value))} />
            <NumberInput label="Bandejas" min="1" value={draft.plateQuantity} onChange={(event) => set('plateQuantity', number(event.target.value))} />
            <NumberInput label="Bico (mm)" value={draft.nozzleDiameter ?? ''} onChange={(event) => set('nozzleDiameter', optional(event.target.value))} />
          </div>
        </ModalSection>

        <ModalSection title="Medidas">
          <div className="grid min-w-0 gap-3 sm:grid-cols-3">
            <NumberInput label="X (mm)" value={draft.sizeX ?? ''} onChange={(event) => set('sizeX', optional(event.target.value))} />
            <NumberInput label="Y (mm)" value={draft.sizeY ?? ''} onChange={(event) => set('sizeY', optional(event.target.value))} />
            <NumberInput label="Z (mm)" value={draft.sizeZ ?? ''} onChange={(event) => set('sizeZ', optional(event.target.value))} />
          </div>
        </ModalSection>

        <ModalSection title="Impressora">
          <Select label="Impressora padrão" value={draft.defaultMachineId ?? ''} onChange={(event) => set('defaultMachineId', event.target.value || null)}>
            <option value="">Nenhuma</option>
            {machines.machines.map((item) => <option key={item.id} value={item.id}>{item.model}</option>)}
          </Select>
        </ModalSection>

        <Defaults title="Filamentos do modelo" addLabel="Adicionar filamento/cor" add={addFilament}>
          {draft.filaments.map((row, index) => <div className="grid min-w-0 gap-3 rounded-lg border border-border bg-slate-50 p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_auto]" key={index}>
            <Select containerClassName="min-w-0" label="Filamento *" value={row.filamentId} onChange={(event) => setFilament(index, 'filamentId', event.target.value)}>
              <option value="">Selecione</option>
              {filaments.filaments.map((item) => <option key={item.id} value={item.id}>{item.type_brand} - {item.color}</option>)}
            </Select>
            <Input containerClassName="min-w-0" label="Cor/nome opcional" value={row.colorName} onChange={(event) => setFilament(index, 'colorName', event.target.value)} />
            <NumberInput label="Peso (g) *" value={row.weightG || ''} onChange={(event) => setFilament(index, 'weightG', number(event.target.value))} />
            <div className="flex items-end justify-between gap-3 md:justify-end">
              <div className="min-w-24 rounded-lg bg-white px-3 py-2 text-sm md:hidden">
                <span className="field-label">Custo</span>
                <strong>{formatCurrency(projectFilamentCost(row, filaments.filaments))}</strong>
              </div>
              <Delete onClick={() => removeFilament(index)} />
            </div>
          </div>)}
          <div className="rounded-lg bg-blue-50 p-3 text-sm font-semibold text-primary">
            Custo total dos filamentos: {formatCurrency(draft.filaments.reduce((sum, row) => sum + projectFilamentCost(row, filaments.filaments), 0))}
          </div>
        </Defaults>

        <ModalSection title="Insumos e custos extras">
          <Defaults title="Insumos padrão" addLabel="Adicionar insumo" add={() => set('supplies', [...draft.supplies, { supplyId: '', quantityUsed: 0 }])}>{draft.supplies.map((row, index) => <div className="grid min-w-0 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]" key={index}><Select containerClassName="min-w-0" value={row.supplyId} onChange={(event) => set('supplies', replace(draft.supplies, index, { ...row, supplyId: event.target.value }))}><option value="">Selecione</option>{supplies.supplies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><NumberInput value={row.quantityUsed || ''} onChange={(event) => set('supplies', replace(draft.supplies, index, { ...row, quantityUsed: number(event.target.value) }))} /><Delete onClick={() => set('supplies', draft.supplies.filter((_, itemIndex) => itemIndex !== index))} /></div>)}</Defaults>
          <Defaults title="Custos extras padrão" addLabel="Adicionar custo" add={() => set('extraCosts', [...draft.extraCosts, { name: '', value: 0 }])}>{draft.extraCosts.map((row, index) => <div className="grid min-w-0 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]" key={index}><Input containerClassName="min-w-0" value={row.name} onChange={(event) => set('extraCosts', replace(draft.extraCosts, index, { ...row, name: event.target.value }))} /><MoneyInput value={row.value || ''} onChange={(event) => set('extraCosts', replace(draft.extraCosts, index, { ...row, value: number(event.target.value) }))} /><Delete onClick={() => set('extraCosts', draft.extraCosts.filter((_, itemIndex) => itemIndex !== index))} /></div>)}</Defaults>
        </ModalSection>
      </div>
    </Modal>
    <ConfirmDialog open={Boolean(deleting)} title="Excluir modelo?" description="O modelo será removido. Orçamentos já criados não serão alterados." confirmLabel="Excluir" onCancel={() => setDeleting(null)} onConfirm={() => void remove()} />
  </Card>
}

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-lg border border-border bg-white p-4">
    <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
    <div className="min-w-0">{children}</div>
  </section>
}
function Defaults({ title, addLabel, add, children }: { title: string; addLabel: string; add: () => void; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-lg border border-border bg-white p-4"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-sm font-semibold text-slate-900">{title}</h3><Button variant="ghost" className="min-h-9 px-3 text-primary" onClick={add}><Plus size={15} />{addLabel}</Button></div><div className="min-w-0 space-y-3">{children}</div></section>
}
function Delete({ onClick }: { onClick: () => void }) { return <Button variant="ghost" className="min-h-11 px-2 text-danger" onClick={onClick} aria-label="Remover"><Trash2 size={17} /></Button> }
function number(value: string) { const parsed = Number(value.replace(',', '.')); return Number.isFinite(parsed) ? parsed : 0 }
function optional(value: string) { return value === '' ? null : number(value) }
function replace<T>(items: T[], index: number, value: T) { return items.map((item, itemIndex) => itemIndex === index ? value : item) }
type ProjectTimeFields =
  | Pick<ProjectModelInput, 'printDays' | 'printHours' | 'printMinutes' | 'printSeconds'>
  | Pick<ProjectModelRow, 'print_days' | 'print_hours' | 'print_minutes' | 'print_seconds'>

function totalHours(model: ProjectTimeFields) {
  const days = 'printDays' in model ? model.printDays : model.print_days
  const hours = 'printHours' in model ? model.printHours : model.print_hours
  const minutes = 'printMinutes' in model ? model.printMinutes : model.print_minutes
  const seconds = 'printSeconds' in model ? model.printSeconds : model.print_seconds
  return days * 24 + hours + minutes / 60 + seconds / 3600
}
function activeFilaments(rows: ProjectModelFilamentInput[]) {
  return rows.filter((item) => item.filamentId || item.colorName.trim() || item.weightG > 0)
}
function filamentLabel(id: string, colorName: string, rows: Array<{ id: string; type_brand: string; color: string }>) {
  const filament = rows.find((item) => item.id === id)
  const base = filament ? `${filament.type_brand} - ${filament.color}` : 'Filamento'
  return colorName ? `${base} (${colorName})` : base
}
function projectFilamentCost(row: ProjectModelFilamentInput, rows: Array<{ id: string; price_per_gram: number }>) {
  const filament = rows.find((item) => item.id === row.filamentId)
  return row.weightG * (filament?.price_per_gram ?? 0)
}
