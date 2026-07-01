export interface BudgetFilamentCalculationInput { filamentId: string; weightUsedG: number; pricePerGram: number }
export interface BudgetSupplyCalculationInput { supplyId: string; quantityUsed: number; unitCost: number }
export interface BudgetExtraCostInput { name: string; value: number }

export interface BudgetCalculationInput {
  printDays: number
  printHours: number
  printMinutes: number
  printSeconds: number
  piecesPerPlate: number
  plateQuantity: number
  filaments: BudgetFilamentCalculationInput[]
  supplies: BudgetSupplyCalculationInput[]
  extraCosts: BudgetExtraCostInput[]
  consumptionWatts: number
  maintenancePerHour: number
  machineValue: number
  estimatedLifeHours: number
  energyPriceKwh: number
  failureMarginPercent: number
  markupPercent: number
  taxesPercent: number
  cardFeePercent: number
  fixedAdsCost: number
}

export interface BudgetCalculationResult {
  totalTimeHours: number
  totalPieces: number
  filamentCost: number
  energyCost: number
  maintenanceCost: number
  depreciationCost: number
  serviceCost: number
  suppliesCost: number
  extraCosts: number
  baseCostWithoutFailure: number
  failureMarginValue: number
  totalProductionCost: number
  grossProfit: number
  priceBeforeFees: number
  taxesValue: number
  cardFeeValue: number
  feesValue: number
  suggestedPrice: number
  costPerPiece: number
  pricePerPiece: number
  netProfit: number
  netProfitPerPiece: number
}

export interface BudgetFormData {
  id?: string
  clientId: string | null
  clientName: string
  clientPhone: string
  clientEmail: string
  clientAddress: string
  clientCity: string
  clientState: string
  projectName: string
  description: string
  projectUrl: string
  localFolderPath: string
  thumbnailUrl: string
  printDays: number
  printHours: number
  printMinutes: number
  printSeconds: number
  piecesPerPlate: number
  plateQuantity: number
  nozzleDiameter: number | null
  sizeX: number | null
  sizeY: number | null
  sizeZ: number | null
  machineId: string
  saleMarkupPercent?: number | null
  manualFinalPrice?: number | null
  filaments: Array<{ filamentId: string; weightUsedG: number }>
  supplies: Array<{ supplyId: string; quantityUsed: number }>
  extraCosts: BudgetExtraCostInput[]
}
