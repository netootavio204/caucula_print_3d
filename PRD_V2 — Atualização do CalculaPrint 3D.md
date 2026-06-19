# PRD_V2 — Atualização do CalculaPrint 3D

## 1. Nome da Atualização

**CalculaPrint 3D — V2 Catálogo, Vendas e Consignação**

---

## 2. Objetivo da V2

Esta atualização tem como objetivo ampliar o sistema **CalculaPrint 3D**, adicionando:

1. Catálogo público de peças prontas na página inicial;
2. Administração interna do catálogo;
3. Armazenamento de imagens com Supabase Storage;
4. Gerenciamento de vendas;
5. Gerenciamento de consignação;
6. Integração de vendas e consignação com o estoque de peças prontas;
7. Controle de peças pagas, não pagas e parcialmente pagas.

A V2 deve ser implementada sem danificar o que já está pronto e validado na V1.

---

## 3. Regra Principal da V2

A V2 é uma atualização incremental.

Ela não deve substituir o sistema atual.

Ela deve apenas ampliar o sistema existente.

## 3.1 O que deve ser preservado

O Codex não pode quebrar:

* Login;
* Cadastro;
* Supabase Auth;
* Proteção de rotas;
* RLS;
* Calculadora;
* Orçamentos;
* Clientes;
* Insumos;
* Máquinas;
* Estoque atual;
* PDF;
* Minha conta;
* Layout principal;
* Fórmulas já validadas.

## 3.2 O que é proibido fazer

Durante a V2, o Codex não pode:

* Recriar o projeto do zero;
* Apagar tabelas existentes;
* Apagar dados existentes;
* Remover campos existentes;
* Reescrever a calculadora;
* Alterar fórmulas já aprovadas;
* Criar plano pago;
* Criar botão premium;
* Criar trial;
* Criar limite gratuito;
* Criar checkout;
* Criar pagamento online;
* Criar assinatura.

---

# 4. Escopo da V2

## 4.1 Deve implementar

A V2 deve implementar:

* Landing page pública como catálogo de peças;
* Banner principal na página pública;
* Cards de produtos públicos;
* Código de produto;
* Nome público do produto;
* Descrição pública;
* Até 2 imagens por produto;
* Botão de consulta pelo WhatsApp;
* Página interna de administração do catálogo;
* Upload de imagens pelo Supabase Storage;
* Bucket `catalog-products`;
* Bucket `company-assets`;
* Página interna de vendas;
* Página interna de consignação;
* Sincronização com estoque de produtos prontos;
* Status de pagamento;
* Status de entrega;
* Controle de peças consignadas;
* Controle de peças vendidas;
* Controle de peças devolvidas;
* Controle de valores pagos e não pagos.

## 4.2 Não deve implementar agora

A V2 não deve implementar:

* Marketplace com checkout;
* Carrinho de compras;
* Pagamento automático;
* Link de pagamento;
* Área pública de compra;
* Login de cliente final;
* Planos pagos;
* Assinatura.

---

# 5. Landing Page como Catálogo Público

## 5.1 Objetivo

A página inicial do sistema deve se tornar uma página pública de vendas e apresentação de peças prontas.

Ela funcionará como uma vitrine.

O visitante poderá ver produtos, imagens, descrição e código do produto, mas não verá preço.

---

## 5.2 Rota pública

A rota principal continua sendo:

```txt
/
```

Essa rota deve ser pública.

Qualquer pessoa pode acessar sem login.

---

## 5.3 Estrutura da página pública

A página pública deve conter:

* Header;
* Logo ou nome da empresa;
* Botão “Entrar”;
* Banner principal;
* Chamada para catálogo;
* Grid de produtos;
* Cards de produtos;
* Botão de consulta;
* Rodapé.

---

## 5.4 Banner principal

O banner deve ter aparência moderna e profissional.

Deve conter:

* Nome da empresa ou marca;
* Frase de impacto;
* Texto curto explicativo;
* Botão de contato.

Texto sugerido:

```txt
Peças 3D personalizadas e prontas para você

Confira nosso catálogo de modelos impressos em 3D.
Para valores e encomendas, entre em contato informando o código do produto.
```

---

## 5.5 Card público do produto

Cada card deve exibir:

* Imagem principal;
* Segunda imagem opcional;
* Código do produto;
* Nome do produto em destaque;
* Descrição curta;
* Categoria, se existir;
* Botão “Consultar Produto”.

---

## 5.6 Regras do catálogo público

A página pública deve mostrar apenas produtos marcados como visíveis.

Um produto só pode aparecer publicamente se tiver:

* Código público;
* Nome público;
* Descrição pública;
* Imagem principal;
* Campo `is_catalog_visible = true`.

---

## 5.7 O que não pode aparecer publicamente

A página pública não pode mostrar:

* Preço;
* Custo;
* Lucro;
* Markup;
* Quantidade exata em estoque;
* Dados de orçamento;
* Dados de cliente;
* Dados de venda;
* Dados de consignação;
* Dados privados do usuário;
* Botões de editar;
* Botões de excluir;
* Área administrativa.

---

## 5.8 Código do produto

Cada produto deve ter um código público.

Exemplos:

```txt
CP-0001
CP-0002
MINI-001
CHV-015
FIG-020
```

Esse código será usado pelo cliente para consultar a peça.

Exemplo de mensagem:

```txt
Olá, tenho interesse no produto CP-0001.
```

---

## 5.9 Botão de consulta

O botão de cada produto deve se chamar:

```txt
Consultar Produto
```

Ao clicar, deve abrir o WhatsApp com mensagem pronta, caso o usuário tenha telefone cadastrado na Minha Conta.

Mensagem sugerida:

```txt
Olá, tenho interesse no produto {codigo_produto} - {nome_produto}.
```

Se não houver WhatsApp cadastrado, mostrar uma mensagem simples:

```txt
Informe o código do produto ao entrar em contato: {codigo_produto}
```

---

# 6. Administração Interna do Catálogo

## 6.1 Objetivo

Criar uma área interna para o usuário logado controlar quais produtos aparecem no catálogo público.

---

## 6.2 Nova rota interna

Criar a rota:

```txt
/app/catalogo
```

Nome no menu lateral:

```txt
Catálogo
```

---

## 6.3 Funções da página de catálogo

A página interna de catálogo deve permitir:

* Criar produto para catálogo;
* Editar produto;
* Ocultar produto;
* Publicar produto;
* Excluir produto com confirmação;
* Vincular produto ao estoque pronto;
* Definir código público;
* Definir nome público;
* Definir descrição pública;
* Definir categoria;
* Enviar imagem principal;
* Enviar segunda imagem opcional;
* Substituir imagem;
* Remover imagem;
* Visualizar prévia do card público.

---

## 6.4 Limite de imagens

Cada produto pode ter no máximo:

```txt
2 imagens
```

Regras:

* Imagem 1 é a imagem principal;
* Imagem 2 é opcional;
* Não permitir upload de terceira imagem;
* Não permitir publicar produto sem imagem principal.

---

## 6.5 Status do produto no catálogo

O produto pode ter os seguintes estados:

```txt
rascunho
publico
oculto
```

Descrição:

* `rascunho`: produto ainda incompleto;
* `publico`: aparece na landing page;
* `oculto`: não aparece publicamente.

---

# 7. Supabase Storage

## 7.1 Objetivo

Usar Supabase Storage para armazenar imagens do catálogo e da empresa.

Não salvar imagens em base64 no banco.

Não usar localStorage para imagens.

---

## 7.2 Buckets necessários

Criar dois buckets:

```txt
catalog-products
company-assets
```

---

## 7.3 Bucket `catalog-products`

Uso:

* Imagens dos produtos do catálogo público;
* Imagens de peças prontas.

Regras:

* Leitura pública permitida;
* Upload somente com usuário logado;
* Usuário só pode enviar imagens dentro da própria pasta;
* Usuário só pode excluir imagens da própria pasta.

Estrutura de caminho:

```txt
catalog-products/{user_id}/{product_code}/image-1.webp
catalog-products/{user_id}/{product_code}/image-2.webp
```

Exemplo:

```txt
catalog-products/USER_UUID/CP-0001/image-1.webp
catalog-products/USER_UUID/CP-0001/image-2.webp
```

---

## 7.4 Bucket `company-assets`

Uso:

* Logo da empresa;
* Imagens institucionais;
* Logo usada no PDF;
* Logo usada na página pública.

Regras:

* Leitura pública permitida;
* Upload somente com usuário logado;
* Usuário só pode enviar imagens dentro da própria pasta;
* Usuário só pode excluir imagens da própria pasta.

Estrutura de caminho:

```txt
company-assets/{user_id}/logo.webp
```

---

## 7.5 Formatos permitidos

Permitir:

```txt
.webp
.jpg
.jpeg
.png
```

Formato recomendado:

```txt
.webp
```

---

## 7.6 Tamanho máximo

Imagens de produto:

```txt
2 MB por imagem
```

Logo da empresa:

```txt
1 MB
```

---

## 7.7 Regras de upload

Antes do upload, validar:

* Arquivo obrigatório;
* Formato permitido;
* Tamanho máximo;
* Usuário logado;
* Produto existente;
* Código público definido;
* Posição da imagem sendo 1 ou 2.

---

## 7.8 Funções necessárias no frontend

Criar arquivo:

```txt
src/lib/storage.ts
```

Funções obrigatórias:

```ts
uploadCatalogProductImage(params)
deleteCatalogProductImage(path)
replaceCatalogProductImage(params)
uploadCompanyLogo(file)
deleteCompanyLogo(path)
getPublicStorageUrl(bucket, path)
```

---

# 8. Ajustes no Estoque de Produtos Prontos

## 8.1 Objetivo

O estoque de produtos prontos passa a ser a base para:

* Catálogo;
* Venda direta;
* Consignação.

---

## 8.2 Campos adicionais no estoque pronto

Adicionar ao estoque pronto:

* Código interno;
* Código público;
* Categoria;
* Nome público;
* Descrição pública;
* Imagem 1 URL;
* Imagem 1 path;
* Imagem 2 URL;
* Imagem 2 path;
* Visível no catálogo;
* Preço de venda direta;
* Preço de consignação;
* Quantidade interna;
* Quantidade em consignação;
* Quantidade vendida;
* Status.

---

## 8.3 Status do estoque pronto

Status possíveis:

```txt
disponivel
em_consignacao
vendido
esgotado
oculto
```

---

## 8.4 Indicadores da página de estoque

A página de estoque deve exibir:

* Total de peças em estoque interno;
* Total de peças em consignação;
* Total de peças vendidas;
* Valor parado em estoque;
* Valor em consignação;
* Valor vendido não pago.

---

# 9. Movimentações de Estoque Pronto

## 9.1 Objetivo

Criar histórico de movimentações do estoque de peças prontas.

---

## 9.2 Tipos de movimentação

```txt
entrada_manual
entrada_orcamento
saida_venda
saida_consignacao
devolucao_consignacao
ajuste_manual
cancelamento_venda
```

---

## 9.3 Cada movimentação deve registrar

* Produto;
* Tipo da movimentação;
* Quantidade;
* Descrição;
* Venda vinculada, se houver;
* Consignação vinculada, se houver;
* Orçamento vinculado, se houver;
* Data.

---

# 10. Gerenciamento de Vendas

## 10.1 Objetivo

Criar uma área para controlar vendas diretas e vendas originadas de orçamento.

---

## 10.2 Nova rota interna

Criar rota:

```txt
/app/vendas
```

Nome no menu lateral:

```txt
Vendas
```

---

## 10.3 Tipos de venda

```txt
venda_direta
venda_orcamento
```

### Venda direta

Venda feita a partir de produto pronto no estoque.

### Venda por orçamento

Venda vinculada a um orçamento já existente.

---

## 10.4 Campos da venda

A venda deve conter:

* Cliente;
* Tipo de venda;
* Orçamento vinculado, se houver;
* Código da venda;
* Produto vendido;
* Quantidade;
* Valor unitário;
* Valor total;
* Valor pago;
* Valor em aberto;
* Status de pagamento;
* Status de entrega;
* Forma de pagamento;
* Data da venda;
* Observações.

---

## 10.5 Status de pagamento

```txt
pago
nao_pago
parcialmente_pago
cancelado
```

---

## 10.6 Status de entrega

```txt
pendente
entregue
retirado
enviado
cancelado
```

---

## 10.7 Formas de pagamento

```txt
dinheiro
pix
cartao_credito
cartao_debito
transferencia
outro
```

---

## 10.8 Cálculos da venda

```ts
valorTotal = quantidade * valorUnitario
```

```ts
valorEmAberto = valorTotal - valorPago
```

Status automático:

```ts
if (valorPago <= 0) paymentStatus = 'nao_pago'
if (valorPago > 0 && valorPago < valorTotal) paymentStatus = 'parcialmente_pago'
if (valorPago >= valorTotal) paymentStatus = 'pago'
```

---

## 10.9 Sincronização com estoque

Ao registrar venda direta:

* Reduzir quantidade interna do estoque pronto;
* Aumentar quantidade vendida;
* Criar movimentação `saida_venda`;
* Registrar venda;
* Registrar item vendido.

Ao cancelar venda:

* Devolver quantidade ao estoque interno, se já foi baixada;
* Reduzir quantidade vendida;
* Criar movimentação `cancelamento_venda`;
* Alterar status da venda para `cancelado`.

---

## 10.10 Indicadores da página de vendas

Mostrar:

* Total vendido;
* Total pago;
* Total em aberto;
* Quantidade de vendas;
* Vendas pagas;
* Vendas não pagas;
* Vendas parcialmente pagas.

---

# 11. Gerenciamento de Consignação

## 11.1 Objetivo

Criar área para controlar peças deixadas em consignação com terceiros.

Exemplos:

* Lojas;
* Parceiros;
* Pontos de venda;
* Revendedores;
* Feiras;
* Clientes consignatários.

---

## 11.2 Nova rota interna

Criar rota:

```txt
/app/consignacao
```

Nome no menu lateral:

```txt
Consignação
```

---

## 11.3 Consignatário

A consignação deve estar vinculada a um cliente cadastrado.

Adicionar ao cliente o campo:

```txt
client_type
```

Valores possíveis:

```txt
cliente
consignatario
ambos
```

---

## 11.4 Lote de consignação

A consignação será organizada por lote.

Exemplo:

```txt
Lote CONS-0001
Consignatário: Loja Central
Data de envio: 20/06/2026
Status: Em consignação
```

---

## 11.5 Campos do lote

O lote deve conter:

* Código do lote;
* Consignatário;
* Data de envio;
* Data prevista de acerto;
* Status;
* Observações;
* Valor total consignado;
* Valor total vendido;
* Valor total pago;
* Valor em aberto.

---

## 11.6 Status do lote

```txt
em_consignacao
parcialmente_vendido
vendido_nao_pago
vendido_pago
parcialmente_pago
finalizado
cancelado
```

---

## 11.7 Itens da consignação

Cada lote pode ter vários itens.

Campos do item:

* Produto do estoque pronto;
* Código do produto;
* Nome do produto;
* Quantidade enviada;
* Quantidade vendida;
* Quantidade devolvida;
* Quantidade restante;
* Preço consignado unitário;
* Valor total consignado;
* Valor vendido;
* Valor pago;
* Valor em aberto;
* Status do item.

---

## 11.8 Cálculos da consignação

```ts
quantidadeRestante = quantidadeEnviada - quantidadeVendida - quantidadeDevolvida
```

```ts
valorTotalConsignado = quantidadeEnviada * precoConsignadoUnitario
```

```ts
valorVendido = quantidadeVendida * precoConsignadoUnitario
```

```ts
valorEmAberto = valorVendido - valorPago
```

---

## 11.9 Status dos itens consignados

```txt
em_consignacao
vendido_nao_pago
vendido_pago
parcialmente_pago
devolvido
finalizado
```

---

## 11.10 Sincronização com estoque

Ao criar lote de consignação:

* Reduzir quantidade interna do estoque pronto;
* Aumentar quantidade em consignação;
* Criar movimentação `saida_consignacao`.

Ao registrar devolução:

* Aumentar quantidade interna do estoque pronto;
* Reduzir quantidade em consignação;
* Aumentar quantidade devolvida no item;
* Criar movimentação `devolucao_consignacao`.

Ao registrar venda consignada:

* Reduzir quantidade em consignação;
* Aumentar quantidade vendida;
* Atualizar valores vendidos;
* Não devolver peça para estoque.

Ao registrar pagamento:

* Aumentar valor pago;
* Reduzir valor em aberto;
* Atualizar status do lote e dos itens.

---

## 11.11 Indicadores da página de consignação

Mostrar:

* Peças em consignação;
* Valor total em consignação;
* Valor vendido;
* Valor pago;
* Valor em aberto;
* Quantidade de lotes ativos.

---

# 12. Atualizações no Banco de Dados

## 12.1 Regra obrigatória

Todas as alterações devem ser feitas por migration incremental.

Não apagar tabelas existentes.

Não recriar tabelas existentes do zero.

Não remover dados existentes.

---

## 12.2 Atualizar tabela `clients`

Adicionar:

```sql
alter table clients
add column if not exists client_type text default 'cliente';
```

---

## 12.3 Atualizar tabela `profiles`

Adicionar:

```sql
alter table profiles
add column if not exists company_logo_url text,
add column if not exists company_logo_path text;
```

---

## 12.4 Atualizar tabela `ready_stock`

Adicionar:

```sql
alter table ready_stock
add column if not exists internal_code text,
add column if not exists public_code text,
add column if not exists category text,
add column if not exists public_name text,
add column if not exists public_description text,
add column if not exists catalog_image_1_url text,
add column if not exists catalog_image_1_path text,
add column if not exists catalog_image_2_url text,
add column if not exists catalog_image_2_path text,
add column if not exists is_catalog_visible boolean default false,
add column if not exists direct_sale_price numeric default 0,
add column if not exists consignment_price numeric default 0,
add column if not exists quantity_internal numeric default 0,
add column if not exists quantity_consigned numeric default 0,
add column if not exists quantity_sold numeric default 0,
add column if not exists status text default 'disponivel';
```

Após adicionar os campos, preencher `quantity_internal` com o valor antigo de `quantity` quando estiver vazio:

```sql
update ready_stock
set quantity_internal = quantity
where quantity_internal = 0
and quantity is not null;
```

---

## 12.5 Criar tabela `ready_stock_movements`

```sql
create table if not exists ready_stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ready_stock_id uuid references ready_stock(id) on delete cascade not null,
  movement_type text not null,
  quantity numeric not null,
  description text,
  sale_id uuid,
  consignment_id uuid,
  budget_id uuid,
  created_at timestamptz default now()
);
```

---

## 12.6 Criar tabela `sales`

```sql
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id),
  budget_id uuid references budgets(id),
  sale_type text not null default 'venda_direta',
  sale_code text,
  total_value numeric default 0,
  paid_value numeric default 0,
  open_value numeric default 0,
  payment_status text default 'nao_pago',
  delivery_status text default 'pendente',
  payment_method text,
  sale_date date default current_date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 12.7 Criar tabela `sale_items`

```sql
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  sale_id uuid references sales(id) on delete cascade not null,
  ready_stock_id uuid references ready_stock(id),
  product_code text,
  product_name text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  created_at timestamptz default now()
);
```

---

## 12.8 Criar tabela `consignments`

```sql
create table if not exists consignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  consignee_client_id uuid references clients(id),
  consignment_code text,
  sent_date date default current_date,
  expected_settlement_date date,
  status text default 'em_consignacao',
  total_consigned_value numeric default 0,
  total_sold_value numeric default 0,
  total_paid_value numeric default 0,
  total_open_value numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 12.9 Criar tabela `consignment_items`

```sql
create table if not exists consignment_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  consignment_id uuid references consignments(id) on delete cascade not null,
  ready_stock_id uuid references ready_stock(id),
  product_code text,
  product_name text not null,
  quantity_sent numeric not null default 0,
  quantity_sold numeric not null default 0,
  quantity_returned numeric not null default 0,
  quantity_remaining numeric not null default 0,
  consignment_unit_price numeric not null default 0,
  total_consigned_value numeric default 0,
  sold_value numeric default 0,
  paid_value numeric default 0,
  open_value numeric default 0,
  status text default 'em_consignacao',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 12.10 Criar tabela `consignment_payments`

```sql
create table if not exists consignment_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  consignment_id uuid references consignments(id) on delete cascade not null,
  consignment_item_id uuid references consignment_items(id),
  amount numeric not null default 0,
  payment_method text,
  payment_date date default current_date,
  notes text,
  created_at timestamptz default now()
);
```

---

# 13. View Pública do Catálogo

## 13.1 Objetivo

Criar uma view pública para expor somente dados seguros no catálogo.

Essa view evita que a página pública leia diretamente campos internos do estoque.

---

## 13.2 Nome da view

```txt
public_catalog_view
```

---

## 13.3 Campos permitidos

A view deve expor apenas:

* `id`;
* `user_id`;
* `public_code`;
* `public_name`;
* `public_description`;
* `category`;
* `catalog_image_1_url`;
* `catalog_image_2_url`;
* `is_catalog_visible`;
* `created_at`.

---

## 13.4 SQL recomendado

```sql
create or replace view public_catalog_view as
select
  id,
  user_id,
  public_code,
  public_name,
  public_description,
  category,
  catalog_image_1_url,
  catalog_image_2_url,
  is_catalog_visible,
  created_at
from ready_stock
where is_catalog_visible = true
and public_code is not null
and public_name is not null
and public_description is not null
and catalog_image_1_url is not null;
```

---

# 14. RLS e Segurança

## 14.1 Ativar RLS nas novas tabelas

```sql
alter table ready_stock_movements enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table consignments enable row level security;
alter table consignment_items enable row level security;
alter table consignment_payments enable row level security;
```

---

## 14.2 Regra geral de segurança

Cada usuário só pode acessar dados onde:

```sql
user_id = auth.uid()
```

---

## 14.3 Criar policies para novas tabelas

Criar policies de `select`, `insert`, `update` e `delete` para:

* `ready_stock_movements`;
* `sales`;
* `sale_items`;
* `consignments`;
* `consignment_items`;
* `consignment_payments`.

---

## 14.4 Segurança do catálogo público

A página pública pode ler somente a view:

```txt
public_catalog_view
```

Não permitir que visitante público acesse:

* `sales`;
* `sale_items`;
* `consignments`;
* `consignment_items`;
* `consignment_payments`;
* Campos financeiros de `ready_stock`;
* Dados de clientes;
* Dados privados.

---

# 15. Storage Buckets e Policies

## 15.1 Criar buckets

```sql
insert into storage.buckets (id, name, public)
values ('catalog-products', 'catalog-products', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('company-assets', 'company-assets', true)
on conflict (id) do nothing;
```

---

## 15.2 Leitura pública

Permitir leitura pública das imagens:

```sql
create policy "Public can read catalog product images"
on storage.objects
for select
using (bucket_id = 'catalog-products');

create policy "Public can read company assets"
on storage.objects
for select
using (bucket_id = 'company-assets');
```

---

## 15.3 Upload apenas na pasta do próprio usuário

```sql
create policy "Users can upload own catalog product images"
on storage.objects
for insert
with check (
  bucket_id = 'catalog-products'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can upload own company assets"
on storage.objects
for insert
with check (
  bucket_id = 'company-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 15.4 Atualizar apenas arquivos do próprio usuário

```sql
create policy "Users can update own catalog product images"
on storage.objects
for update
using (
  bucket_id = 'catalog-products'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'catalog-products'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own company assets"
on storage.objects
for update
using (
  bucket_id = 'company-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'company-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 15.5 Excluir apenas arquivos do próprio usuário

```sql
create policy "Users can delete own catalog product images"
on storage.objects
for delete
using (
  bucket_id = 'catalog-products'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own company assets"
on storage.objects
for delete
using (
  bucket_id = 'company-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

---

# 16. Novas Rotas da V2

Adicionar as rotas internas:

```txt
/app/catalogo
/app/vendas
/app/consignacao
```

---

# 17. Menu Lateral Atualizado

O menu lateral deve ficar assim:

```txt
Orçamento/Calculadora
Meus Orçamentos
Projetos
Estoque
Catálogo
Vendas
Consignação
Meus Clientes
Insumos / Custos
Minha Conta
Sair
```

---

# 18. Componentes Novos ou Atualizados

Criar ou atualizar componentes:

* ProductCatalogCard;
* ProductImageUploader;
* CatalogProductForm;
* PublicCatalogGrid;
* SaleForm;
* SaleCard;
* SaleStatusBadge;
* ConsignmentForm;
* ConsignmentItemTable;
* ConsignmentStatusBadge;
* StockMovementTable;
* PaymentStatusBadge.

---

# 19. Hooks Novos

Criar hooks:

```txt
useCatalog
useStorage
useSales
useConsignments
useReadyStockMovements
```

---

# 20. Arquivos Utilitários Novos

Criar ou atualizar:

```txt
src/lib/storage.ts
src/lib/salesCalculations.ts
src/lib/consignmentCalculations.ts
src/lib/stockMovements.ts
```

---

# 21. Regras de Compatibilidade

## 21.1 Orçamentos

Orçamentos antigos devem continuar funcionando.

Nenhum orçamento antigo deve ser recalculado automaticamente.

---

## 21.2 Estoque pronto

Produtos antigos em `ready_stock` devem continuar aparecendo.

Se existir o campo antigo `quantity`, ele deve ser preservado.

A nova quantidade interna deve iniciar com o valor antigo de `quantity`.

---

## 21.3 Clientes

Clientes antigos devem receber:

```txt
client_type = cliente
```

---

# 22. Critérios de Aceite da V2

## 22.1 Catálogo público

A V2 será aprovada quando:

* A página inicial mostrar produtos públicos;
* Produtos ocultos não aparecerem;
* Cada produto mostrar código, nome e descrição;
* Cada produto aceitar no máximo 2 imagens;
* Nenhum preço aparecer publicamente;
* Nenhum custo aparecer publicamente;
* Botão de consulta funcionar.

---

## 22.2 Administração do catálogo

A V2 será aprovada quando:

* Usuário logado criar produto de catálogo;
* Usuário editar produto;
* Usuário publicar produto;
* Usuário ocultar produto;
* Usuário enviar até 2 imagens;
* Usuário excluir imagem;
* Usuário substituir imagem;
* Usuário vincular produto ao estoque pronto.

---

## 22.3 Storage

A V2 será aprovada quando:

* Bucket `catalog-products` existir;
* Bucket `company-assets` existir;
* Upload de produto funcionar;
* Upload de logo funcionar;
* Imagens públicas abrirem sem login;
* Usuário não conseguir alterar pasta de outro usuário;
* Imagem principal aparecer no catálogo público.

---

## 22.4 Vendas

A V2 será aprovada quando:

* Usuário criar venda direta;
* Venda baixar estoque interno;
* Venda aumentar quantidade vendida;
* Venda registrar valor total;
* Venda registrar valor pago;
* Venda calcular valor em aberto;
* Venda aceitar status pago, não pago e parcialmente pago;
* Venda cancelada devolver estoque.

---

## 22.5 Consignação

A V2 será aprovada quando:

* Usuário criar lote de consignação;
* Lote baixar estoque interno;
* Lote aumentar quantidade em consignação;
* Usuário registrar venda consignada;
* Usuário registrar devolução;
* Usuário registrar pagamento;
* Sistema calcular valor vendido;
* Sistema calcular valor pago;
* Sistema calcular valor em aberto;
* Sistema mostrar peças restantes em consignação.

---

## 22.6 Segurança

A V2 será aprovada quando:

* RLS estiver ativo nas novas tabelas;
* Usuário só acessar seus próprios dados;
* Página pública não expor dados privados;
* Visitante não administrar catálogo;
* Visitante não acessar vendas;
* Visitante não acessar consignação.

---

# 23. Teste Principal da V2

O fluxo principal de teste deve ser:

1. Fazer login;
2. Criar produto pronto no estoque;
3. Enviar imagem principal;
4. Enviar segunda imagem opcional;
5. Publicar no catálogo;
6. Abrir página inicial sem login;
7. Confirmar que produto aparece sem preço;
8. Criar venda direta do produto;
9. Confirmar baixa no estoque;
10. Confirmar valor pago ou não pago;
11. Criar lote de consignação;
12. Enviar produto para consignação;
13. Registrar venda consignada;
14. Registrar pagamento parcial;
15. Registrar devolução;
16. Conferir indicadores de estoque, vendas e consignação.

---

# 24. Resumo Final da V2

A V2 transforma o CalculaPrint 3D em um sistema mais completo para vender e controlar peças impressas em 3D.

A V2 adiciona:

* Vitrine pública;
* Catálogo com imagens;
* Controle de produtos publicados;
* Supabase Storage;
* Gestão de vendas;
* Gestão de pagamentos;
* Gestão de consignação;
* Integração com estoque.

A prioridade continua sendo:

```txt
Não quebrar o que já funciona.
Não criar plano pago.
Não expor dados privados.
Manter o sistema simples, profissional e gratuito.
```
