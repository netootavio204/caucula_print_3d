import type { BudgetCalculationInput, BudgetCalculationResult } from '../types/budget'

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0
}

export function calculateBudget(input: BudgetCalculationInput): BudgetCalculationResult {
  const totalTimeHours = finiteNonNegative(input.printDays) * 24 + finiteNonNegative(input.printHours) + finiteNonNegative(input.printMinutes) / 60 + finiteNonNegative(input.printSeconds) / 3600
  const totalPieces = finiteNonNegative(input.piecesPerPlate) * finiteNonNegative(input.plateQuantity)
  const filamentCost = input.filaments.reduce((sum, item) => sum + finiteNonNegative(item.weightUsedG) * finiteNonNegative(item.pricePerGram), 0)
  const energyCost = (finiteNonNegative(input.consumptionWatts) / 1000) * totalTimeHours * finiteNonNegative(input.energyPriceKwh)
  const maintenanceCost = finiteNonNegative(input.maintenancePerHour) * totalTimeHours
  const depreciationCost = input.estimatedLifeHours > 0 ? (finiteNonNegative(input.machineValue) / input.estimatedLifeHours) * totalTimeHours : 0
  const serviceCost = energyCost + maintenanceCost + depreciationCost
  const suppliesCost = input.supplies.reduce((sum, item) => sum + finiteNonNegative(item.quantityUsed) * finiteNonNegative(item.unitCost), 0)
  const extraCosts = input.extraCosts.reduce((sum, item) => sum + finiteNonNegative(item.value), 0)
  const baseCostWithoutFailure = filamentCost + serviceCost + suppliesCost + extraCosts
  const failureMarginValue = baseCostWithoutFailure * (finiteNonNegative(input.failureMarginPercent) / 100)
  const totalProductionCost = baseCostWithoutFailure + failureMarginValue
  const grossProfit = totalProductionCost * (finiteNonNegative(input.markupPercent) / 100)
  const priceBeforeFees = totalProductionCost + grossProfit
  const taxesValue = priceBeforeFees * (finiteNonNegative(input.taxesPercent) / 100)
  const cardFeeValue = priceBeforeFees * (finiteNonNegative(input.cardFeePercent) / 100)
  const feesValue = taxesValue + cardFeeValue + finiteNonNegative(input.fixedAdsCost)
  const suggestedPrice = priceBeforeFees + feesValue
  const netProfit = suggestedPrice - totalProductionCost - feesValue
  const costPerPiece = totalPieces > 0 ? totalProductionCost / totalPieces : 0
  const pricePerPiece = totalPieces > 0 ? suggestedPrice / totalPieces : 0
  const netProfitPerPiece = totalPieces > 0 ? netProfit / totalPieces : 0

  return { totalTimeHours, totalPieces, filamentCost, energyCost, maintenanceCost, depreciationCost, serviceCost, suppliesCost, extraCosts, baseCostWithoutFailure, failureMarginValue, totalProductionCost, grossProfit, priceBeforeFees, taxesValue, cardFeeValue, feesValue, suggestedPrice, costPerPiece, pricePerPiece, netProfit, netProfitPerPiece }
}
