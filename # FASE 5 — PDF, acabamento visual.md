# FASE 5 — PDF, acabamento visual, responsividade, testes finais e entrega

## Comando para o Codex

```md
Leia novamente PRD.md e CODEX_SKILL_AGENT.md antes de iniciar.

Nesta fase, finalize o sistema com PDF, acabamento visual, responsividade e testes.

Implemente ou finalize:

1. Geração de PDF profissional:
   - Tamanho A4
   - Dados da empresa
   - Dados do cliente
   - Dados do projeto
   - Quantidade
   - Bico
   - Medidas
   - Materiais usados
   - Valor total
   - Valor por unidade
   - Termos e condições
   - Data
   - Validade
   - Visual limpo
   - Cards com borda
   - Valor final em destaque

2. Não mostrar no PDF:
   - Custo interno
   - Lucro
   - Markup
   - Depreciação
   - Taxas internas
   - Margem de falha

3. Acabamento visual:
   - Ajustar espaçamentos
   - Padronizar botões
   - Padronizar cards
   - Padronizar tabelas
   - Padronizar modais
   - Corrigir responsividade
   - Melhorar mobile
   - Melhorar sidebar
   - Melhorar estados vazios

4. Feedbacks:
   - Loading
   - Toast de sucesso
   - Toast de erro
   - Confirmação antes de excluir
   - Mensagem de estoque insuficiente
   - Mensagem de orçamento salvo
   - Mensagem de PDF gerado

5. Testes manuais completos:
   - Cadastro
   - Login
   - Logout
   - Recuperação de senha
   - Cadastro de filamento
   - Cadastro de máquina
   - Cadastro de insumo
   - Configuração global
   - Cadastro de cliente
   - Criar orçamento
   - Salvar orçamento
   - Gerar PDF
   - Aprovar orçamento
   - Recusar orçamento
   - Dar baixa no estoque
   - Criar projeto modelo
   - Usar projeto modelo
   - Adicionar produto pronto
   - Editar minha conta

6. Limpeza:
   - Remover console.log desnecessário
   - Remover código morto
   - Remover mocks
   - Remover qualquer botão premium
   - Remover qualquer texto de trial
   - Remover qualquer plano pago
   - Garantir que o sistema é gratuito

7. Criar documentação final:
   - README.md
   - Como configurar Supabase
   - Como rodar localmente
   - Como aplicar migrations
   - Como configurar .env
   - Como fazer build

Regras obrigatórias:

- O build final deve passar.
- Não pode haver tela quebrada.
- Não pode haver erro TypeScript.
- Não pode haver botão sem função principal.
- Não pode aparecer plano pago.
- Não pode aparecer período de teste.
- Não pode aparecer upgrade premium.
- O PDF precisa ser gerado corretamente.
- O app precisa estar pronto para deploy.

No final, entregue um relatório com:

1. Arquivos principais criados.
2. Como configurar o Supabase.
3. Como rodar o projeto.
4. Como testar o fluxo principal.
5. Pendências, se existirem.
Resultado esperado da Fase 5

Ao final desta fase, o webapp deve estar completo para uso inicial:

Visual profissional;
Banco Supabase funcionando;
Login funcionando;
Cadastros funcionando;
Calculadora funcionando;
Estoque funcionando;
PDF funcionando;
Responsivo;
Sem premium;
Sem trial;
Sem limite artificial;
Pronto para deploy.
CHECKLIST FINAL DO WEBAPP

Antes de considerar o projeto finalizado, conferir:

Geral

App roda localmente.

Build passa sem erro.

Não há tela branca.

Não há imports quebrados.

Não há console.log desnecessário.

Não há função premium.

Não há botão de upgrade.

Não há período de teste.

Supabase

Supabase conectado.

.env configurado.

Tabelas criadas.

RLS ativado.

Policies criadas.

Usuário só acessa seus dados.

Profile criado automaticamente.

Autenticação

Cadastro funciona.

Login funciona.

Logout funciona.

Recuperação de senha funciona.

Rotas internas protegidas.

Insumos / Custos

Cadastra filamento.

Calcula preço por grama.

Cadastra máquina.

Cadastra insumo.

Salva parâmetros globais.

Mostra estoque real.

Mostra reservado.

Mostra livre para uso.

Calculadora

Calcula filamento.

Calcula energia.

Calcula manutenção.

Calcula depreciação.

Calcula margem de falha.

Calcula markup.

Calcula taxas.

Calcula preço sugerido.

Calcula lucro líquido.

Calcula preço por peça.

Não gera NaN.

Não divide por zero.

Orçamentos

Salva orçamento.

Lista orçamento.

Filtra por status.

Edita orçamento.

Exclui com confirmação.

Aprova orçamento.

Recusa orçamento.

Dá baixa no estoque.

Reserva estoque ao salvar.

PDF

Gera PDF em A4.

Mostra dados do cliente.

Mostra dados do projeto.

Mostra valor total.

Mostra valor unitário.

Mostra termos.

Não mostra lucro.

Não mostra custo interno.

Clientes

Cria cliente.

Edita cliente.

Exclui cliente.

Busca cliente.

Usa cliente no orçamento.

Projetos

Cria modelo.

Edita modelo.

Exclui modelo.

Usa modelo no orçamento.

Estoque

Mostra peças prontas.

Calcula valor parado.

Adiciona produto.

Edita produto.

Remove produto.

Baixa quantidade vendida.

Minha Conta

Mostra usuário.

Salva dados da empresa.

Dados aparecem no PDF.

Logout funciona.

PROMPT MESTRE PARA USAR NO CODEX

Use este prompt sempre que iniciar uma nova fase:

Você está trabalhando no projeto CalculaPrint 3D.

Antes de agir, leia:

1. PRD.md
2. CODEX_SKILL_AGENT.md

Siga exatamente o PRD e a Skill Agent.

Não invente funcionalidades.
Não implemente plano pago.
Não implemente premium.
Não implemente período de teste.
Não implemente limite gratuito.
Não pule etapas.
Não deixe botão sem função.
Não finalize com erro de build.

Execute apenas a fase solicitada.
Ao final, explique objetivamente o que foi feito, quais arquivos foram criados ou alterados e se existe alguma pendência.