CODEX SKILL AGENT — CalculaPrint 3D
Objetivo desta Skill

Esta skill deve orientar o Codex a construir o webapp CalculaPrint 3D de forma fiel ao PRD, sem inventar funcionalidades fora do escopo, sem pular etapas e sem criar partes incompletas.

O Codex deve sempre ler esta skill antes de implementar qualquer arquivo, tela, banco de dados, regra de cálculo ou acabamento visual.

1. Papel do Codex neste Projeto

Você é um agente de desenvolvimento responsável por criar um webapp profissional chamado CalculaPrint 3D.

O sistema será uma calculadora de precificação para serviços de impressão 3D, com controle de:

Usuários;
Clientes;
Filamentos;
Impressoras;
Insumos e embalagens;
Parâmetros globais;
Orçamentos;
Projetos/modelos;
Estoque de peças prontas;
PDF profissional;
Banco de dados Supabase.

Você deve seguir exatamente o PRD fornecido.

Não crie funções aleatórias.

Não simplifique o sistema sem autorização.

Não troque a identidade visual.

Não implemente plano pago nesta primeira versão.

Não implemente upgrade premium.

Não implemente período de teste.

Não implemente limite de uso.

2. Arquivos que você deve ler antes de agir

Antes de qualquer implementação, leia obrigatoriamente:

PRD.md
CODEX_SKILL_AGENT.md

Se algum desses arquivos não existir, crie primeiro a estrutura correta e peça ao usuário para colar o conteúdo do PRD ou da skill.

Antes de escrever código, confirme internamente:

Li o PRD.
Li a Skill Agent.
Entendi o escopo.
Não vou implementar plano pago.
Não vou inventar funcionalidades.
Vou construir o MVP completo gratuito.
3. Regra de Ouro

Sempre que houver dúvida entre:

Inventar;
Supor;
Criar algo diferente;
Pular uma etapa;

A resposta correta é:

Não inventar. Seguir o PRD.

Caso o PRD não tenha uma informação específica, use a solução mais simples, profissional, escalável e compatível com o restante do sistema.

4. Stack obrigatória do projeto

Use preferencialmente:

React
Vite
TypeScript
Tailwind CSS
React Router
React Hook Form
Zod
Supabase
Supabase Auth
Supabase Database
Supabase Storage, se necessário
Lucide React
jsPDF ou React-PDF

Não usar backend próprio inicialmente.

O Supabase será usado como:

Autenticação;
Banco de dados;
Segurança por usuário;
Armazenamento opcional.
5. Identidade visual obrigatória

O visual deve seguir o estilo dos prints de referência:

SaaS moderno;
Menu lateral escuro;
Fundo interno claro;
Cards brancos;
Botões azuis;
Destaques em laranja;
Valores positivos em verde;
Exclusões e erros em vermelho;
Bordas arredondadas;
Sombra suave;
Espaçamento limpo;
Aparência profissional.
Cores base recomendadas
--dark-bg: #050816;
--sidebar-bg: #0F172A;
--card-dark: #111827;
--light-bg: #F5F7FB;
--card-bg: #FFFFFF;
--border: #E2E8F0;
--primary-blue: #2563EB;
--primary-blue-hover: #1D4ED8;
--orange: #F97316;
--orange-hover: #EA580C;
--green: #059669;
--red: #DC2626;
6. Regras de escopo
6.1 Deve implementar

O MVP deve ter:

Landing page;
Cadastro;
Login;
Recuperação de senha;
Layout interno com sidebar;
Proteção de rotas;
Orçamento / calculadora;
Meus orçamentos;
Projetos / modelos;
Estoque;
Meus clientes;
Insumos / custos;
Minha conta;
Geração de PDF;
Supabase Auth;
Supabase Database;
RLS;
Políticas por usuário;
Cálculos reais de impressão 3D;
Controle de reserva e baixa de estoque.
6.2 Não implementar agora

Não criar:

Plano pago;
Upgrade premium;
Período de teste;
Botão premium;
Tela de assinatura;
Checkout;
Stripe;
Mercado Pago;
Limite de orçamentos;
Limite de projetos;
Bloqueio por plano;
Trial de 7 dias;
Banner premium.

Qualquer coisa relacionada a pagamento deve ficar fora do MVP.

7. Regras de arquitetura
7.1 Estrutura de pastas recomendada

Crie uma estrutura organizada:

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
    useSupplies.ts
    useSettings.ts
  lib/
    supabase.ts
    calculations.ts
    formatters.ts
    pdf.ts
    validations.ts
  types/
    database.ts
    budget.ts
    filament.ts
    client.ts
    machine.ts
    supply.ts
  routes/
    AppRoutes.tsx
  styles/
    globals.css
7.2 Componentes reutilizáveis obrigatórios

Criar componentes reutilizáveis:

Button
Input
Select
Textarea
Card
Modal
Sidebar
Header
Badge
Toast
Table
EmptyState
MoneyInput
NumberInput
ConfirmDialog
StatusBadge

Não duplicar layout.

Não criar várias versões diferentes do mesmo botão.

Não deixar páginas com código bagunçado.

8. Regras do Supabase
8.1 Banco de dados

O banco deve ser criado com migrations SQL.

Criar tabelas:

profiles
filaments
filament_movements
machines
supplies
global_settings
clients
project_models
budgets
budget_filaments
budget_supplies
budget_extra_costs
ready_stock

Todas as tabelas que possuem dados do usuário devem ter:

user_id uuid references auth.users(id) not null
8.2 Segurança

Ativar RLS em todas as tabelas.

Cada usuário só pode acessar os próprios dados:

user_id = auth.uid()

A tabela profiles deve usar:

id = auth.uid()
8.3 Regra obrigatória

Nunca criar consulta que retorne dados de todos os usuários.

Toda busca deve filtrar pelo usuário autenticado ou depender das policies do Supabase.

9. Regras de autenticação

Implementar:

Cadastro com nome, e-mail, senha e confirmação;
Login com e-mail e senha;
Recuperação de senha;
Logout;
Proteção de rotas internas;
Criação automática de profile após cadastro.

Após login, redirecionar para:

/app/orcamento

Após logout, redirecionar para:

/login
10. Regras da calculadora

A calculadora deve seguir exatamente as fórmulas do PRD.

10.1 Tempo total em horas
tempoHoras = dias * 24 + horas + minutos / 60 + segundos / 3600
10.2 Quantidade total de peças
quantidadeTotalPecas = pecasPorBandeja * quantidadeBandejas
10.3 Preço por grama do filamento
precoPorGrama = precoPago / (pesoKg * 1000)
10.4 Custo do filamento
custoFilamento = pesoUsadoGramas * precoPorGrama
10.5 Custo de energia
custoEnergia = (consumoWatts / 1000) * tempoHoras * precoKwh
10.6 Custo de manutenção
custoManutencao = manutencaoPorHora * tempoHoras
10.7 Depreciação
depreciacaoPorHora = valorMaquina / vidaUtilHoras
custoDepreciacao = depreciacaoPorHora * tempoHoras
10.8 Custo do serviço
custoServico = custoEnergia + custoManutencao + custoDepreciacao
10.9 Custo base sem falha
custoBaseSemFalha =
  custoTotalFilamentos +
  custoServico +
  custoTotalInsumos +
  custosExtras
10.10 Margem de falha
valorMargemFalha = custoBaseSemFalha * (margemFalhaPercentual / 100)
10.11 Custo total de produção
custoTotalProducao = custoBaseSemFalha + valorMargemFalha
10.12 Lucro bruto
lucroBruto = custoTotalProducao * (markupPercentual / 100)
10.13 Preço antes das taxas
precoAntesTaxas = custoTotalProducao + lucroBruto
10.14 Taxas
valorImpostos = precoAntesTaxas * (impostosPercentual / 100)
valorTaxaCartao = precoAntesTaxas * (taxaCartaoPercentual / 100)
taxasRepasses = valorImpostos + valorTaxaCartao + publicidadeFixa
10.15 Preço sugerido
precoSugerido = precoAntesTaxas + taxasRepasses
10.16 Lucro líquido
lucroLiquido = precoSugerido - custoTotalProducao - taxasRepasses
10.17 Preço por peça
precoPorPeca = precoSugerido / quantidadeTotalPecas
10.18 Lucro líquido por peça
lucroLiquidoPorPeca = lucroLiquido / quantidadeTotalPecas
11. Regras de estoque
11.1 Ao salvar orçamento

Ao salvar orçamento, o sistema deve:

Criar o orçamento;
Criar os itens de filamento usados;
Criar os insumos usados;
Criar custos extras;
Reservar o filamento usado;
Aumentar stock_reserved_g;
Criar movimento do tipo reserva.

Não baixar o estoque real ainda.

11.2 Ao cancelar ou recusar orçamento

O sistema deve:

Remover a reserva;
Reduzir stock_reserved_g;
Criar movimento do tipo cancelamento_reserva;
Alterar status para recusado ou cancelado.
11.3 Ao dar baixa no estoque

O sistema deve:

Reduzir stock_real_g;
Reduzir stock_reserved_g;
Criar movimento do tipo baixa_definitiva;
Alterar status para baixado_estoque.
11.4 Validação

Se o usuário tentar usar mais filamento do que existe livre, exibir:

Estoque insuficiente para este filamento.

Fórmula:

estoqueLivre = stockRealG - stockReservedG
12. Regras das páginas
12.1 Landing Page

Deve ter:

Logo;
Headline forte;
Explicação do sistema;
Cards de recursos;
Passo a passo;
Chamada para ação;
Botão “Começar Grátis”;
Botão “Entrar”.

Não mostrar planos pagos.

12.2 Login

Deve ter:

Visual escuro moderno;
Logo;
Campo e-mail;
Campo senha;
Botão entrar;
Link para cadastro;
Link de recuperar senha.
12.3 Cadastro

Deve ter:

Nome completo;
E-mail;
Senha;
Confirmar senha;
Botão criar conta grátis.
12.4 Orçamento / Calculadora

Deve ter:

Dados do cliente;
Especificações da peça;
Seleção de estoque;
Detalhamento de custos;
Formação de preço;
Botão salvar orçamento;
Botão gerar PDF.
12.5 Meus Orçamentos

Deve ter:

Lista de orçamentos;
Filtro por status;
Busca;
Card ou tabela;
Editar;
Excluir;
Gerar PDF;
Aprovar;
Recusar;
Dar baixa no estoque.
12.6 Projetos

Deve ter:

Criar modelo;
Editar modelo;
Excluir modelo;
Usar modelo em orçamento.
12.7 Estoque

Deve ter:

Total de peças prontas;
Valor parado em estoque;
Adicionar produto pronto;
Editar produto;
Remover produto;
Baixar quantidade vendida.
12.8 Clientes

Deve ter:

Criar cliente;
Editar cliente;
Excluir cliente;
Buscar cliente;
Ver dados de contato;
Ver desempenho básico.
12.9 Insumos / Custos

Deve ter:

Inventário de filamentos;
Máquinas;
Insumos e embalagens;
Parâmetros globais.
12.10 Minha Conta

Deve ter:

Dados do usuário;
Dados da empresa;
Botão salvar dados;
Botão sair.
13. PDF

O PDF deve ser profissional, tamanho A4, com:

Dados da empresa;
Dados do cliente;
Dados do projeto;
Quantidade;
Bico;
Medidas;
Materiais usados;
Valor total;
Valor por unidade;
Termos e condições;
Data;
Validade.

Não mostrar lucro, custo interno, markup ou dados sensíveis no PDF do cliente.

O PDF é para o cliente ver o preço final, não para ver os custos internos.

14. Regras de formatação
14.1 Dinheiro

Mostrar sempre no padrão brasileiro:

R$ 30,58

Internamente salvar como número decimal.

14.2 Peso

Cadastro de filamento pode usar kg.

Uso em orçamento deve usar gramas.

Conversão:

1 kg = 1000 g
500 g = 0,5 kg
250 g = 0,25 kg
10 g = 0,01 kg
1 g = 0,001 kg
14.3 Data

Mostrar no padrão:

18/06/2026
15. Regras de qualidade

Antes de encerrar qualquer fase, o Codex deve verificar:

Não existem erros TypeScript;
Não existem imports quebrados;
Não existem telas brancas;
Rotas estão funcionando;
Botões principais funcionam;
Layout está responsivo;
Cálculos batem com as fórmulas;
Supabase está configurado;
RLS está ativado;
Não há plano pago visível;
PDF funciona;
Estoque reserva e baixa corretamente.
16. Proibido fazer

Não fazer:

Código solto sem organização;
Componentes duplicados;
SQL sem RLS;
Cálculo aproximado inventado;
Tela premium;
Botão upgrade;
Texto de período gratuito;
Dados mockados permanentes;
Salvar tudo no localStorage;
Ignorar Supabase;
Criar backend paralelo;
Expor dados de outro usuário;
Mostrar custos internos no PDF do cliente;
Finalizar fase com erro no build.
17. Definição de pronto

Uma fase só está pronta quando:

O código foi criado;
O código foi revisado;
O build passa;
A tela abre;
Os dados salvam no Supabase quando aplicável;
Os cálculos funcionam quando aplicável;
O layout está coerente;
Não há funcionalidade premium;
O resultado respeita o PRD.
18. Comportamento esperado do Codex

Sempre responder no final de cada fase com:

Fase concluída.
Arquivos criados/alterados:
- arquivo 1
- arquivo 2

O que foi implementado:
- item 1
- item 2

Pendências:
- nenhuma

Se houver erro, responder:

Fase não concluída.
Erro encontrado:
- descrição do erro

Como corrigir:
- instrução objetiva