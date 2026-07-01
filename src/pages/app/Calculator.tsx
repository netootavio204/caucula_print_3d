import { FileDown, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MoneyInput } from '../../components/forms/MoneyInput'
import { NumberInput } from '../../components/forms/NumberInput'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataError, DataLoading } from '../../components/ui/DataState'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { useBudgets } from '../../hooks/useBudgets'
import { useClients } from '../../hooks/useClients'
import { useFilaments } from '../../hooks/useFilaments'
import { useMachines } from '../../hooks/useMachines'
import { modelFilamentsFromDetails, useProjects } from '../../hooks/useProjects'
import { useSettings } from '../../hooks/useSettings'
import { useSupplies } from '../../hooks/useSupplies'
import { calculateBudget } from '../../lib/calculations'
import { getDatabaseErrorMessage } from '../../lib/databaseErrors'
import { formatCurrency, parseNumberBR } from '../../lib/formatters'
import { generateBudgetPdf } from '../../lib/pdf'
import type { BudgetFormData } from '../../types/budget'

const initialForm: BudgetFormData = { clientId: null, clientName: '', clientPhone: '', clientEmail: '', clientAddress: '', clientCity: '', clientState: '', projectName: '', description: '', projectUrl: '', localFolderPath: '', thumbnailUrl: '', printDays: 0, printHours: 0, printMinutes: 0, printSeconds: 0, piecesPerPlate: 1, plateQuantity: 1, nozzleDiameter: null, sizeX: null, sizeY: null, sizeZ: null, machineId: '', saleMarkupPercent: null, manualFinalPrice: null, filaments: [{ filamentId: '', weightUsedG: 0 }], supplies: [], extraCosts: [] }
const QUICK_DRAFT_KEY = 'calculaprint.quickCalculatorDraft'

export function Calculator() {
  const filamentHook = useFilaments(); const machineHook = useMachines(); const supplyHook = useSupplies(); const settingHook = useSettings(); const clientHook = useClients(); const budgetHook = useBudgets(); const projectHook = useProjects()
  const [form, setForm] = useState<BudgetFormData>(initialForm); const [loadingData, setLoadingData] = useState(false); const [saving, setSaving] = useState(false); const [searchParams] = useSearchParams(); const navigate = useNavigate(); const { showToast } = useToast()
  const editId = searchParams.get('editar'); const modelId = searchParams.get('modelo')

  useEffect(() => {
    if (editId || modelId) return
    const rawDraft = sessionStorage.getItem(QUICK_DRAFT_KEY)
    if (!rawDraft) return
    try {
      const draft = JSON.parse(rawDraft) as BudgetFormData
      setForm({ ...initialForm, ...draft, id: undefined })
      sessionStorage.removeItem(QUICK_DRAFT_KEY)
      showToast('Dados da Calculadora Rapida carregados. Revise e salve o orcamento quando quiser.', 'success')
    } catch {
      sessionStorage.removeItem(QUICK_DRAFT_KEY)
      showToast('Nao foi possivel carregar a simulacao rapida.', 'error')
    }
  }, [editId, modelId, showToast])

  useEffect(() => {
    if (!editId && !modelId) return
    let active = true; setLoadingData(true)
    const load = async () => {
      try {
        if (editId) {
          const details = await budgetHook.getBudget(editId); const b = details.budget
          if (active) setForm({ id: b.id, clientId: b.client_id, clientName: b.client_name ?? '', clientPhone: b.client_phone ?? '', clientEmail: b.client_email ?? '', clientAddress: b.client_address ?? '', clientCity: b.client_city ?? '', clientState: b.client_state ?? '', projectName: b.project_name, description: b.description ?? '', projectUrl: b.project_url ?? '', localFolderPath: b.local_folder_path ?? '', thumbnailUrl: b.thumbnail_url ?? '', printDays: b.print_days, printHours: b.print_hours, printMinutes: b.print_minutes, printSeconds: b.print_seconds, piecesPerPlate: b.pieces_per_plate, plateQuantity: b.plate_quantity, nozzleDiameter: b.nozzle_diameter, sizeX: b.size_x, sizeY: b.size_y, sizeZ: b.size_z, machineId: b.machine_id ?? '', saleMarkupPercent: b.markup_percent, manualFinalPrice: b.manual_final_price, filaments: details.filaments.map((item) => ({ filamentId: item.filament_id, weightUsedG: item.weight_used_g })), supplies: details.supplies.map((item) => ({ supplyId: item.supply_id, quantityUsed: item.quantity_used })), extraCosts: details.extraCosts.map((item) => ({ name: item.name, value: item.value })) })
        } else if (modelId) {
          const details = await projectHook.getProject(modelId); const m = details.model
          if (active) setForm((current) => ({ ...current, projectName: m.name, description: m.description ?? '', projectUrl: m.project_url ?? '', localFolderPath: m.local_folder_path ?? '', thumbnailUrl: m.thumbnail_url ?? '', printDays: m.print_days, printHours: m.print_hours, printMinutes: m.print_minutes, printSeconds: m.print_seconds, piecesPerPlate: m.pieces_per_plate, plateQuantity: m.plate_quantity, nozzleDiameter: m.nozzle_diameter, sizeX: m.size_x, sizeY: m.size_y, sizeZ: m.size_z, machineId: m.default_machine_id ?? '', filaments: modelFilamentsFromDetails(m, details.filaments).map((item) => ({ filamentId: item.filamentId, weightUsedG: item.weightG })), supplies: details.supplies.map((item) => ({ supplyId: item.supply_id, quantityUsed: item.quantity_used })), extraCosts: details.extraCosts.map((item) => ({ name: item.name, value: item.value })) }))
        }
      } catch (error) { showToast(getDatabaseErrorMessage(error, 'Nao foi possivel carregar os dados.'), 'error') } finally { if (active) setLoadingData(false) }
    }
    void load(); return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, modelId])

  const selectedMachine = machineHook.machines.find((item) => item.id === form.machineId)
  const activeMarkupPercent = form.saleMarkupPercent ?? settingHook.settings?.markup_percent ?? 0
  const baseCalculation = useMemo(() => calculateBudget({ printDays: form.printDays, printHours: form.printHours, printMinutes: form.printMinutes, printSeconds: form.printSeconds, piecesPerPlate: form.piecesPerPlate, plateQuantity: form.plateQuantity, filaments: form.filaments.map((item) => ({ filamentId: item.filamentId, weightUsedG: item.weightUsedG, pricePerGram: filamentHook.filaments.find((filament) => filament.id === item.filamentId)?.price_per_gram ?? 0 })), supplies: form.supplies.map((item) => ({ supplyId: item.supplyId, quantityUsed: item.quantityUsed, unitCost: supplyHook.supplies.find((supply) => supply.id === item.supplyId)?.unit_cost ?? 0 })), extraCosts: form.extraCosts, consumptionWatts: selectedMachine?.consumption_watts ?? 0, maintenancePerHour: selectedMachine?.maintenance_per_hour ?? 0, machineValue: selectedMachine?.machine_value ?? 0, estimatedLifeHours: selectedMachine?.estimated_life_hours ?? 0, energyPriceKwh: settingHook.settings?.energy_price_kwh ?? 0, failureMarginPercent: settingHook.settings?.failure_margin_percent ?? 0, markupPercent: activeMarkupPercent, taxesPercent: 0, cardFeePercent: 0, fixedAdsCost: 0 }), [form, filamentHook.filaments, supplyHook.supplies, selectedMachine, settingHook.settings, activeMarkupPercent])
  const automaticFinalPrice = baseCalculation.totalProductionCost * (1 + activeMarkupPercent / 100)
  const manualFinalPrice = form.manualFinalPrice && form.manualFinalPrice > 0 ? form.manualFinalPrice : null
  const finalPrice = manualFinalPrice ?? automaticFinalPrice
  const calculation = useMemo(() => {
    const netProfit = finalPrice - baseCalculation.totalProductionCost
    return { ...baseCalculation, grossProfit: netProfit, priceBeforeFees: finalPrice, taxesValue: 0, cardFeeValue: 0, feesValue: 0, suggestedPrice: finalPrice, pricePerPiece: baseCalculation.totalPieces > 0 ? finalPrice / baseCalculation.totalPieces : 0, netProfit, netProfitPerPiece: baseCalculation.totalPieces > 0 ? netProfit / baseCalculation.totalPieces : 0 }
  }, [baseCalculation, finalPrice])

  const set = <K extends keyof BudgetFormData>(key: K, value: BudgetFormData[K]) => setForm((current) => ({ ...current, [key]: value }))
  const chooseClient = (id: string) => { const client = clientHook.clients.find((item) => item.id === id); if (!client) { set('clientId', null); return } setForm((current) => ({ ...current, clientId: client.id, clientName: client.name, clientPhone: client.phone ?? '', clientEmail: client.email ?? '', clientAddress: client.address ?? '', clientCity: client.city ?? '', clientState: client.state ?? '' })) }

  const validate = () => {
    if (!form.projectName.trim() || !form.machineId || form.filaments.length === 0 || form.filaments.some((item) => !item.filamentId || item.weightUsedG <= 0)) return 'Preencha projeto, maquina e todos os filamentos.'
    if (calculation.totalTimeHours <= 0 || calculation.totalPieces <= 0) return 'Informe tempo de impressao e quantidade de pecas validos.'
    if (form.supplies.some((item) => !item.supplyId || item.quantityUsed <= 0) || form.extraCosts.some((item) => !item.name.trim() || item.value < 0)) return 'Revise os insumos e custos extras.'
    return null
  }
  const save = async (withPdf = false) => { const validation = validate(); if (validation) { showToast(validation, 'error'); return } setSaving(true); try { const id = await budgetHook.saveBudget(form, calculation); showToast('Orcamento salvo com sucesso.', 'success'); if (withPdf) { await generateBudgetPdf(String(id)); showToast('PDF gerado com sucesso.', 'success') } else navigate('/app/orcamentos') } catch (error) { showToast(getDatabaseErrorMessage(error, error instanceof Error && error.message.includes('Estoque insuficiente') ? error.message : 'Erro ao salvar orcamento.'), 'error') } finally { setSaving(false) } }

  const baseLoading = filamentHook.loading || machineHook.loading || supplyHook.loading || settingHook.loading || clientHook.loading
  const baseError = filamentHook.error ?? machineHook.error ?? supplyHook.error ?? settingHook.error ?? clientHook.error
  if (baseLoading || loadingData) return <Card><DataLoading /></Card>
  if (baseError) return <Card><DataError message={getDatabaseErrorMessage(new Error(baseError), 'Erro ao carregar a calculadora.')} /></Card>
  if (!filamentHook.filaments.length || !machineHook.machines.length) return <Card title="Configure seu estoque primeiro" description="Para criar um orcamento preciso, cadastre pelo menos um filamento e uma impressora."><Button onClick={() => navigate('/app/insumos')}>Configurar Insumos / Custos</Button></Card>

  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3"><Summary label="Custo de producao" value={calculation.totalProductionCost} /><Summary label="Valor final" value={calculation.suggestedPrice} primary /><Summary label="Lucro liquido" value={calculation.netProfit} success /></div>
    <Card title="Dados do cliente" description="Selecione um cliente ou preencha os dados manualmente."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Select label="Cliente cadastrado" value={form.clientId ?? ''} onChange={(event) => chooseClient(event.target.value)}><option value="">Cliente manual</option>{clientHook.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select><Input label="Nome" value={form.clientName} onChange={(e) => set('clientName', e.target.value)} /><Input label="WhatsApp / telefone" value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} /><Input type="email" label="E-mail" value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} /><Input label="Endereco" value={form.clientAddress} onChange={(e) => set('clientAddress', e.target.value)} /><div className="grid grid-cols-[1fr_90px] gap-3"><Input label="Cidade" value={form.clientCity} onChange={(e) => set('clientCity', e.target.value)} /><Input label="UF" maxLength={2} value={form.clientState} onChange={(e) => set('clientState', e.target.value.toUpperCase())} /></div></div></Card>
    <Card title="Especificacoes da peca"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Input containerClassName="sm:col-span-2 lg:col-span-4" label="Nome do projeto *" value={form.projectName} onChange={(e) => set('projectName', e.target.value)} /><NumberInput label="Dias" value={form.printDays} onChange={(e) => set('printDays', parseNumberBR(e.target.value))} /><NumberInput label="Horas" value={form.printHours} onChange={(e) => set('printHours', parseNumberBR(e.target.value))} /><NumberInput label="Minutos" value={form.printMinutes} onChange={(e) => set('printMinutes', parseNumberBR(e.target.value))} /><NumberInput label="Segundos" value={form.printSeconds} onChange={(e) => set('printSeconds', parseNumberBR(e.target.value))} /><NumberInput label="Pecas por bandeja" min="1" value={form.piecesPerPlate} onChange={(e) => set('piecesPerPlate', parseNumberBR(e.target.value))} /><NumberInput label="Quantidade de bandejas" min="1" value={form.plateQuantity} onChange={(e) => set('plateQuantity', parseNumberBR(e.target.value))} /><NumberInput label="Diametro do bico (mm)" value={form.nozzleDiameter ?? ''} onChange={(e) => set('nozzleDiameter', optionalNumber(e.target.value))} /><div /><NumberInput label="Medida X (mm)" value={form.sizeX ?? ''} onChange={(e) => set('sizeX', optionalNumber(e.target.value))} /><NumberInput label="Medida Y (mm)" value={form.sizeY ?? ''} onChange={(e) => set('sizeY', optionalNumber(e.target.value))} /><NumberInput label="Medida Z (mm)" value={form.sizeZ ?? ''} onChange={(e) => set('sizeZ', optionalNumber(e.target.value))} /><div /><Textarea containerClassName="sm:col-span-2 lg:col-span-4" label="Descricao / observacoes" value={form.description} onChange={(e) => set('description', e.target.value)} /><Input containerClassName="sm:col-span-2" type="url" label="URL do projeto" value={form.projectUrl} onChange={(e) => set('projectUrl', e.target.value)} /><Input containerClassName="sm:col-span-2" label="Caminho da pasta local" value={form.localFolderPath} onChange={(e) => set('localFolderPath', e.target.value)} /><Input containerClassName="sm:col-span-2 lg:col-span-4" type="url" label="URL da imagem / miniatura" value={form.thumbnailUrl} onChange={(e) => set('thumbnailUrl', e.target.value)} /></div></Card>
    <Card title="Selecao de estoque"><Select label="Impressora principal *" value={form.machineId} onChange={(e) => set('machineId', e.target.value)}><option value="">Selecione</option>{machineHook.machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.model}</option>)}</Select><DynamicRows title="Filamentos" addLabel="Adicionar filamento" onAdd={() => set('filaments', [...form.filaments, { filamentId: '', weightUsedG: 0 }])}>{form.filaments.map((row, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"><Select value={row.filamentId} onChange={(e) => set('filaments', replaceAt(form.filaments, index, { ...row, filamentId: e.target.value }))}><option value="">Selecione o filamento</option>{filamentHook.filaments.map((filament) => <option key={filament.id} value={filament.id}>{filament.type_brand} - {filament.color} ({filament.stock_real_g - filament.stock_reserved_g} g livres)</option>)}</Select><NumberInput placeholder="Peso usado (g)" value={row.weightUsedG || ''} onChange={(e) => set('filaments', replaceAt(form.filaments, index, { ...row, weightUsedG: parseNumberBR(e.target.value) }))} /><RemoveButton disabled={form.filaments.length === 1} onClick={() => set('filaments', form.filaments.filter((_, itemIndex) => itemIndex !== index))} /></div>)}</DynamicRows><DynamicRows title="Insumos e embalagens" addLabel="Adicionar insumo" onAdd={() => set('supplies', [...form.supplies, { supplyId: '', quantityUsed: 0 }])}>{form.supplies.map((row, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"><Select value={row.supplyId} onChange={(e) => set('supplies', replaceAt(form.supplies, index, { ...row, supplyId: e.target.value }))}><option value="">Selecione o insumo</option>{supplyHook.supplies.map((supply) => <option key={supply.id} value={supply.id}>{supply.name} ({supply.stock_quantity} {supply.unit})</option>)}</Select><NumberInput placeholder="Quantidade" value={row.quantityUsed || ''} onChange={(e) => set('supplies', replaceAt(form.supplies, index, { ...row, quantityUsed: parseNumberBR(e.target.value) }))} /><RemoveButton onClick={() => set('supplies', form.supplies.filter((_, itemIndex) => itemIndex !== index))} /></div>)}</DynamicRows><DynamicRows title="Custos extras" addLabel="Adicionar custo" onAdd={() => set('extraCosts', [...form.extraCosts, { name: '', value: 0 }])}>{form.extraCosts.map((row, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"><Input placeholder="Descricao do custo" value={row.name} onChange={(e) => set('extraCosts', replaceAt(form.extraCosts, index, { ...row, name: e.target.value }))} /><MoneyInput value={row.value || ''} onChange={(e) => set('extraCosts', replaceAt(form.extraCosts, index, { ...row, value: parseNumberBR(e.target.value) }))} /><RemoveButton onClick={() => set('extraCosts', form.extraCosts.filter((_, itemIndex) => itemIndex !== index))} /></div>)}</DynamicRows></Card>
    <Card title="Preco do orcamento" description="Ajuste o lucro aplicado ou defina um valor final manual para este orcamento."><div className="grid gap-4 lg:grid-cols-2"><div><NumberInput label="Lucro / Markup de venda (%)" min="0" value={activeMarkupPercent} onChange={(event) => set('saleMarkupPercent', parseNumberBR(event.target.value))} /><div className="mt-2 flex flex-wrap gap-2">{[50, 80, 100, 120, 150].map((value) => <Button key={value} type="button" variant={activeMarkupPercent === value ? 'primary' : 'outline'} className="min-h-9 px-3 text-xs" onClick={() => set('saleMarkupPercent', value)}>{value}%</Button>)}</div></div><MoneyInput label="Valor final manual do orcamento" value={form.manualFinalPrice ?? ''} onChange={(event) => set('manualFinalPrice', optionalNumber(event.target.value))} /></div>{manualFinalPrice && <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">Valor final ajustado manualmente. Este valor prevalece sobre o preco sugerido automatico.</div>}</Card>
    <div className="grid gap-6 lg:grid-cols-2"><Card title="Detalhamento de custos"><CostRows rows={[['Materiais / filamentos', calculation.filamentCost], ['Consumo de energia', calculation.energyCost], ['Manutencao variavel', calculation.maintenanceCost], ['Depreciacao', calculation.depreciationCost], ['Servico de impressao', calculation.serviceCost], ['Insumos e embalagens', calculation.suppliesCost], ['Custos extras', calculation.extraCosts], ['Margem de falha', calculation.failureMarginValue], ['Custo total de producao', calculation.totalProductionCost], ['Markup aplicado (%)', activeMarkupPercent], ['Preco sugerido automatico', automaticFinalPrice], ['Valor final do orcamento', calculation.suggestedPrice], ['Custo por unidade', calculation.costPerPiece]]} /></Card><Card title="Formacao de preco"><CostRows rows={[['Valor final do lote', calculation.suggestedPrice], ['Valor por peca', calculation.pricePerPiece], ['Lucro estimado', calculation.netProfit], ['Lucro por peca', calculation.netProfitPerPiece]]} highlight /></Card></div>
    <div className="flex flex-col justify-end gap-3 sm:flex-row"><Button variant="outline" loading={saving} onClick={() => void save(true)}><FileDown size={18} />Gerar PDF</Button><Button loading={saving} onClick={() => void save(false)}><Save size={18} />{form.id ? 'Atualizar orcamento' : 'Salvar orcamento'}</Button></div>
  </div>
}

function Summary({ label, value, primary, success }: { label: string; value: number; primary?: boolean; success?: boolean }) { return <Card className="p-5"><p className="text-sm font-medium text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${primary ? 'text-primary' : success ? 'text-success' : 'text-slate-950'}`}>{formatCurrency(value)}</p></Card> }
function DynamicRows({ title, addLabel, onAdd, children }: { title: string; addLabel: string; onAdd: () => void; children: React.ReactNode }) { return <div className="mt-6 border-t border-border pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">{title}</h3><Button variant="ghost" className="min-h-9 px-3 text-primary" onClick={onAdd}><Plus size={16} />{addLabel}</Button></div><div className="space-y-3">{children}</div></div> }
function RemoveButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) { return <Button variant="ghost" className="min-h-11 px-3 text-danger hover:bg-red-50" onClick={onClick} disabled={disabled} aria-label="Remover item"><Trash2 size={18} /></Button> }
function CostRows({ rows, highlight = false }: { rows: Array<[string, number]>; highlight?: boolean }) { return <div className="divide-y divide-border">{rows.map(([label, value], index) => <div className={`flex items-center justify-between gap-4 py-3 ${highlight && index === 0 ? 'text-primary' : ''}`} key={label}><span className="text-sm text-slate-600">{label}</span><strong>{label.includes('(%)') ? `${value.toLocaleString('pt-BR')}%` : formatCurrency(value)}</strong></div>)}</div> }
function replaceAt<T>(items: T[], index: number, value: T) { return items.map((item, itemIndex) => itemIndex === index ? value : item) }
function optionalNumber(value: string) { return value === '' ? null : parseNumberBR(value) }
