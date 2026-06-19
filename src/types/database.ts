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
  company_logo_path: string | null
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
  client_type: 'cliente' | 'consignatario' | 'ambos'
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
  internal_code: string | null
  public_code: string | null
  category: string | null
  public_name: string | null
  public_description: string | null
  catalog_image_1_url: string | null
  catalog_image_1_path: string | null
  catalog_image_2_url: string | null
  catalog_image_2_path: string | null
  is_catalog_visible: boolean
  direct_sale_price: number
  consignment_price: number
  quantity_internal: number
  quantity_consigned: number
  quantity_sold: number
  status: 'disponivel' | 'em_consignacao' | 'vendido' | 'esgotado' | 'oculto'
  created_at: string
  updated_at: string
}

export type ReadyStockMovementRow = {
  id: string
  user_id: string
  ready_stock_id: string
  movement_type: 'entrada_manual' | 'entrada_orcamento' | 'saida_venda' | 'saida_consignacao' | 'devolucao_consignacao' | 'ajuste_manual' | 'cancelamento_venda'
  quantity: number
  description: string | null
  sale_id: string | null
  consignment_id: string | null
  budget_id: string | null
  created_at: string
}

export type SaleRow = {
  id: string
  user_id: string
  client_id: string | null
  budget_id: string | null
  sale_type: 'venda_direta' | 'venda_orcamento'
  sale_code: string | null
  total_value: number
  paid_value: number
  open_value: number
  payment_status: 'pago' | 'nao_pago' | 'parcialmente_pago' | 'cancelado'
  delivery_status: 'pendente' | 'entregue' | 'retirado' | 'enviado' | 'cancelado'
  payment_method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'outro' | null
  sale_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type SaleItemRow = {
  id: string
  user_id: string
  sale_id: string
  ready_stock_id: string | null
  product_code: string | null
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export type ConsignmentRow = {
  id: string
  user_id: string
  consignee_client_id: string | null
  consignment_code: string | null
  sent_date: string
  expected_settlement_date: string | null
  status: 'em_consignacao' | 'parcialmente_vendido' | 'vendido_nao_pago' | 'vendido_pago' | 'parcialmente_pago' | 'finalizado' | 'cancelado'
  total_consigned_value: number
  total_sold_value: number
  total_paid_value: number
  total_open_value: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type ConsignmentItemRow = {
  id: string
  user_id: string
  consignment_id: string
  ready_stock_id: string | null
  product_code: string | null
  product_name: string
  quantity_sent: number
  quantity_sold: number
  quantity_returned: number
  quantity_remaining: number
  consignment_unit_price: number
  total_consigned_value: number
  sold_value: number
  paid_value: number
  open_value: number
  status: 'em_consignacao' | 'vendido_nao_pago' | 'vendido_pago' | 'parcialmente_pago' | 'devolvido' | 'finalizado'
  created_at: string
  updated_at: string
}

export type ConsignmentPaymentRow = {
  id: string
  user_id: string
  consignment_id: string
  consignment_item_id: string | null
  amount: number
  payment_method: SaleRow['payment_method']
  payment_date: string
  notes: string | null
  created_at: string
}

export type PublicCatalogRow = Pick<
  ReadyStockRow,
  | 'id'
  | 'user_id'
  | 'public_code'
  | 'public_name'
  | 'public_description'
  | 'category'
  | 'catalog_image_1_url'
  | 'catalog_image_2_url'
  | 'is_catalog_visible'
  | 'created_at'
>

export type PublicCompanyRow = {
  user_id: string
  company_name: string | null
  company_phone: string | null
  company_logo_url: string | null
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
      ready_stock_movements: TableDefinition<ReadyStockMovementRow, InsertRow<ReadyStockMovementRow, 'user_id' | 'ready_stock_id' | 'movement_type' | 'quantity'>>
      sales: TableDefinition<SaleRow, InsertRow<SaleRow, 'user_id'>>
      sale_items: TableDefinition<SaleItemRow, InsertRow<SaleItemRow, 'user_id' | 'sale_id' | 'product_name'>>
      consignments: TableDefinition<ConsignmentRow, InsertRow<ConsignmentRow, 'user_id'>>
      consignment_items: TableDefinition<ConsignmentItemRow, InsertRow<ConsignmentItemRow, 'user_id' | 'consignment_id' | 'product_name'>>
      consignment_payments: TableDefinition<ConsignmentPaymentRow, InsertRow<ConsignmentPaymentRow, 'user_id' | 'consignment_id'>>
      project_model_supplies: TableDefinition<ProjectModelSupplyRow, InsertRow<ProjectModelSupplyRow, 'user_id' | 'project_model_id' | 'supply_id' | 'quantity_used'>>
      project_model_extra_costs: TableDefinition<ProjectModelExtraCostRow, InsertRow<ProjectModelExtraCostRow, 'user_id' | 'project_model_id' | 'name' | 'value'>>
    }
    Views: {
      public_catalog_view: {
        Row: PublicCatalogRow
        Relationships: []
      }
      public_company_view: {
        Row: PublicCompanyRow
        Relationships: []
      }
    }
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
      create_sale: { Args: { p_sale: Json; p_item: Json }; Returns: string }
      update_sale_details: { Args: { p_sale_id: string; p_sale: Json }; Returns: undefined }
      register_sale_payment: { Args: { p_sale_id: string; p_amount: number }; Returns: undefined }
      cancel_sale: { Args: { p_sale_id: string }; Returns: undefined }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
