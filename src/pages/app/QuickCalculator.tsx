import { FolderOpen, ImagePlus, Plus, Save, Send, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoneyInput } from '../../components/forms/MoneyInput'
import { NumberInput } from '../../components/forms/NumberInput'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataError, DataLoading } from '../../components/ui/DataState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { useFilaments } from '../../hooks/useFilaments'
import { useMachines } from '../../hooks/useMachines'
import { useProjects } from '../../hooks/useProjects'
import { useSettings } from '../../hooks/useSettings'
import { useSupplies } from '../../hooks/useSupplies'
import { calculateBudget } from '../../lib/calculations'
import { getDatabaseErrorMessage } from '../../lib/databaseErrors'
import { formatCurrency, parseNumberBR } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'
import type { BudgetFormData } from '../../types/budget'

const QUICK_DRAFT_KEY = 'calculaprint.quickCalculatorDraft'
const PROJECT_MODEL_IMAGE_BUCKET = 'project-model-images'
const QUICK_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface QuickFilament { filamentId: string; colorName: string; weightG: number }
interface QuickSupply { supplyId: string; quantityUsed: number }
interface QuickExtraCost { name: string; value: number }
interface QuickForm {
  name: string
  description: string
  machineId: string
  printTime: string
  finalPieces: number
  plateQuantity: number
  saleMarkupPercent: number
  nozzleDiameter: number | null
  sizeX: number | null
  sizeY: number | null
  sizeZ: number | null
  filaments: QuickFilament[]
  supplies: QuickSupply[]
  extraCosts: QuickExtraCost[]
}

const emptyFilament: QuickFilament = { filamentId: '', colorName: '', weightG: 0 }
const initialForm: QuickForm = {
  name: '',
  description: '',
  machineId: '',
  printTime: '',
  finalPieces: 1,
  plateQuantity: 1,
  saleMarkupPercent: 100,
  nozzleDiameter: null,
  sizeX: null,
  sizeY: null,
  sizeZ: null,
  filaments: [{ ...emptyFilament }],
  supplies: [],
  extraCosts: [],
}

export function QuickCalculator() {
  const filamentHook = useFilaments()
  const machineHook = useMachines()
  const supplyHook = useSupplies()
  const settingHook = useSettings()
  const projectHook = useProjects()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState<QuickForm>(initialForm)
  const [savingModel, setSavingModel] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [savedModelId, setSavedModelId] = useState<string | null>(null)

  const selectedMachine = machineHook.machines.find((item) => item.id === form.machineId)
  const machinePowerWatts = numericValue(selectedMachine?.consumption_watts)
  const energyPriceKwh = numericValue(settingHook.settings?.energy_price_kwh)
  const activeFilaments = form.filaments.filter((item) => item.filamentId || item.colorName.trim() || item.weightG > 0)
  const activeSupplies = form.supplies.filter((item) => item.supplyId || item.quantityUsed > 0)
  const activeExtraCosts = form.extraCosts.filter((item) => item.name.trim() || item.value > 0)
  const filamentCosts = activeFilaments.map((row) => {
    const filament = filamentHook.filaments.find((item) => item.id === row.filamentId)
    return { ...row, filament, cost: row.weightG * (filament?.price_per_gram ?? 0) }
  })
  const totalWeight = activeFilaments.reduce((sum, row) => sum + row.weightG, 0)
  const parsedTime = parsePrintTime(form.printTime)
  const calculation = useMemo(() => calculateBudget({
    printDays: 0,
    printHours: parsedTime.hours,
    printMinutes: parsedTime.minutes,
    printSeconds: 0,
    piecesPerPlate: form.finalPieces,
    plateQuantity: 1,
    filaments: form.filaments.map((item) => ({ filamentId: item.filamentId, weightUsedG: item.weightG, pricePerGram: filamentHook.filaments.find((filament) => filament.id === item.filamentId)?.price_per_gram ?? 0 })),
    supplies: form.supplies.map((item) => ({ supplyId: item.supplyId, quantityUsed: item.quantityUsed, unitCost: supplyHook.supplies.find((supply) => supply.id === item.supplyId)?.unit_cost ?? 0 })),
    extraCosts: form.extraCosts,
    consumptionWatts: machinePowerWatts,
    maintenancePerHour: numericValue(selectedMachine?.maintenance_per_hour),
    machineValue: numericValue(selectedMachine?.machine_value),
    estimatedLifeHours: numericValue(selectedMachine?.estimated_life_hours),
    energyPriceKwh,
    failureMarginPercent: numericValue(settingHook.settings?.failure_margin_percent),
    markupPercent: form.saleMarkupPercent,
    taxesPercent: 0,
    cardFeePercent: 0,
    fixedAdsCost: 0,
  }), [form, parsedTime.hours, parsedTime.minutes, filamentHook.filaments, machinePowerWatts, selectedMachine, energyPriceKwh, settingHook.settings, supplyHook.supplies])
  const estimatedEnergyKwh = (machinePowerWatts / 1000) * calculation.totalTimeHours
  const energyMissingConfig = calculation.totalTimeHours > 0 && calculation.energyCost === 0 && (machinePowerWatts <= 0 || energyPriceKwh <= 0)
  const showTimeFormatWarning = form.printTime.trim().length > 0 && !parsedTime.valid
  const lowMarkup = form.saleMarkupPercent < 100

  const set = <K extends keyof QuickForm>(key: K, value: QuickForm[K]) => setForm((current) => ({ ...current, [key]: value }))
  const setFilament = <K extends keyof QuickFilament>(index: number, key: K, value: QuickFilament[K]) => set('filaments', replaceAt(form.filaments, index, { ...form.filaments[index], [key]: value }))

  const validate = () => {
    if (!form.name.trim()) return 'Informe o nome da peca.'
    if (!form.machineId) return 'Selecione uma impressora.'
    if (!parsedTime.valid) return 'Informe o tempo no formato horas,minutos. Exemplo: 7,3 ou 43,07.'
    if (calculation.totalTimeHours <= 0 || form.finalPieces <= 0 || form.plateQuantity <= 0) return 'Informe tempo, quantidade de pecas finais e bandejas validos.'
    if (activeFilaments.length === 0) return 'Adicione pelo menos um filamento.'
    if (activeFilaments.some((item) => !item.filamentId)) return 'Todos os filamentos precisam estar selecionados.'
    if (activeFilaments.some((item) => item.weightG <= 0)) return 'Todos os filamentos precisam ter peso maior que zero.'
    if (activeSupplies.some((item) => !item.supplyId || item.quantityUsed <= 0)) return 'Revise os insumos informados.'
    if (activeExtraCosts.some((item) => !item.name.trim() || item.value < 0)) return 'Revise os custos extras informados.'
    return null
  }

  const handleImage = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    if (!file) { setImageFile(null); setImagePreview(null); return }
    if (!QUICK_IMAGE_TYPES.includes(file.type)) {
      showToast('Envie uma imagem JPG, PNG ou WebP.', 'error')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const convertToBudget = async () => {
    const validation = validate()
    if (validation) { showToast(validation, 'error'); return }
    if (!window.confirm('Abrir a tela de orcamento com estes dados preenchidos? Nenhum orcamento sera salvo automaticamente.')) return
    let thumbnailUrl = ''
    if (imageFile) {
      try {
        thumbnailUrl = await uploadQuickBudgetImage(imageFile)
      } catch {
        showToast('Nao foi possivel enviar a imagem agora. O orcamento sera aberto sem imagem.', 'info')
      }
    }
    const draft: BudgetFormData = {
      clientId: null,
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      clientAddress: '',
      clientCity: '',
      clientState: '',
      projectName: form.name,
      description: quickDescription(form),
      projectUrl: '',
      localFolderPath: '',
      thumbnailUrl,
      printDays: 0,
      printHours: parsedTime.hours,
      printMinutes: parsedTime.minutes,
      printSeconds: 0,
      piecesPerPlate: form.finalPieces,
      plateQuantity: 1,
      nozzleDiameter: form.nozzleDiameter,
      sizeX: form.sizeX,
      sizeY: form.sizeY,
      sizeZ: form.sizeZ,
      machineId: form.machineId,
      saleMarkupPercent: form.saleMarkupPercent,
      filaments: activeFilaments.map((item) => ({ filamentId: item.filamentId, weightUsedG: item.weightG })),
      supplies: activeSupplies,
      extraCosts: activeExtraCosts,
    }
    sessionStorage.setItem(QUICK_DRAFT_KEY, JSON.stringify(draft))
    navigate('/app/orcamento')
  }

  const saveAsModel = async () => {
    const validation = validate()
    if (validation) { showToast(validation, 'error'); return }
    if (!window.confirm('Salvar estes dados como projeto/modelo?')) return
    setSavingModel(true)
    try {
      const modelId = await projectHook.saveProject({
        name: form.name,
        description: quickDescription(form),
        localFolderPath: '',
        projectUrl: '',
        thumbnailUrl: '',
        printDays: 0,
        printHours: parsedTime.hours,
        printMinutes: parsedTime.minutes,
        printSeconds: 0,
        piecesPerPlate: form.finalPieces,
        plateQuantity: 1,
        nozzleDiameter: form.nozzleDiameter,
        sizeX: form.sizeX,
        sizeY: form.sizeY,
        sizeZ: form.sizeZ,
        defaultMachineId: form.machineId,
        defaultFilamentId: null,
        defaultFilamentWeightG: null,
        filaments: activeFilaments.map((item) => ({ filamentId: item.filamentId, colorName: item.colorName, weightG: item.weightG })),
        supplies: activeSupplies,
        extraCosts: activeExtraCosts,
      })
      if (imageFile) {
        try {
          const thumbnailPath = await uploadQuickImage(imageFile, modelId)
          await saveModelThumbnail(modelId, thumbnailPath)
          await projectHook.reload()
        } catch (imageError) {
          console.info('[quick-calculator.saveAsModel] optional image upload failed', imageError instanceof Error ? imageError.message : String(imageError))
          setSavedModelId(modelId)
          showToast(`Nao foi possivel salvar a imagem: ${imageError instanceof Error ? imageError.message : 'erro desconhecido'}. O modelo foi salvo.`, 'info')
          return
        }
      }
      setSavedModelId(modelId)
      showToast('Modelo salvo com sucesso.', 'success')
    } catch (error) {
      console.info('[quick-calculator.saveAsModel] model save failed', error instanceof Error ? error.message : String(error))
      showToast(getDatabaseErrorMessage(error, error instanceof Error ? error.message : 'Erro ao salvar modelo.'), 'error')
    } finally {
      setSavingModel(false)
    }
  }

  const loading = filamentHook.loading || machineHook.loading || supplyHook.loading || settingHook.loading
  const error = filamentHook.error ?? machineHook.error ?? supplyHook.error ?? settingHook.error
  if (loading) return <Card><DataLoading /></Card>
  if (error) return <Card><DataError message={getDatabaseErrorMessage(new Error(error), 'Erro ao carregar a calculadora rapida.')} /></Card>

  return <div className="space-y-6">
    <Card title="Calculadora Rapida" description="Simule preco sem criar cliente, orcamento ou projeto automaticamente.">
      <div className="grid gap-4 lg:grid-cols-4">
        <Input containerClassName="lg:col-span-2" label="Nome da peca *" value={form.name} onChange={(event) => set('name', event.target.value)} />
        <Select containerClassName="lg:col-span-2" label="Impressora *" value={form.machineId} onChange={(event) => set('machineId', event.target.value)}>
          <option value="">Selecione</option>
          {machineHook.machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.model}</option>)}
        </Select>
        <div className="lg:col-span-2">
          <Input label="Tempo total de impressao" placeholder="Exemplo: 7,3 ou 43,07" value={form.printTime} onChange={(event) => set('printTime', event.target.value)} />
          {showTimeFormatWarning && <p className="mt-2 text-sm font-medium text-amber-700">Informe o tempo no formato horas,minutos. Exemplo: 7,3 ou 43,07.</p>}
        </div>
        <NumberInput label="Quantidade de pecas finais" min="1" value={form.finalPieces} onChange={(event) => set('finalPieces', parseNumberBR(event.target.value))} />
        <NumberInput label="Bandejas/placas" min="1" value={form.plateQuantity} onChange={(event) => set('plateQuantity', parseNumberBR(event.target.value))} />
        <div className="lg:col-span-4 rounded-xl border border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <strong className="block text-sm text-slate-900">Imagem da peca</strong>
              <p className="mt-1 text-sm text-slate-500">JPG, PNG ou WebP. A imagem fica temporaria ate converter ou salvar.</p>
            </div>
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <ImagePlus size={18} />Enviar imagem
              <input className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => handleImage(event.target.files?.[0] ?? null)} />
            </label>
          </div>
          {imagePreview && <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <img src={imagePreview} alt="Preview da peca" className="h-40 w-full rounded-xl object-cover sm:w-56" />
            <Button type="button" variant="outline" className="border-red-200 text-danger hover:bg-red-50" onClick={() => handleImage(null)}><X size={18} />Remover imagem</Button>
          </div>}
        </div>
        <div className="lg:col-span-2">
          <NumberInput label="Lucro / Markup de venda (%)" min="0" value={form.saleMarkupPercent} onChange={(event) => set('saleMarkupPercent', parseNumberBR(event.target.value))} />
          <div className="mt-2 flex flex-wrap gap-2">
            {[50, 80, 100, 120, 150].map((value) => <Button key={value} type="button" variant={form.saleMarkupPercent === value ? 'primary' : 'outline'} className="min-h-9 px-3 text-xs" onClick={() => set('saleMarkupPercent', value)}>{value}%</Button>)}
          </div>
        </div>
        <NumberInput label="Bico (mm)" value={form.nozzleDiameter ?? ''} onChange={(event) => set('nozzleDiameter', optionalNumber(event.target.value))} />
        <NumberInput label="Medida X (mm)" value={form.sizeX ?? ''} onChange={(event) => set('sizeX', optionalNumber(event.target.value))} />
        <NumberInput label="Medida Y (mm)" value={form.sizeY ?? ''} onChange={(event) => set('sizeY', optionalNumber(event.target.value))} />
        <NumberInput label="Medida Z (mm)" value={form.sizeZ ?? ''} onChange={(event) => set('sizeZ', optionalNumber(event.target.value))} />
        <Textarea containerClassName="lg:col-span-4" label="Observacoes" value={form.description} onChange={(event) => set('description', event.target.value)} />
      </div>
    </Card>

    <Card title="Filamentos usados" action={<Button variant="outline" onClick={() => set('filaments', [...form.filaments, { ...emptyFilament }])}><Plus size={16} />Adicionar filamento</Button>}>
      <div className="space-y-3">{form.filaments.map((row, index) => <div key={index} className="grid gap-3 rounded-xl bg-slate-50 p-3 lg:grid-cols-[1.3fr_1fr_140px_auto]">
        <Select label="Filamento *" value={row.filamentId} onChange={(event) => setFilament(index, 'filamentId', event.target.value)}>
          <option value="">Selecione</option>
          {filamentHook.filaments.map((filament) => <option key={filament.id} value={filament.id}>{filament.type_brand} - {filament.color}</option>)}
        </Select>
        <Input label="Cor/nome opcional" value={row.colorName} onChange={(event) => setFilament(index, 'colorName', event.target.value)} />
        <NumberInput label="Peso (g) *" value={row.weightG || ''} onChange={(event) => setFilament(index, 'weightG', parseNumberBR(event.target.value))} />
        <div className="flex items-end"><Button variant="ghost" className="min-h-11 px-3 text-danger hover:bg-red-50" onClick={() => set('filaments', form.filaments.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remover filamento"><Trash2 size={18} /></Button></div>
      </div>)}</div>
    </Card>

    <Card title="Insumos e custos extras">
      <DynamicRows title="Insumos" addLabel="Adicionar insumo" onAdd={() => set('supplies', [...form.supplies, { supplyId: '', quantityUsed: 0 }])}>{form.supplies.map((row, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_160px_auto]"><Select value={row.supplyId} onChange={(event) => set('supplies', replaceAt(form.supplies, index, { ...row, supplyId: event.target.value }))}><option value="">Selecione o insumo</option>{supplyHook.supplies.map((supply) => <option key={supply.id} value={supply.id}>{supply.name}</option>)}</Select><NumberInput value={row.quantityUsed || ''} onChange={(event) => set('supplies', replaceAt(form.supplies, index, { ...row, quantityUsed: parseNumberBR(event.target.value) }))} /><Remove onClick={() => set('supplies', form.supplies.filter((_, itemIndex) => itemIndex !== index))} /></div>)}</DynamicRows>
      <DynamicRows title="Custos extras" addLabel="Adicionar custo" onAdd={() => set('extraCosts', [...form.extraCosts, { name: '', value: 0 }])}>{form.extraCosts.map((row, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_160px_auto]"><Input value={row.name} onChange={(event) => set('extraCosts', replaceAt(form.extraCosts, index, { ...row, name: event.target.value }))} /><MoneyInput value={row.value || ''} onChange={(event) => set('extraCosts', replaceAt(form.extraCosts, index, { ...row, value: parseNumberBR(event.target.value) }))} /><Remove onClick={() => set('extraCosts', form.extraCosts.filter((_, itemIndex) => itemIndex !== index))} /></div>)}</DynamicRows>
    </Card>

    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card title="Resumo dos filamentos">
        <CostRows rows={filamentCosts.map((row) => [filamentName(row.filamentId, row.colorName, filamentHook.filaments), row.cost])} />
        <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-primary">Peso total: {totalWeight.toLocaleString('pt-BR')} g</div>
      </Card>
      <Card title="Resultado estimado">
        <CostRows rows={[
          ['Peso total', totalWeight, 'weight'],
          ['Tempo total', calculation.totalTimeHours, 'hours'],
          ['Bandejas/placas usadas', form.plateQuantity, 'quantity'],
          ['Quantidade de pecas finais', form.finalPieces, 'quantity'],
          ['Custo total dos filamentos', calculation.filamentCost],
          ['Energia estimada usada', estimatedEnergyKwh, 'kwh'],
          ['Custo de energia', calculation.energyCost],
          ['Custo da impressora/tempo', calculation.serviceCost],
          ['Insumos', calculation.suppliesCost],
          ['Custos extras', calculation.extraCosts],
          ['Custo total estimado', calculation.totalProductionCost],
          [`Lucro/markup aplicado (${form.saleMarkupPercent.toLocaleString('pt-BR')}%)`, calculation.grossProfit],
          ['Valor sugerido de venda', calculation.suggestedPrice],
          ['Valor por peca final', calculation.pricePerPiece],
        ]} highlightLast />
        {energyMissingConfig && <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">Energia nao calculada porque falta potencia da impressora ou valor do kWh nas configuracoes.</div>}
        {lowMarkup && <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">Revise o lucro aplicado. Para venda comercial, use um markup compativel com o risco, acabamento, falhas e tempo de producao.</div>}
        <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-primary">
          Valor por peca final: {formatCurrency(calculation.pricePerPiece)}
        </div>
      </Card>
    </div>

    <div className="flex flex-col justify-end gap-3 sm:flex-row">
      <Button variant="outline" onClick={() => void convertToBudget()}><Send size={18} />Converter em orcamento</Button>
      <Button loading={savingModel} onClick={() => void saveAsModel()}><Save size={18} />Salvar como projeto/modelo</Button>
    </div>
    <Modal
      open={Boolean(savedModelId)}
      onClose={() => setSavedModelId(null)}
      title="Modelo salvo"
      footer={<>
        <Button variant="outline" onClick={() => { setSavedModelId(null); navigate('/app/projetos') }}><FolderOpen size={18} />Ir para Projetos</Button>
        <Button onClick={() => { const id = savedModelId; setSavedModelId(null); navigate(id ? `/app/projetos?modelo=${id}` : '/app/projetos') }}><FolderOpen size={18} />Abrir modelo</Button>
      </>}
    >
      <p className="text-sm text-slate-600">Modelo salvo com sucesso.</p>
    </Modal>
  </div>
}

function DynamicRows({ title, addLabel, onAdd, children }: { title: string; addLabel: string; onAdd: () => void; children: React.ReactNode }) {
  return <div className="border-t border-border py-4 first:border-t-0 first:pt-0"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{title}</h3><Button variant="ghost" className="min-h-9 px-3 text-primary" onClick={onAdd}><Plus size={16} />{addLabel}</Button></div><div className="space-y-3">{children}</div></div>
}
function Remove({ onClick }: { onClick: () => void }) { return <Button variant="ghost" className="min-h-11 px-3 text-danger hover:bg-red-50" onClick={onClick} aria-label="Remover"><Trash2 size={18} /></Button> }
type CostRowKind = 'currency' | 'weight' | 'hours' | 'quantity' | 'kwh'
function CostRows({ rows, highlightLast = false }: { rows: Array<[string, number, CostRowKind?]>; highlightLast?: boolean }) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">Nenhum item informado.</p>
  return <div className="divide-y divide-border">{rows.map(([label, value, kind = 'currency'], index) => <div key={`${label}-${index}`} className={`flex items-center justify-between gap-4 py-3 ${highlightLast && index === rows.length - 1 ? 'text-primary' : ''}`}><span className="text-sm text-slate-600">{label}</span><strong>{formatResultValue(value, kind)}</strong></div>)}</div>
}
function replaceAt<T>(items: T[], index: number, value: T) { return items.map((item, itemIndex) => itemIndex === index ? value : item) }
function optionalNumber(value: string) { return value === '' ? null : parseNumberBR(value) }
function parsePrintTime(value: string) {
  const totalMinutes = parsePrintTimeToMinutes(value)
  if (totalMinutes === null) return { valid: false, hours: 0, minutes: 0, totalMinutes: 0 }
  return { valid: true, hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60, totalMinutes }
}
function parsePrintTimeToMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d+)[,:](\d{1,2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isInteger(hours) || hours < 0 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}
function numericValue(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : 0
  if (typeof value === 'string') {
    const parsed = parseNumberBR(value)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }
  return 0
}
function quickDescription(form: QuickForm) {
  const note = `Calculadora Rapida: tempo total ${form.printTime}; ${form.plateQuantity.toLocaleString('pt-BR')} bandeja(s)/placa(s) usada(s) para ${form.finalPieces.toLocaleString('pt-BR')} peca(s) final(is). Markup de venda aplicado: ${form.saleMarkupPercent.toLocaleString('pt-BR')}%.`
  return form.description.trim() ? `${form.description.trim()}\n\n${note}` : note
}
async function uploadQuickImage(file: File, projectId?: string | null) {
  if (!projectId) throw new Error('Modelo salvo sem identificador para vincular imagem.')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error(userError?.message ?? 'Usuario nao autenticado.')
  const extension = file.name.split('.').pop()?.toLowerCase() || mimeExtension(file.type)
  const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : mimeExtension(file.type)
  const path = `${userData.user.id}/models/${projectId}/imagem.${safeExtension}`
  const { error } = await supabase.storage.from(PROJECT_MODEL_IMAGE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)
  return path
}
async function uploadQuickBudgetImage(file: File) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error(userError?.message ?? 'Usuario nao autenticado.')
  const extension = file.name.split('.').pop()?.toLowerCase() || mimeExtension(file.type)
  const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : mimeExtension(file.type)
  const path = `${userData.user.id}/quick-calculator/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`
  const { error } = await supabase.storage.from(PROJECT_MODEL_IMAGE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (error) throw new Error(error.message)
  const signed = await supabase.storage.from(PROJECT_MODEL_IMAGE_BUCKET).createSignedUrl(path, 60 * 60 * 24)
  if (signed.error || !signed.data?.signedUrl) throw new Error(signed.error?.message ?? 'Nao foi possivel gerar acesso temporario da imagem.')
  return signed.data.signedUrl
}
async function saveModelThumbnail(projectId: string | null, thumbnailPath: string) {
  if (!projectId) throw new Error('Modelo salvo sem identificador para vincular imagem.')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error(userError?.message ?? 'Usuario nao autenticado.')
  const { error } = await supabase.from('project_models').update({ thumbnail_url: thumbnailPath }).eq('id', projectId).eq('user_id', userData.user.id)
  if (error) throw new Error(error.message)
}
function mimeExtension(type: string) {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}
function formatResultValue(value: number, kind: CostRowKind) {
  if (kind === 'weight') return `${value.toLocaleString('pt-BR')} g`
  if (kind === 'hours') return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h`
  if (kind === 'kwh') return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kWh`
  if (kind === 'quantity') return value.toLocaleString('pt-BR')
  return formatCurrency(value)
}
function filamentName(id: string, colorName: string, rows: Array<{ id: string; type_brand: string; color: string }>) {
  const filament = rows.find((item) => item.id === id)
  const base = filament ? `${filament.type_brand} - ${filament.color}` : 'Filamento'
  return colorName ? `${base} (${colorName})` : base
}
