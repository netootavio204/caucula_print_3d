# CalculaPrint 3D

Aplicação web para precificação de impressão 3D, orçamentos, estoque de materiais e produtos prontos, catálogo público, vendas e consignação.

## Tecnologias

- React, Vite e TypeScript
- Tailwind CSS e React Router
- Supabase Auth, PostgreSQL, Storage e Row Level Security
- jsPDF

## Requisitos

- Node.js 20 ou superior
- npm
- Projeto no Supabase

## Configuração local

1. Instale as dependências:

```bash
npm install
```

2. Crie `.env` com base em `.env.example`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Não existem novas variáveis obrigatórias na V2. Use somente a chave pública no frontend. Nunca adicione `service_role` ou tokens pessoais ao `.env`, código-fonte ou provedor de deploy.

3. Aplique todas as migrations de `supabase/migrations` em ordem:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

As migrations da V2 adicionam:

- campos de catálogo e quantidades em `ready_stock`;
- `ready_stock_movements`, `sales`, `sale_items`;
- `consignments`, `consignment_items`, `consignment_payments`;
- views públicas seguras;
- buckets e policies do Storage;
- RPCs transacionais de vendas, consignação e estoque;
- restrições contra quantidades negativas.

4. Em **Authentication > URL Configuration**, configure a URL do site e os redirecionamentos. Para desenvolvimento, use `http://localhost:5173`.

5. Inicie o projeto:

```bash
npm run dev
```

## Storage

Os buckets necessários são criados pelas migrations:

- `catalog-products`: imagens públicas dos produtos, limite de 2 MB por imagem;
- `company-assets`: logo pública da empresa, limite de 1 MB.

Formatos aceitos: WEBP, JPG, JPEG e PNG. Upload, substituição e exclusão são restritos à pasta do usuário autenticado. A leitura dos arquivos é pública para permitir o catálogo.

## Como testar

### Catálogo

1. Crie um produto em **Estoque**.
2. Abra **Catálogo** e preencha código, nome e descrição públicos.
3. Envie a imagem principal e, opcionalmente, a segunda imagem.
4. Publique o produto e abra `/` sem login.
5. Confirme que o card mostra somente imagens, código, nome, descrição e categoria, sem preço, custo ou quantidade.
6. Teste substituir/remover imagens, ocultar e excluir com confirmação.

### Vendas

1. Abra **Vendas** e crie uma venda direta usando um produto disponível.
2. Confirme a redução do estoque interno e a movimentação `saida_venda`.
3. Registre pagamento total ou parcial e confira o valor em aberto.
4. Cancele a venda e confirme a devolução ao estoque e a movimentação `cancelamento_venda`.

### Consignação

1. Cadastre um cliente do tipo **Consignatário** ou **Ambos**.
2. Crie um lote em **Consignação** e adicione produtos do estoque.
3. Confirme a redução do estoque interno e o aumento da quantidade consignada.
4. Registre venda consignada, pagamento parcial e devolução.
5. Confira quantidades, valores, status, indicadores e histórico do estoque.

### V1

Cadastre filamento, máquina e parâmetros globais. Crie um orçamento, confirme a reserva, gere o PDF A4, recuse para liberar a reserva ou aprove e dê baixa definitiva. Os custos e lucros internos não devem aparecer no PDF do cliente.

## Verificação e build

```bash
npm run typecheck
npm run build
npm run preview
```

O build é gerado em `dist`. `vercel.json` e `public/_redirects` mantêm as rotas do React Router funcionando em hospedagens com fallback de SPA.

O teste transacional da V2.5/V2.6 está em `supabase/tests/v2_phase_5_consignment_flow.sql`. Execute apenas em ambiente controlado; ele usa `ROLLBACK` e não persiste os dados do cenário.

## Segurança

- Todas as tabelas privadas usam RLS e isolam dados por `auth.uid()`.
- A página pública consulta apenas `public_catalog_view` e `public_company_view`.
- As views públicas não expõem preço, custo, lucro, quantidades, clientes, vendas ou consignações.
- Operações críticas de orçamento, estoque, venda e consignação são transacionais no banco.
- Não publique credenciais administrativas nem contorne as policies no frontend.
