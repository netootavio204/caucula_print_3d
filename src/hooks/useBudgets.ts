import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { BudgetCalculationResult, BudgetFormData } from '../types/budget'
import type { BudgetExtraCostRow, BudgetFilamentRow, BudgetRow, BudgetSupplyRow, Json } from '../types/database'
import { useAuth } from './useAuth'

export interface BudgetDetails {
  budget: BudgetRow
  filaments: BudgetFilamentRow[]
  supplies: BudgetSupplyRow[]
  extraCosts: BudgetExtraCostRow[]
}

export function useBudgets() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<BudgetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weightByBudget, setWeightByBudget] = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    await supabase.rpc('expire_pending_budgets', {})
    const [budgetResult, itemResult] = await Promise.all([supabase.from('budgets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }), supabase.from('budget_filaments').select('budget_id,weight_used_g').eq('user_id', user.id)])
    const queryError = budgetResult.error ?? itemResult.error
    if (queryError) setError(queryError.message); else { setBudgets(budgetResult.data ?? []); setWeightByBudget((itemResult.data ?? []).reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.budget_id]: (acc[item.budget_id] ?? 0) + item.weight_used_g }), {})); setError(null) }
    setLoading(false)
  }, [user])
  useEffect(() => { void load() }, [load])

  const getBudget = async (id: string): Promise<BudgetDetails> => {
    const [budgetResult, filamentResult, supplyResult, extraResult] = await Promise.all([
      supabase.from('budgets').select('*').eq('id', id).eq('user_id', user!.id).single(),
      supabase.from('budget_filaments').select('*').eq('budget_id', id),
      supabase.from('budget_supplies').select('*').eq('budget_id', id),
      supabase.from('budget_extra_costs').select('*').eq('budget_id', id),
    ])
    const queryError = budgetResult.error ?? filamentResult.error ?? supplyResult.error ?? extraResult.error
    if (queryError) throw new Error(queryError.message)
    if (!budgetResult.data) throw new Error('Orçamento não encontrado.')
    return { budget: budgetResult.data, filaments: filamentResult.data ?? [], supplies: supplyResult.data ?? [], extraCosts: extraResult.data ?? [] }
  }

  const saveBudget = async (form: BudgetFormData, calculation: BudgetCalculationResult) => {
    const payload = {
      client_id: form.clientId, client_name: form.clientName, client_phone: form.clientPhone, client_email: form.clientEmail,
      client_address: form.clientAddress, client_city: form.clientCity, client_state: form.clientState,
      project_name: form.projectName, description: form.description, project_url: form.projectUrl,
      local_folder_path: form.localFolderPath, thumbnail_url: form.thumbnailUrl,
      print_days: form.printDays, print_hours: form.printHours, print_minutes: form.printMinutes, print_seconds: form.printSeconds,
      total_time_hours: calculation.totalTimeHours, pieces_per_plate: form.piecesPerPlate, plate_quantity: form.plateQuantity,
      total_pieces: calculation.totalPieces, nozzle_diameter: form.nozzleDiameter, size_x: form.sizeX, size_y: form.sizeY, size_z: form.sizeZ,
      machine_id: form.machineId, filament_cost: calculation.filamentCost, service_cost: calculation.serviceCost,
      energy_cost: calculation.energyCost, maintenance_cost: calculation.maintenanceCost, depreciation_cost: calculation.depreciationCost,
      supplies_cost: calculation.suppliesCost, extra_costs: calculation.extraCosts, failure_margin_value: calculation.failureMarginValue,
      total_production_cost: calculation.totalProductionCost, gross_profit: calculation.grossProfit, fees_value: calculation.feesValue,
      markup_percent: form.saleMarkupPercent, manual_final_price: form.manualFinalPrice, final_price: calculation.suggestedPrice,
      suggested_price: calculation.suggestedPrice, price_per_piece: calculation.pricePerPiece,
      net_profit: calculation.netProfit, net_profit_per_piece: calculation.netProfitPerPiece,
    }
    const { data, error: mutationError } = await supabase.rpc('save_budget', {
      p_budget: payload as Json,
      p_filaments: form.filaments.map((item) => ({ filament_id: item.filamentId, weight_used_g: item.weightUsedG })) as Json,
      p_supplies: form.supplies.map((item) => ({ supply_id: item.supplyId, quantity_used: item.quantityUsed })) as Json,
      p_extra_costs: form.extraCosts as unknown as Json,
      p_budget_id: form.id ?? null,
    })
    if (mutationError) throw new Error(mutationError.message)
    await saveBudgetPricingFields(data, form, calculation)
    await load()
    return data
  }

  const runAction = async (name: 'approve_budget' | 'reject_budget' | 'finalize_budget_stock' | 'delete_budget_safely', id: string) => {
    const { error: mutationError } = await supabase.rpc(name, { p_budget_id: id })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }

  return { budgets, weightByBudget, loading, error, reload: load, getBudget, saveBudget, approveBudget: (id: string) => runAction('approve_budget', id), rejectBudget: (id: string) => runAction('reject_budget', id), finalizeStock: (id: string) => runAction('finalize_budget_stock', id), deleteBudget: (id: string) => runAction('delete_budget_safely', id) }
}

async function saveBudgetPricingFields(budgetId: string | null, form: BudgetFormData, calculation: BudgetCalculationResult) {
  if (!budgetId) return
  const { error } = await supabase.from('budgets').update({
    markup_percent: form.saleMarkupPercent ?? null,
    manual_final_price: form.manualFinalPrice ?? null,
    final_price: calculation.suggestedPrice,
  }).eq('id', budgetId)
  if (!error) return
  const message = error.message.toLowerCase()
  if (message.includes('schema cache') || message.includes('markup_percent') || message.includes('manual_final_price') || message.includes('final_price')) {
    console.info('[budgets.saveBudget] optional pricing fields unavailable; apply budget pricing migration', { code: error.code, message: error.message })
    return
  }
  throw new Error(error.message)
}
