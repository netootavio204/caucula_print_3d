export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type InsertRow<Row, RequiredKeys extends keyof Row> = Pick<Row, RequiredKeys> & Partial<Omit<Row, RequiredKeys>>
type TableDefinition<Row, Insert, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type ProfileRow = {
  id: string
  full_name: string
  email: string
  company_name: string | null
  company_phone: string | null
  company_email: string | null
  company_instagram: string | null
  company_address: string | null
  company_city: string | null
  company_state: string | null
  company_logo_url: string | null
  created_at: string
  updated_at: string
}

export type FilamentRow = {
  id: string
  user_id: string
  type_brand: string
  color: string
  weight_kg: number
  price_paid: number
  price_per_gram: number
  supplier_image_url: string | null
  stock_real_g: number
  stock_reserved_g: number
  created_at: string
  updated_at: string
}

export type FilamentMovementRow = {
  id: string
  user_id: string
  filament_id: string
  movement_type: 'entrada' | 'saida' | 'reserva' | 'cancelamento_reserva' | 'baixa_definitiva' | 'ajuste_manual'
  quantity_g: number
  description: string | null
  budget_id: string | null
  created_at: string
}

export type MachineRow = {
  id: string
  user_id: string
  model: string
  consumption_watts: number
  maintenance_per_hour: number
  machine_value: number
  estimated_life_hours: number
  created_at: string
  updated_at: string
}

export type SupplyRow = {
  id: string
  user_id: string
  name: string
  total_price: number
  quantity_purchased: number
  unit: 'unidades' | 'metros' | 'gramas' | 'kg' | 'pacote' | 'litros' | 'ml'
  unit_cost: number
  stock_quantity: number
  created_at: string
  updated_at: string
}

export type GlobalSettingsRow = {
  id: string
  user_id: string
  energy_price_kwh: number
  failure_margin_percent: number
  markup_percent: number
  taxes_percent: number
  card_fee_percent: number
  fixed_ads_cost: number
  created_at: string
  updated_at: string
}

export type ClientRow = {
  id: string
  user_id: string
  name: string
  document: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  address: string | null
  city: string | null
  state: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ProjectModelRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  local_folder_path: string | null
  project_url: string | null
  thumbnail_url: string | null
  print_days: number
  print_hours: number
  print_minutes: number
  print_seconds: number
  pieces_per_plate: number
  plate_quantity: number
  nozzle_diameter: number | null
  size_x: number | null
  size_y: number | null
  size_z: number | null
  default_machine_id: string | null
  default_filament_id: string | null
  default_filament_weight_g: number | null
  created_at: string
  updated_at: string
}

export type BudgetRow = {
  id: string
  user_id: string
  client_id: string | null
  client_name: string | null
  client_phone: string | null
  client_email: string | null
  client_address: string | null
  client_city: string | null
  client_state: string | null
  project_name: string
  description: string | null
  project_url: string | null
  local_folder_path: string | null
  thumbnail_url: string | null
  print_days: number
  print_hours: number
  print_minutes: number
  print_seconds: number
  total_time_hours: number
  pieces_per_plate: number
  plate_quantity: number
  total_pieces: number
  nozzle_diameter: number | null
  size_x: number | null
  size_y: number | null
  size_z: number | null
  machine_id: string | null
  filament_cost: number
  service_cost: number
  energy_cost: number
  maintenance_cost: number
  depreciation_cost: number
  supplies_cost: number
  extra_costs: number
  failure_margin_value: number
  total_production_cost: number
  gross_profit: number
  fees_value: number
  suggested_price: number
  price_per_piece: number
  net_profit: number
  net_profit_per_piece: number
  status: 'pendente' | 'aprovado' | 'recusado' | 'expirado' | 'baixado_estoque'
  validity_days: number
  created_at: string
  updated_at: string
}

export type BudgetFilamentRow = {
  id: string
  user_id: string
  budget_id: string
  filament_id: string
  weight_used_g: number
  cost: number
  created_at: string
}

export type BudgetSupplyRow = {
  id: string
  user_id: string
  budget_id: string
  supply_id: string
  quantity_used: number
  cost: number
  created_at: string
}

export type BudgetExtraCostRow = {
  id: string
  user_id: string
  budget_id: string
  name: string
  value: number
  created_at: string
}

export type ReadyStockRow = {
  id: string
  user_id: string
  project_model_id: string | null
  name: string
  quantity: number
  unit_cost: number
  sale_price: number
  image_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ProjectModelSupplyRow = {
  id: string
  user_id: string
  project_model_id: string
  supply_id: string
  quantity_used: number
  created_at: string
}

export type ProjectModelExtraCostRow = {
  id: string
  user_id: string
  project_model_id: string
  name: string
  value: number
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDefinition<ProfileRow, InsertRow<ProfileRow, 'id' | 'full_name' | 'email'>>
      filaments: TableDefinition<FilamentRow, InsertRow<FilamentRow, 'user_id' | 'type_brand' | 'color' | 'weight_kg' | 'price_paid'>>
      filament_movements: TableDefinition<FilamentMovementRow, InsertRow<FilamentMovementRow, 'user_id' | 'filament_id' | 'movement_type' | 'quantity_g'>>
      machines: TableDefinition<MachineRow, InsertRow<MachineRow, 'user_id' | 'model'>>
      supplies: TableDefinition<SupplyRow, InsertRow<SupplyRow, 'user_id' | 'name' | 'quantity_purchased' | 'unit'>>
      global_settings: TableDefinition<GlobalSettingsRow, InsertRow<GlobalSettingsRow, 'user_id'>>
      clients: TableDefinition<ClientRow, InsertRow<ClientRow, 'user_id' | 'name'>>
      project_models: TableDefinition<ProjectModelRow, InsertRow<ProjectModelRow, 'user_id' | 'name'>>
      budgets: TableDefinition<BudgetRow, InsertRow<BudgetRow, 'user_id' | 'project_name'>>
      budget_filaments: TableDefinition<BudgetFilamentRow, InsertRow<BudgetFilamentRow, 'user_id' | 'budget_id' | 'filament_id' | 'weight_used_g' | 'cost'>>
      budget_supplies: TableDefinition<BudgetSupplyRow, InsertRow<BudgetSupplyRow, 'user_id' | 'budget_id' | 'supply_id' | 'quantity_used' | 'cost'>>
      budget_extra_costs: TableDefinition<BudgetExtraCostRow, InsertRow<BudgetExtraCostRow, 'user_id' | 'budget_id' | 'name' | 'value'>>
      ready_stock: TableDefinition<ReadyStockRow, InsertRow<ReadyStockRow, 'user_id' | 'name'>>
      project_model_supplies: TableDefinition<ProjectModelSupplyRow, InsertRow<ProjectModelSupplyRow, 'user_id' | 'project_model_id' | 'supply_id' | 'quantity_used'>>
      project_model_extra_costs: TableDefinition<ProjectModelExtraCostRow, InsertRow<ProjectModelExtraCostRow, 'user_id' | 'project_model_id' | 'name' | 'value'>>
    }
    Views: Record<string, never>
    Functions: {
      create_filament_with_entry: {
        Args: { p_type_brand: string; p_color: string; p_weight_kg: number; p_price_paid: number; p_supplier_image_url?: string | null }
        Returns: FilamentRow
      }
      update_filament_with_adjustment: {
        Args: { p_id: string; p_type_brand: string; p_color: string; p_weight_kg: number; p_price_paid: number; p_supplier_image_url?: string | null }
        Returns: FilamentRow
      }
      save_budget: {
        Args: { p_budget: Json; p_filaments: Json; p_supplies: Json; p_extra_costs: Json; p_budget_id?: string | null }
        Returns: string
      }
      approve_budget: { Args: { p_budget_id: string }; Returns: undefined }
      reject_budget: { Args: { p_budget_id: string }; Returns: undefined }
      finalize_budget_stock: { Args: { p_budget_id: string }; Returns: undefined }
      delete_budget_safely: { Args: { p_budget_id: string }; Returns: undefined }
      expire_pending_budgets: { Args: Record<string, never>; Returns: number }
      save_project_model: {
        Args: { p_model: Json; p_supplies: Json; p_extra_costs: Json; p_model_id?: string | null }
        Returns: string
      }
      save_ready_stock: {
        Args: { p_stock: Json; p_stock_id?: string | null; p_deduct_materials?: boolean }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
