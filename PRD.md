# PRD — WebApp de Precificação para Impressão 3D

## 1. Nome do Produto

**CalculaPrint 3D**

### Subtítulo

**Calculadora Profissional para Orçamentos de Impressão 3D**

---

## 2. Objetivo do Projeto

Criar um webapp moderno, responsivo e profissional para calcular preços de serviços de impressão 3D.

O sistema deverá permitir que o usuário cadastre seus custos reais, controle filamentos, máquinas, insumos, clientes, projetos, estoque de peças prontas e orçamentos.

A calculadora deverá gerar automaticamente:

* Custo de filamento;
* Custo de energia;
* Custo de manutenção;
* Depreciação da impressora;
* Custo de insumos e embalagens;
* Custos extras;
* Margem de falha;
* Markup;
* Impostos e taxas;
* Preço sugerido;
* Lucro bruto;
* Lucro líquido;
* PDF profissional do orçamento.

Nesta primeira versão, o sistema será **100% gratuito**.

---

## 3. Escopo Inicial do Sistema

## 3.1 O que deve existir no MVP

O webapp deverá conter:

* Landing page;
* Cadastro de usuário;
* Login;
* Recuperação de senha;
* Dashboard interno;
* Menu lateral;
* Página de orçamento/calculadora;
* Página de meus orçamentos;
* Página de projetos/modelos;
* Página de estoque de produtos prontos;
* Página de clientes;
* Página de insumos e custos;
* Página de minha conta;
* Geração de PDF;
* Banco de dados no Supabase;
* Autenticação com Supabase Auth;
* Dados separados por usuário;
* Design moderno com cores preto, branco, azul e laranja.

---

## 3.2 O que NÃO deve existir no MVP

Nesta primeira versão, **não implementar**:

* Plano pago;
* Upgrade premium;
* Período de teste;
* Limite de orçamentos;
* Limite de projetos;
* Sistema de assinatura;
* Pagamento online;
* Checkout;
* Bloqueio de funções;
* Integração com cartão;
* Tela de cobrança.

O sistema deverá funcionar como uma versão gratuita completa.

---

# 4. Público-Alvo

O sistema será usado por:

* Profissionais de impressão 3D;
* Pequenas empresas de impressão 3D;
* Makers;
* Pessoas que vendem miniaturas, chaveiros, peças decorativas, peças técnicas e brindes personalizados;
* Usuários que precisam organizar custos reais de produção.

---

# 5. Identidade Visual

## 5.1 Estilo visual

O sistema deverá ter aparência:

* Moderna;
* Profissional;
* Limpa;
* Tecnológica;
* Fácil de entender;
* Parecida com um painel SaaS profissional.

## 5.2 Cores principais

### Fundo escuro

Usado em:

* Landing page;
* Login;
* Cadastro;
* Sidebar.

Sugestões:

```css
--dark-bg: #050816;
--sidebar-bg: #0F172A;
--card-dark: #111827;
```

### Fundo claro

Usado no painel interno:

```css
--light-bg: #F5F7FB;
--card-bg: #FFFFFF;
--border: #E2E8F0;
```

### Azul principal

Usado em botões principais e menu ativo:

```css
--primary-blue: #2563EB;
--primary-blue-hover: #1D4ED8;
```

### Laranja

Usado em destaques, alertas e botões especiais:

```css
--orange: #F97316;
--orange-hover: #EA580C;
```

### Verde

Usado para sucesso, lucro e estoque disponível:

```css
--green: #059669;
```

### Vermelho

Usado para erro, exclusão e estoque insuficiente:

```css
--red: #DC2626;
```

---

# 6. Tecnologias Recomendadas

## 6.1 Frontend

Usar preferencialmente:

* React;
* Vite;
* TypeScript;
* Tailwind CSS;
* React Router;
* React Hook Form;
* Zod;
* Lucide React para ícones;
* Recharts, caso futuramente tenha gráficos;
* jsPDF ou React-PDF para geração de PDF.

## 6.2 Backend / Banco de Dados

Usar:

* Supabase;
* Supabase Auth;
* Supabase Database;
* Supabase Storage, opcional para imagens;
* Row Level Security, RLS;
* Políticas por `user_id`.

## 6.3 Hospedagem

Sugestões futuras:

* Vercel;
* Netlify;
* Cloudflare Pages.

---

# 7. Estrutura Geral de Navegação

## 7.1 Landing Page

Rota:

```txt
/
```

Objetivo:

Apresentar o sistema e levar o usuário para login ou cadastro.

Elementos:

* Logo;
* Nome do sistema;
* Botão “Entrar”;
* Botão “Começar Grátis”;
* Hero principal;
* Explicação dos benefícios;
* Cards de funcionalidades;
* Passo a passo simples;
* Chamada final para criar conta.

Não exibir plano pago no MVP.

---

## 7.2 Login

Rota:

```txt
/login
```

Campos:

* E-mail;
* Senha.

Ações:

* Entrar;
* Ir para cadastro;
* Recuperar senha.

Validações:

* E-mail obrigatório;
* Senha obrigatória;
* Exibir erro caso dados estejam incorretos.

---

## 7.3 Cadastro

Rota:

```txt
/cadastro
```

Campos:

* Nome completo;
* E-mail;
* Senha;
* Confirmar senha.

Ações:

* Criar conta grátis;
* Ir para login.

Validações:

* Nome obrigatório;
* E-mail válido;
* Senha com no mínimo 6 caracteres;
* Confirmar senha igual à senha.

---

## 7.4 Área Interna

Rota base:

```txt
/app
```

Menu lateral:

* Orçamento/Calculadora;
* Meus Orçamentos;
* Projetos;
* Estoque;
* Meus Clientes;
* Insumos / Custos;
* Minha Conta;
* Sair.

---

# 8. Autenticação

## 8.1 Cadastro de Usuário

Ao criar conta:

1. Criar usuário no Supabase Auth;
2. Criar registro na tabela `profiles`;
3. Redirecionar para `/app/orcamento`.

## 8.2 Login

Ao fazer login:

1. Validar e-mail e senha;
2. Criar sessão;
3. Redirecionar para `/app/orcamento`.

## 8.3 Logout

Ao sair:

1. Encerrar sessão no Supabase;
2. Redirecionar para `/login`.

## 8.4 Proteção de Rotas

Todas as rotas internas precisam exigir autenticação.

Caso não esteja logado, redirecionar para `/login`.

---

# 9. Página: Orçamento / Calculadora

Rota:

```txt
/app/orcamento
```

Esta é a página principal do sistema.

---

## 9.1 Comportamento Inicial

Se o usuário ainda não tiver cadastrado:

* Nenhum filamento;
* Ou nenhuma impressora;

Mostrar aviso:

```txt
Configure seu estoque primeiro

Para criar um orçamento preciso, você precisa cadastrar pelo menos um filamento e uma impressora.
```

Botão:

```txt
Configurar Insumos / Custos
```

Ao clicar, levar para:

```txt
/app/insumos
```

---

## 9.2 Bloco: Dados do Cliente

Campos:

* Nome do cliente;
* WhatsApp / telefone;
* E-mail;
* Endereço;
* Cidade;
* UF.

Funcionalidades:

* Permitir digitar cliente manualmente;
* Permitir selecionar cliente já cadastrado;
* Ao selecionar cliente, preencher os dados automaticamente.

---

## 9.3 Bloco: Especificações da Peça

Campos:

* Nome do projeto;
* Dias de impressão;
* Horas de impressão;
* Minutos de impressão;
* Segundos de impressão;
* Peças por bandeja;
* Quantidade de bandejas;
* Diâmetro do bico;
* Medida X em mm;
* Medida Y em mm;
* Medida Z em mm;
* Descrição / observações;
* URL do projeto, opcional;
* Caminho da pasta local, opcional;
* URL da imagem ou miniatura, opcional.

---

## 9.4 Bloco: Seleção de Estoque

Campos:

* Impressora principal;
* Filamento utilizado;
* Peso usado em gramas;
* Botão para adicionar outro filamento;
* Insumo ou embalagem utilizada;
* Quantidade utilizada;
* Botão para adicionar outro insumo;
* Custos extras.

Exemplos de custos extras:

* Frete;
* Pintura;
* Acabamento;
* Lixa;
* Cola;
* Embalagem especial;
* Entrega;
* Suporte manual;
* Pós-processamento.

---

## 9.5 Bloco: Detalhamento de Custos

Exibir automaticamente:

* Materiais / filamentos;
* Serviço de impressão;
* Consumo de energia;
* Manutenção variável;
* Depreciação do equipamento;
* Margem de falha;
* Insumos e embalagens;
* Custos extras;
* Custo total de produção;
* Custo por unidade.

---

## 9.6 Bloco: Formação de Preço

Exibir automaticamente:

* Preço sugerido do lote;
* Preço por peça;
* Lucro bruto;
* Taxas e repasses;
* Lucro líquido final;
* Lucro líquido por peça.

Botões:

* Salvar orçamento;
* Gerar PDF.

---

# 10. Fórmulas da Calculadora

## 10.1 Tempo Total em Horas

```js
tempoHoras = dias * 24 + horas + minutos / 60 + segundos / 3600
```

---

## 10.2 Quantidade Total de Peças

```js
quantidadeTotalPecas = pecasPorBandeja * quantidadeBandejas
```

---

## 10.3 Custo do Filamento

Cada filamento deverá ter um preço por grama.

```js
precoPorGrama = precoPago / (pesoKg * 1000)
```

Custo usado no orçamento:

```js
custoFilamento = pesoUsadoGramas * precoPorGrama
```

Caso tenha mais de um filamento:

```js
custoTotalFilamentos = soma(custoFilamento)
```

---

## 10.4 Custo de Energia

```js
custoEnergia = (consumoWatts / 1000) * tempoHoras * precoKwh
```

---

## 10.5 Custo de Manutenção

```js
custoManutencao = manutencaoPorHora * tempoHoras
```

---

## 10.6 Depreciação da Máquina

```js
depreciacaoPorHora = valorMaquina / vidaUtilHoras
```

```js
custoDepreciacao = depreciacaoPorHora * tempoHoras
```

---

## 10.7 Custo do Serviço de Impressão

```js
custoServico = custoEnergia + custoManutencao + custoDepreciacao
```

---

## 10.8 Custo de Insumos e Embalagens

```js
custoUnitarioInsumo = precoTotalPago / quantidadeComprada
```

```js
custoInsumoUsado = quantidadeUsada * custoUnitarioInsumo
```

```js
custoTotalInsumos = soma(custoInsumoUsado)
```

---

## 10.9 Custos Extras

```js
custosExtras = soma(valorDosCustosExtras)
```

---

## 10.10 Custo Base Sem Falha

```js
custoBaseSemFalha = custoTotalFilamentos + custoServico + custoTotalInsumos + custosExtras
```

---

## 10.11 Margem de Falha

```js
valorMargemFalha = custoBaseSemFalha * (margemFalhaPercentual / 100)
```

---

## 10.12 Custo Total de Produção

```js
custoTotalProducao = custoBaseSemFalha + valorMargemFalha
```

---

## 10.13 Lucro Bruto / Markup

```js
lucroBruto = custoTotalProducao * (markupPercentual / 100)
```

---

## 10.14 Preço Antes das Taxas

```js
precoAntesTaxas = custoTotalProducao + lucroBruto
```

---

## 10.15 Taxas e Repasses

```js
valorImpostos = precoAntesTaxas * (impostosPercentual / 100)
```

```js
valorTaxaCartao = precoAntesTaxas * (taxaCartaoPercentual / 100)
```

```js
valorPublicidade = publicidadeFixa
```

```js
taxasRepasses = valorImpostos + valorTaxaCartao + valorPublicidade
```

---

## 10.16 Preço Sugerido Final

```js
precoSugerido = precoAntesTaxas + taxasRepasses
```

---

## 10.17 Lucro Líquido Final

```js
lucroLiquido = precoSugerido - custoTotalProducao - taxasRepasses
```

---

## 10.18 Preço por Peça

```js
precoPorPeca = precoSugerido / quantidadeTotalPecas
```

---

## 10.19 Lucro Líquido por Peça

```js
lucroLiquidoPorPeca = lucroLiquido / quantidadeTotalPecas
```

---

# 11. Página: Meus Orçamentos

Rota:

```txt
/app/orcamentos
```

## 11.1 Objetivo

Permitir que o usuário visualize todos os orçamentos criados.

## 11.2 Abas

* Em aberto;
* Aprovados;
* Recusados;
* Expirados.

## 11.3 Card de Orçamento

Cada orçamento deve mostrar:

* Nome do projeto;
* Nome do cliente;
* Status;
* Data;
* Peso total;
* Tempo total;
* Preço final;
* Lucro;
* Botão para dar baixa no estoque;
* Botão para ver PDF;
* Botão para editar;
* Botão para excluir.

## 11.4 Status dos Orçamentos

Status possíveis:

```txt
pendente
aprovado
recusado
expirado
baixado_estoque
```

## 11.5 Ações

### Salvar orçamento

Ao salvar, criar o orçamento no banco de dados.

### Aprovar orçamento

Alterar status para aprovado.

### Recusar orçamento

Alterar status para recusado.

### Excluir orçamento

Excluir orçamento ou marcar como deletado.

### Gerar PDF

Gerar um documento profissional com dados do orçamento.

### Dar baixa no estoque

Deduzir definitivamente os filamentos e insumos usados.

---

# 12. Página: Projetos / Modelos

Rota:

```txt
/app/projetos
```

## 12.1 Objetivo

Permitir que o usuário cadastre modelos de projetos repetitivos.

Exemplos:

* Chaveiro personalizado;
* Caixa de figurinha;
* Miniatura;
* Suporte de celular;
* Peça técnica;
* Troféu;
* Brinde;
* Luminária.

## 12.2 Campos do Modelo

### Identificação do Projeto

* Nome do projeto;
* Descrição / observações;
* Caminho da pasta local;
* URL do projeto;
* URL da miniatura/foto.

### Especificações da Peça

* Tempo de impressão;
* Peças por bandeja;
* Quantidade de bandejas;
* Diâmetro do bico;
* Medida X;
* Medida Y;
* Medida Z.

### Seleção de Estoque

* Impressora padrão;
* Filamento padrão;
* Peso padrão em gramas;
* Insumos padrão;
* Custos extras padrão.

## 12.3 Ações

* Criar modelo;
* Editar modelo;
* Excluir modelo;
* Usar modelo em novo orçamento.

Ao usar modelo, os dados devem ser preenchidos automaticamente na calculadora.

---

# 13. Página: Estoque de Produtos Prontos

Rota:

```txt
/app/estoque
```

## 13.1 Objetivo

Controlar peças que já foram impressas e estão disponíveis para pronta entrega.

## 13.2 Indicadores

Exibir no topo:

* Total de peças em estoque;
* Valor parado em estoque.

## 13.3 Cadastro de Produto Pronto

O usuário poderá adicionar ao estoque um produto já impresso.

Campos:

* Projeto/modelo;
* Nome do produto;
* Quantidade;
* Custo de produção;
* Preço de venda;
* Foto opcional;
* Observações.

## 13.4 Regra Importante

Ao adicionar produto pronto ao estoque, o sistema pode:

* Deduzir filamento e insumos automaticamente;
* Ou permitir adicionar manualmente sem movimentar filamento.

No MVP, usar a opção mais segura:

```txt
Ao adicionar produto ao estoque, perguntar se deseja dar baixa automática nos materiais utilizados.
```

## 13.5 Listagem

Cada produto deve mostrar:

* Nome;
* Quantidade;
* Custo unitário;
* Preço de venda;
* Valor total parado;
* Data de entrada;
* Ações.

## 13.6 Ações

* Adicionar produto;
* Editar produto;
* Remover produto;
* Baixar quantidade vendida;
* Ver histórico.

---

# 14. Página: Meus Clientes

Rota:

```txt
/app/clientes
```

## 14.1 Objetivo

Cadastrar e gerenciar clientes.

## 14.2 Campos do Cliente

* Nome do cliente ou empresa;
* CPF/CNPJ;
* Telefone;
* E-mail;
* Instagram / redes sociais;
* Endereço;
* Cidade;
* Estado / UF;
* Observações.

## 14.3 Listagem

A tabela deve mostrar:

* Nome do cliente;
* Telefone;
* E-mail;
* Quantidade de orçamentos criados;
* Quantidade de orçamentos fechados;
* Valor total vendido;
* Ações.

## 14.4 Ações

* Criar cliente;
* Editar cliente;
* Excluir cliente;
* Ver orçamentos do cliente;
* Selecionar cliente dentro da calculadora.

---

# 15. Página: Insumos / Custos

Rota:

```txt
/app/insumos
```

Esta página deverá ser dividida em quatro blocos principais:

1. Inventário de filamentos;
2. Máquinas;
3. Insumos e embalagens;
4. Parâmetros globais.

---

## 15.1 Inventário de Filamentos

Campos:

* Tipo / marca;
* Cor;
* Peso em kg;
* Preço pago;
* Link da foto do fornecedor, opcional.

Botão:

```txt
Adicionar ao estoque
```

## 15.2 Tabela de Filamentos

Colunas:

* Filamento;
* Cor;
* Em estoque real;
* Reservado em orçamentos;
* Livre para uso;
* Preço pago;
* Ações.

## 15.3 Controle de Estoque do Filamento

O sistema deve armazenar:

```txt
estoque_real_g
reservado_g
livre_g
```

Fórmula:

```js
livre_g = estoque_real_g - reservado_g
```

## 15.4 Histórico de Movimentação

Cada alteração de filamento deve gerar histórico.

Tipos de movimentação:

* Entrada;
* Saída;
* Reserva;
* Cancelamento de reserva;
* Baixa definitiva;
* Ajuste manual.

---

## 15.5 Máquinas

Campos:

* Modelo da impressora;
* Consumo em watts;
* Manutenção em R$/h;
* Valor da máquina;
* Vida útil estimada em horas.

Botão:

```txt
Salvar máquina
```

Listagem:

* Modelo;
* Consumo;
* Manutenção/hora;
* Valor;
* Vida útil;
* Ações.

---

## 15.6 Insumos e Embalagens

Campos:

* Tipo do item;
* Preço total pago;
* Quantidade comprada;
* Medida.

Medidas possíveis:

* Unidades;
* Metros;
* Gramas;
* Kg;
* Pacote;
* Litros;
* Ml.

Botão:

```txt
Salvar item
```

Cálculo:

```js
custoUnitario = precoTotalPago / quantidadeComprada
```

---

## 15.7 Parâmetros Globais

Campos:

* Preço energia em R$/kWh;
* Margem de falha em %;
* Markup global em %;
* Impostos em %;
* Taxa de cartão em %;
* Publicidade fixa em R$.

Esses dados serão usados automaticamente na calculadora.

---

# 16. Página: Minha Conta

Rota:

```txt
/app/minha-conta
```

## 16.1 Dados do Usuário

Exibir:

* Nome;
* E-mail;
* Data de cadastro.

## 16.2 Dados da Empresa

Campos:

* Nome da empresa ou nome profissional;
* WhatsApp / telefone;
* E-mail profissional;
* Instagram / redes sociais;
* Endereço;
* Cidade;
* UF;
* Logo da empresa, opcional.

Essas informações deverão aparecer no cabeçalho ou rodapé do PDF.

## 16.3 Ações

* Salvar dados da empresa;
* Sair da conta.

---

# 17. Geração de PDF

## 17.1 Objetivo

Gerar um PDF profissional para enviar ao cliente.

## 17.2 Conteúdo do PDF

O PDF deverá conter:

* Nome do sistema ou empresa;
* Nome do orçamento;
* Data;
* Validade;
* Dados do cliente;
* Dados do projeto;
* Quantidade;
* Bico usado;
* Medidas;
* Materiais usados;
* Valor total;
* Valor por unidade;
* Termos e condições;
* Dados da empresa;
* Contato profissional.

## 17.3 Layout do PDF

Visual:

* Limpo;
* Profissional;
* Branco;
* Detalhes em azul;
* Cards com borda;
* Valor final em destaque;
* Tamanho A4.

## 17.4 Termos e Condições Padrão

Texto sugerido:

```txt
Este orçamento tem validade de 7 dias a partir da data de emissão.

Condições de pagamento: pagamento de 50% de entrada para aprovação e início da produção, e 50% restantes na entrega ou envio da peça.

O prazo de produção inicia-se apenas após a confirmação do pagamento de entrada.

Alterações no projeto podem alterar o valor final do orçamento.
```

O usuário poderá editar futuramente, mas no MVP pode vir como texto padrão.

---

# 18. Banco de Dados Supabase

## 18.1 Tabela: profiles

```sql
profiles (
  id uuid primary key references auth.users(id),
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
  created_at timestamp with time zone default now()
)
```

---

## 18.2 Tabela: filaments

```sql
filaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  type_brand text not null,
  color text not null,
  weight_kg numeric not null,
  price_paid numeric not null,
  price_per_gram numeric not null,
  supplier_image_url text,
  stock_real_g numeric not null,
  stock_reserved_g numeric default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

---

## 18.3 Tabela: filament_movements

```sql
filament_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  filament_id uuid references filaments(id) not null,
  movement_type text not null,
  quantity_g numeric not null,
  description text,
  budget_id uuid,
  created_at timestamp with time zone default now()
)
```

Tipos de movimentação:

```txt
entrada
saida
reserva
cancelamento_reserva
baixa_definitiva
ajuste_manual
```

---

## 18.4 Tabela: machines

```sql
machines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  model text not null,
  consumption_watts numeric not null,
  maintenance_per_hour numeric not null,
  machine_value numeric not null,
  estimated_life_hours numeric not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

---

## 18.5 Tabela: supplies

```sql
supplies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  total_price numeric not null,
  quantity_purchased numeric not null,
  unit text not null,
  unit_cost numeric not null,
  stock_quantity numeric default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

---

## 18.6 Tabela: global_settings

```sql
global_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null unique,
  energy_price_kwh numeric default 0,
  failure_margin_percent numeric default 5,
  markup_percent numeric default 30,
  taxes_percent numeric default 0,
  card_fee_percent numeric default 0,
  fixed_ads_cost numeric default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

---

## 18.7 Tabela: clients

```sql
clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  document text,
  phone text,
  email text,
  instagram text,
  address text,
  city text,
  state text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

---

## 18.8 Tabela: project_models

```sql
project_models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

---

## 18.9 Tabela: budgets

```sql
budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

---

## 18.10 Tabela: budget_filaments

```sql
budget_filaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  budget_id uuid references budgets(id) not null,
  filament_id uuid references filaments(id) not null,
  weight_used_g numeric not null,
  cost numeric not null,
  created_at timestamp with time zone default now()
)
```

---

## 18.11 Tabela: budget_supplies

```sql
budget_supplies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  budget_id uuid references budgets(id) not null,
  supply_id uuid references supplies(id) not null,
  quantity_used numeric not null,
  cost numeric not null,
  created_at timestamp with time zone default now()
)
```

---

## 18.12 Tabela: budget_extra_costs

```sql
budget_extra_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  budget_id uuid references budgets(id) not null,
  name text not null,
  value numeric not null,
  created_at timestamp with time zone default now()
)
```

---

## 18.13 Tabela: ready_stock

```sql
ready_stock (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  project_model_id uuid references project_models(id),
  name text not null,
  quantity numeric not null,
  unit_cost numeric default 0,
  sale_price numeric default 0,
  image_url text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

---

# 19. Segurança no Supabase

## 19.1 Row Level Security

Todas as tabelas devem ter RLS ativado.

Exemplo:

```sql
alter table profiles enable row level security;
alter table filaments enable row level security;
alter table machines enable row level security;
alter table supplies enable row level security;
alter table clients enable row level security;
alter table budgets enable row level security;
```

## 19.2 Regra Geral

Cada usuário só pode acessar dados onde:

```sql
user_id = auth.uid()
```

## 19.3 Exemplo de Policy

```sql
create policy "Users can manage own filaments"
on filaments
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

Criar políticas parecidas para todas as tabelas com `user_id`.

---

# 20. Regras de Estoque

## 20.1 Ao salvar orçamento

Quando o usuário salvar um orçamento com filamento selecionado:

* O sistema deve reservar o peso usado;
* O peso reservado aparece em `stock_reserved_g`;
* O estoque livre diminui;
* O estoque real ainda não diminui.

Exemplo:

```txt
Estoque real: 1000 g
Reservado: 110 g
Livre: 890 g
```

---

## 20.2 Ao cancelar orçamento

Se o orçamento for cancelado ou recusado:

* Remover reserva;
* Devolver o peso para estoque livre;
* Criar movimentação de cancelamento de reserva.

---

## 20.3 Ao dar baixa no estoque

Quando o orçamento for aprovado e o usuário clicar em “Dar Baixa no Estoque”:

* Reduzir `stock_real_g`;
* Reduzir `stock_reserved_g`;
* Criar movimentação de baixa definitiva;
* Alterar status do orçamento para `baixado_estoque`.

Exemplo:

Antes:

```txt
Estoque real: 1000 g
Reservado: 110 g
Livre: 890 g
```

Depois da baixa:

```txt
Estoque real: 890 g
Reservado: 0 g
Livre: 890 g
```

---

## 20.4 Validação de Estoque

Se o usuário tentar usar mais filamento do que existe livre:

Mostrar erro:

```txt
Estoque insuficiente para este filamento.
```

---

# 21. Estados do Sistema

## 21.1 Loading

Toda ação de salvar, carregar, excluir ou gerar PDF deve exibir carregamento.

Exemplos:

```txt
Salvando...
Carregando...
Gerando PDF...
Atualizando estoque...
```

## 21.2 Sucesso

Exemplos:

```txt
Orçamento salvo com sucesso.
Cliente cadastrado com sucesso.
Estoque atualizado com sucesso.
PDF gerado com sucesso.
```

## 21.3 Erro

Exemplos:

```txt
Erro ao salvar orçamento.
Estoque insuficiente.
Preencha os campos obrigatórios.
Não foi possível gerar o PDF.
```

---

# 22. Responsividade

O sistema deve funcionar bem em:

* Desktop;
* Notebook;
* Tablet;
* Celular.

## 22.1 Desktop

* Sidebar fixa na esquerda;
* Conteúdo central;
* Cards em duas colunas quando possível.

## 22.2 Mobile

* Sidebar vira menu hambúrguer;
* Cards ficam em uma coluna;
* Botões ocupam largura total;
* Campos ficam empilhados.

---

# 23. Validações Gerais

## 23.1 Valores monetários

Todos os campos de dinheiro devem aceitar formato brasileiro:

```txt
R$ 0,00
```

Internamente, salvar como número decimal.

## 23.2 Pesos

O sistema deve trabalhar com:

* Kg no cadastro de compra;
* Gramas no uso do orçamento.

Conversão:

```txt
1 kg = 1000 g
500 g = 0,5 kg
250 g = 0,25 kg
10 g = 0,01 kg
1 g = 0,001 kg
```

## 23.3 Campos obrigatórios

### Para orçamento

Obrigatórios:

* Nome do projeto;
* Impressora;
* Filamento;
* Peso usado;
* Tempo de impressão;
* Quantidade de peças.

### Para filamento

Obrigatórios:

* Tipo / marca;
* Cor;
* Peso;
* Preço pago.

### Para máquina

Obrigatórios:

* Modelo;
* Consumo;
* Manutenção por hora;
* Valor da máquina;
* Vida útil.

---

# 24. Componentes Reutilizáveis

Criar componentes reutilizáveis:

* Button;
* Input;
* Select;
* Textarea;
* Modal;
* Card;
* Sidebar;
* Header;
* Badge;
* Toast;
* Table;
* EmptyState;
* MoneyInput;
* NumberInput;
* ConfirmDialog;
* PDFButton;
* StatusBadge.

---

# 25. Sugestão de Estrutura de Pastas

```txt
src/
  components/
    ui/
    layout/
    forms/
    tables/
    pdf/
  pages/
    public/
      LandingPage.tsx
      Login.tsx
      Register.tsx
      ForgotPassword.tsx
    app/
      Calculator.tsx
      Budgets.tsx
      Projects.tsx
      Stock.tsx
      Clients.tsx
      Costs.tsx
      Account.tsx
  hooks/
    useAuth.ts
    useFilaments.ts
    useMachines.ts
    useBudgets.ts
    useClients.ts
  lib/
    supabase.ts
    calculations.ts
    formatters.ts
    pdf.ts
  types/
    database.ts
    budget.ts
    filament.ts
    client.ts
  routes/
    AppRoutes.tsx
  styles/
    globals.css
```

---

# 26. Funções Utilitárias Necessárias

## 26.1 Formatação de dinheiro

```ts
formatCurrency(value: number): string
```

Retorno:

```txt
R$ 30,58
```

---

## 26.2 Conversão de dinheiro brasileiro para número

```ts
parseCurrency(value: string): number
```

Exemplo:

```txt
"R$ 114,90" => 114.90
```

---

## 26.3 Cálculo de orçamento

```ts
calculateBudget(input: BudgetCalculationInput): BudgetCalculationResult
```

Deve retornar todos os custos detalhados.

---

## 26.4 Cálculo de estoque livre

```ts
calculateAvailableStock(stockRealG: number, reservedG: number): number
```

---

## 26.5 Gerar PDF

```ts
generateBudgetPdf(budgetId: string): Promise<void>
```

---

# 27. Fluxo Principal do Usuário

## 27.1 Primeiro acesso

1. Usuário cria conta;
2. Entra no painel;
3. Sistema solicita cadastro de custos;
4. Usuário cadastra filamento;
5. Usuário cadastra impressora;
6. Usuário configura parâmetros globais;
7. Usuário volta para calculadora.

---

## 27.2 Criar orçamento

1. Usuário entra em Orçamento/Calculadora;
2. Preenche dados do cliente;
3. Preenche dados do projeto;
4. Seleciona impressora;
5. Seleciona filamento;
6. Informa peso usado;
7. Adiciona insumos, caso necessário;
8. Adiciona custos extras, caso necessário;
9. Sistema calcula valores automaticamente;
10. Usuário salva orçamento;
11. Sistema reserva estoque;
12. Usuário gera PDF.

---

## 27.3 Aprovar orçamento

1. Usuário entra em Meus Orçamentos;
2. Clica no orçamento;
3. Marca como aprovado;
4. Clica em dar baixa no estoque;
5. Sistema deduz materiais;
6. Status muda para baixado no estoque.

---

# 28. Critérios de Aceite

## 28.1 Cadastro e Login

O sistema será aprovado quando:

* Usuário conseguir criar conta;
* Usuário conseguir fazer login;
* Usuário conseguir sair;
* Usuário não logado não acessar área interna.

---

## 28.2 Insumos e Custos

O sistema será aprovado quando:

* Usuário conseguir cadastrar filamento;
* Preço por grama for calculado corretamente;
* Usuário conseguir cadastrar máquina;
* Usuário conseguir cadastrar insumos;
* Usuário conseguir salvar parâmetros globais.

---

## 28.3 Calculadora

O sistema será aprovado quando:

* Cálculo de custo de filamento estiver correto;
* Cálculo de energia estiver correto;
* Cálculo de manutenção estiver correto;
* Cálculo de depreciação estiver correto;
* Cálculo de margem, markup e lucro estiver correto;
* Preço sugerido atualizar automaticamente ao alterar dados.

---

## 28.4 Orçamentos

O sistema será aprovado quando:

* Usuário conseguir salvar orçamento;
* Orçamento aparecer em Meus Orçamentos;
* Sistema reservar estoque ao salvar;
* Sistema liberar reserva ao cancelar;
* Sistema baixar estoque ao confirmar.

---

## 28.5 PDF

O sistema será aprovado quando:

* PDF for gerado em A4;
* PDF tiver dados do cliente;
* PDF tiver detalhes do projeto;
* PDF tiver valor total;
* PDF tiver termos e condições;
* PDF puder ser baixado ou aberto.

---

# 29. Melhorias Futuras

Após o MVP, poderão ser adicionados:

* Planos pagos;
* Assinatura mensal;
* Integração com Stripe ou Mercado Pago;
* Upload de logo;
* Upload de imagens;
* Dashboard financeiro;
* Gráficos de lucro;
* Relatório mensal;
* Controle de pagamentos;
* Envio de orçamento por WhatsApp;
* Envio de orçamento por e-mail;
* Página pública do orçamento;
* Assinatura digital do cliente;
* Controle de produção;
* Status de produção;
* Catálogo de produtos;
* Integração com impressoras;
* Importação de dados do slicer;
* Backup automático avançado.

---

# 30. Observação Final para Desenvolvimento

O foco inicial deve ser criar um sistema simples, bonito e funcional, priorizando:

1. Cadastro de custos reais;
2. Cálculo correto do orçamento;
3. Controle de estoque;
4. Organização de clientes;
5. PDF profissional.

O sistema deve ser construído de forma modular para permitir expansão futura, mas sem implementar pagamento ou plano premium nesta primeira versão.
