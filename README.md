# CalculaPrint 3D

Aplicação web para calcular orçamentos de impressão 3D, controlar insumos, reservar materiais e acompanhar clientes, projetos e estoque de produtos prontos.

## Tecnologias

- React, Vite e TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL e Row Level Security
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

2. Crie o arquivo `.env` com base no `.env.example`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Use somente a chave pública/anon no frontend. Chaves `service_role` e tokens pessoais nunca devem ser adicionados ao `.env`, ao código-fonte ou ao provedor de deploy.

3. Execute, em ordem, as migrations da pasta `supabase/migrations` pelo SQL Editor do Supabase ou com a CLI:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

As migrations criam tabelas, políticas RLS, gatilhos e funções transacionais necessárias para autenticação, cadastros, orçamentos e estoque.

4. Em **Authentication > URL Configuration** no Supabase, configure a URL do site e inclua as URLs de redirecionamento usadas localmente e em produção. Para desenvolvimento, use `http://localhost:5173`.

5. Inicie o projeto:

```bash
npm run dev
```

## Verificação e build

```bash
npm run typecheck
npm run build
npm run preview
```

O build é gerado em `dist`. As configurações incluídas em `vercel.json` e `public/_redirects` mantêm as rotas do React Router funcionando em Vercel e Netlify.

## Fluxo de validação

Após criar uma conta, cadastre pelo menos um filamento e uma máquina em **Insumos / Custos**, revise os parâmetros globais e então crie clientes, projetos e orçamentos. Ao salvar um orçamento, o material é reservado; ao recusar, a reserva é liberada; ao dar baixa, o estoque real e o reservado são atualizados pela função transacional do banco.

## Segurança

- O acesso do navegador usa apenas a chave pública do Supabase.
- Todas as tabelas de usuário têm RLS e isolam dados por `auth.uid()`.
- Operações críticas de orçamento e estoque são executadas em funções transacionais no banco.
- Não publique tokens administrativos nem contorne as políticas RLS no frontend.
