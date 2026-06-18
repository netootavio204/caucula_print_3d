FASE 2 — Supabase, banco de dados, autenticação e segurança
Comando para o Codex
Leia novamente PRD.md e CODEX_SKILL_AGENT.md antes de iniciar.

Nesta fase, implemente toda a integração com Supabase.

Crie:

1. Arquivo de configuração do Supabase:
   - src/lib/supabase.ts

2. Variáveis de ambiente:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

3. Tipos principais do banco:
   - src/types/database.ts

4. Migrations SQL para criar todas as tabelas:
   - profiles
   - filaments
   - filament_movements
   - machines
   - supplies
   - global_settings
   - clients
   - project_models
   - budgets
   - budget_filaments
   - budget_supplies
   - budget_extra_costs
   - ready_stock

5. Ativar RLS em todas as tabelas.

6. Criar policies para cada usuário acessar apenas seus próprios dados.

7. Criar trigger ou função para gerar profile automaticamente ao cadastrar usuário.

8. Implementar autenticação real:
   - Cadastro
   - Login
   - Logout
   - Recuperação de senha
   - Sessão persistente
   - Proteção de rotas

9. Criar hook:
   - useAuth.ts

10. Criar redirecionamentos:
   - Usuário logado não deve ficar em /login ou /cadastro.
   - Usuário não logado deve ser enviado para /login.
   - Após login, ir para /app/orcamento.
   - Após logout, ir para /login.

Regras obrigatórias:

- Não criar backend próprio.
- Não salvar autenticação manual em localStorage.
- Não permitir acesso sem sessão.
- Não permitir que um usuário veja dados de outro.
- Não deixar tabela sem RLS.
- Não deixar policy genérica liberando tudo.
- Não implementar plano pago.
- Não implementar trial.
- Não implementar premium.

No final, entregue também o SQL completo das migrations criadas.
Rode build e corrija erros.
SQL mínimo obrigatório para o banco

O Codex deve criar uma migration baseada neste modelo:

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  company_name text,
  company_phone text,
  company_email text,
  company_instagram text,
  company_address text,
  company_city text,
  company_state text,
  company_logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists filaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type_brand text not null,
  color text not null,
  weight_kg numeric not null check (weight_kg > 0),
  price_paid numeric not null check (price_paid >= 0),
  price_per_gram numeric not null default 0,
  supplier_image_url text,
  stock_real_g numeric not null default 0,
  stock_reserved_g numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists filament_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  filament_id uuid references filaments(id) on delete cascade not null,
  movement_type text not null,
  quantity_g numeric not null,
  description text,
  budget_id uuid,
  created_at timestamptz default now()
);

create table if not exists machines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  model text not null,
  consumption_watts numeric not null default 0,
  maintenance_per_hour numeric not null default 0,
  machine_value numeric not null default 0,
  estimated_life_hours numeric not null default 10000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists supplies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  total_price numeric not null default 0,
  quantity_purchased numeric not null default 0,
  unit text not null,
  unit_cost numeric not null default 0,
  stock_quantity numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists global_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  energy_price_kwh numeric default 0,
  failure_margin_percent numeric default 5,
  markup_percent numeric default 30,
  taxes_percent numeric default 0,
  card_fee_percent numeric default 0,
  fixed_ads_cost numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  document text,
  phone text,
  email text,
  instagram text,
  address text,
  city text,
  state text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists project_models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  local_folder_path text,
  project_url text,
  thumbnail_url text,
  print_days numeric default 0,
  print_hours numeric default 0,
  print_minutes numeric default 0,
  print_seconds numeric default 0,
  pieces_per_plate numeric default 1,
  plate_quantity numeric default 1,
  nozzle_diameter numeric,
  size_x numeric,
  size_y numeric,
  size_z numeric,
  default_machine_id uuid references machines(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id),
  client_name text,
  client_phone text,
  client_email text,
  client_address text,
  client_city text,
  client_state text,
  project_name text not null,
  description text,
  print_days numeric default 0,
  print_hours numeric default 0,
  print_minutes numeric default 0,
  print_seconds numeric default 0,
  total_time_hours numeric default 0,
  pieces_per_plate numeric default 1,
  plate_quantity numeric default 1,
  total_pieces numeric default 1,
  nozzle_diameter numeric,
  size_x numeric,
  size_y numeric,
  size_z numeric,
  machine_id uuid references machines(id),
  filament_cost numeric default 0,
  service_cost numeric default 0,
  energy_cost numeric default 0,
  maintenance_cost numeric default 0,
  depreciation_cost numeric default 0,
  supplies_cost numeric default 0,
  extra_costs numeric default 0,
  failure_margin_value numeric default 0,
  total_production_cost numeric default 0,
  gross_profit numeric default 0,
  fees_value numeric default 0,
  suggested_price numeric default 0,
  price_per_piece numeric default 0,
  net_profit numeric default 0,
  net_profit_per_piece numeric default 0,
  status text default 'pendente',
  validity_days numeric default 7,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists budget_filaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  budget_id uuid references budgets(id) on delete cascade not null,
  filament_id uuid references filaments(id) not null,
  weight_used_g numeric not null,
  cost numeric not null,
  created_at timestamptz default now()
);

create table if not exists budget_supplies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  budget_id uuid references budgets(id) on delete cascade not null,
  supply_id uuid references supplies(id) not null,
  quantity_used numeric not null,
  cost numeric not null,
  created_at timestamptz default now()
);

create table if not exists budget_extra_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  budget_id uuid references budgets(id) on delete cascade not null,
  name text not null,
  value numeric not null,
  created_at timestamptz default now()
);

create table if not exists ready_stock (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_model_id uuid references project_models(id),
  name text not null,
  quantity numeric not null default 0,
  unit_cost numeric default 0,
  sale_price numeric default 0,
  image_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

Depois disso, o Codex deve completar:

alter table profiles enable row level security;
alter table filaments enable row level security;
alter table filament_movements enable row level security;
alter table machines enable row level security;
alter table supplies enable row level security;
alter table global_settings enable row level security;
alter table clients enable row level security;
alter table project_models enable row level security;
alter table budgets enable row level security;
alter table budget_filaments enable row level security;
alter table budget_supplies enable row level security;
alter table budget_extra_costs enable row level security;
alter table ready_stock enable row level security;

E criar policies para todas as tabelas.

Resultado esperado da Fase 2

Ao final desta fase:

Cadastro funciona;
Login funciona;
Logout funciona;
Recuperação de senha funciona;
Usuário entra no painel;
Supabase conectado;
Banco criado;
RLS ativado;
Dados protegidos por usuário.
