# CODEX_SKILL_AGENT_V2 — CalculaPrint 3D

## 1. Objetivo desta Skill V2

Esta Skill orienta o Codex a implementar a **V2 do CalculaPrint 3D** com segurança, sem quebrar o sistema atual.

A V2 adiciona:

* Catálogo público na landing page;
* Administração interna do catálogo;
* Upload de imagens com Supabase Storage;
* Buckets `catalog-products` e `company-assets`;
* Gerenciamento de vendas;
* Gerenciamento de consignação;
* Integração com estoque de produtos prontos;
* Controle de pagos, não pagos e parcialmente pagos.

A implementação deve ser incremental.

Não recriar o projeto do zero.

Não quebrar o que já está pronto.

---

# 2. Arquivos obrigatórios para leitura

Antes de qualquer alteração, leia obrigatoriamente:

```txt
PRD.md
PRD_V2.md
CODEX_SKILL_AGENT.md
CODEX_SKILL_AGENT_V2.md
```

## Função de cada arquivo

### `PRD.md`

Documento da V1.

Contém o sistema atual já validado:

* Calculadora;
* Orçamentos;
* Estoque;
* Clientes;
* Insumos;
* Máquinas;
* PDF;
* Autenticação;
* Supabase;
* RLS.

### `PRD_V2.md`

Documento da atualização.

Contém apenas a ampliação:

* Catálogo;
* Storage;
* Vendas;
* Consignação;
* Ajustes no estoque pronto.

### `CODEX_SKILL_AGENT.md`

Skill original.

Mantém as regras gerais do sistema.

### `CODEX_SKILL_AGENT_V2.md`

Esta skill.

Define como implementar a V2 sem danificar a V1.

---

# 3. Regra principal da V2

A V2 deve ser feita como atualização incremental.

O Codex deve sempre preservar o sistema existente.

## Proibido

Não fazer:

* Recriar o projeto do zero;
* Apagar arquivos funcionais;
* Apagar tabelas existentes;
* Apagar dados existentes;
* Remover campos existentes;
* Reescrever a calculadora;
* Alterar fórmulas já validadas;
* Quebrar login;
* Quebrar rotas protegidas;
* Quebrar Supabase Auth;
* Quebrar RLS;
* Quebrar PDF;
* Quebrar orçamentos;
* Quebrar estoque atual;
* Criar plano pago;
* Criar premium;
* Criar trial;
* Criar limite gratuito;
* Criar checkout;
* Criar assinatura.

## Permitido

Pode fazer:

* Criar novas migrations;
* Adicionar novas colunas;
* Criar novas tabelas;
* Criar novos hooks;
* Criar novos componentes;
* Criar novas rotas;
* Criar novos buckets;
* Atualizar menu lateral;
* Ajustar landing page para catálogo;
* Integrar estoque com vendas e consignação.

---

# 4. Confirmação interna antes de codar

Antes de implementar qualquer fase, confirme internamente:

```txt
Li o PRD.md.
Li o PRD_V2.md.
Li a Skill original.
Li a Skill V2.
Entendi que a V2 é incremental.
Não vou apagar nem quebrar a V1.
Não vou implementar premium, trial ou plano pago.
Vou executar somente a fase solicitada.
```

---

# 5. Stack obrigatória

Manter a stack atual do projeto.

Usar:

```txt
React
Vite
TypeScript
Tailwind CSS
React Router
Supabase
Supabase Auth
Supabase Database
Supabase Storage
Lucide React
React Hook Form
Zod
```

Não criar backend próprio.

Não substituir Supabase.

Não salvar imagens no banco em base64.

Não usar localStorage como banco de dados.

---

# 6. Regra de banco de dados

Todas as alterações da V2 devem ser feitas por **migration incremental**.

## Obrigatório

* Usar `alter table ... add column if not exists`;
* Usar `create table if not exists`;
* Não usar `drop table`;
* Não usar `truncate`;
* Não apagar dados;
* Não remover colunas antigas;
* Não recriar tabelas existentes;
* Preservar a tabela `ready_stock`;
* Preservar a coluna antiga `quantity`, se existir;
* Preencher `quantity_internal` com `quantity` quando necessário.

---

# 7. Novas tabelas da V2

Criar somente se ainda não existirem:

```txt
ready_stock_movements
sales
sale_items
consignments
consignment_items
consignment_payments
```

Essas tabelas devem ter:

```txt
user_id uuid references auth.users(id) on delete cascade not null
```

---

# 8. Atualizações em tabelas existentes

## 8.1 `clients`

Adicionar:

```txt
client_type
```

Valores:

```txt
cliente
consignatario
ambos
```

Valor padrão:

```txt
cliente
```

---

## 8.2 `profiles`

Adicionar:

```txt
company_logo_url
company_logo_path
```

---

## 8.3 `ready_stock`

Adicionar campos necessários para:

* Catálogo;
* Imagens;
* Venda direta;
* Consignação;
* Controle de quantidades.

Campos principais:

```txt
internal_code
public_code
category
public_name
public_description
catalog_image_1_url
catalog_image_1_path
catalog_image_2_url
catalog_image_2_path
is_catalog_visible
direct_sale_price
consignment_price
quantity_internal
quantity_consigned
quantity_sold
status
```

Não remover o campo `quantity` antigo.

---

# 9. RLS e segurança

Todas as novas tabelas devem ter RLS ativado.

```txt
ready_stock_movements
sales
sale_items
consignments
consignment_items
consignment_payments
```

## Regra padrão

Cada usuário só pode acessar dados onde:

```sql
user_id = auth.uid()
```

Criar policies para:

* Select;
* Insert;
* Update;
* Delete.

## Importante

Não criar policy aberta permitindo qualquer usuário ver tudo.

Não criar policy `true` em tabela privada.

A única leitura pública permitida é para dados seguros do catálogo público.

---

# 10. View pública do catálogo

Criar ou atualizar a view:

```txt
public_catalog_view
```

A view deve expor somente dados seguros.

Campos permitidos:

```txt
id
user_id
public_code
public_name
public_description
category
catalog_image_1_url
catalog_image_2_url
is_catalog_visible
created_at
```

## Proibido expor na view pública

Não expor:

* Preço;
* Custo;
* Lucro;
* Quantidade interna;
* Quantidade vendida;
* Quantidade consignada;
* Dados de vendas;
* Dados de clientes;
* Dados de orçamento;
* Dados privados.

A página pública deve ler preferencialmente essa view, não a tabela completa `ready_stock`.

---

# 11. Supabase Storage

## 11.1 Buckets obrigatórios

Criar os buckets:

```txt
catalog-products
company-assets
```

## 11.2 Bucket `catalog-products`

Uso:

* Imagens dos produtos do catálogo;
* Imagens das peças prontas.

Estrutura obrigatória:

```txt
catalog-products/{user_id}/{product_code}/image-1.webp
catalog-products/{user_id}/{product_code}/image-2.webp
```

## 11.3 Bucket `company-assets`

Uso:

* Logo da empresa;
* Imagem institucional;
* Logo para PDF;
* Logo para página pública.

Estrutura obrigatória:

```txt
company-assets/{user_id}/logo.webp
```

---

# 12. Regras de Storage

## 12.1 Leitura

As imagens podem ter leitura pública.

Visitantes sem login podem visualizar:

* Imagens dos produtos públicos;
* Logo da empresa, se usada publicamente.

## 12.2 Upload

Somente usuário logado pode fazer upload.

O usuário só pode enviar arquivos dentro da própria pasta:

```txt
{user_id}/...
```

## 12.3 Atualização

Somente o dono pode substituir arquivos da própria pasta.

## 12.4 Exclusão

Somente o dono pode excluir arquivos da própria pasta.

---

# 13. Regras de upload de imagens

## 13.1 Formatos permitidos

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

## 13.2 Tamanho máximo

Produto:

```txt
2 MB por imagem
```

Logo:

```txt
1 MB
```

## 13.3 Limite por produto

Cada produto pode ter no máximo:

```txt
2 imagens
```

Não permitir terceira imagem.

## 13.4 Validação antes de publicar

Um produto só pode ser publicado no catálogo se tiver:

* Código público;
* Nome público;
* Descrição pública;
* Imagem principal;
* `is_catalog_visible = true`.

Mensagem de erro sugerida:

```txt
Para publicar este produto, adicione código, nome, descrição e imagem principal.
```

---

# 14. Funções obrigatórias de Storage

Criar ou atualizar:

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

As funções devem validar:

* Usuário logado;
* Arquivo existente;
* Tipo permitido;
* Tamanho máximo;
* Caminho correto;
* Posição da imagem igual a 1 ou 2.

---

# 15. Landing page pública

A rota `/` deve se tornar o catálogo público.

A página deve ter:

* Header;
* Logo ou nome da empresa;
* Botão “Entrar”;
* Banner principal;
* Grid de produtos;
* Cards de produtos;
* Botão “Consultar Produto”;
* Rodapé.

## Produto público deve mostrar

* Imagem principal;
* Segunda imagem opcional;
* Código;
* Nome;
* Descrição;
* Categoria;
* Botão de consulta.

## Produto público não pode mostrar

* Preço;
* Custo;
* Lucro;
* Markup;
* Quantidade;
* Estoque interno;
* Dados privados;
* Botão editar;
* Botão excluir.

---

# 16. Página interna de catálogo

Criar rota:

```txt
/app/catalogo
```

Adicionar no menu lateral:

```txt
Catálogo
```

A página deve permitir:

* Criar produto de catálogo;
* Editar produto;
* Publicar produto;
* Ocultar produto;
* Excluir produto com confirmação;
* Vincular produto ao estoque pronto;
* Upload da imagem 1;
* Upload da imagem 2;
* Substituir imagem;
* Remover imagem;
* Visualizar prévia;
* Copiar código do produto.

---

# 17. Página de vendas

Criar rota:

```txt
/app/vendas
```

Adicionar no menu lateral:

```txt
Vendas
```

## 17.1 Tipos de venda

```txt
venda_direta
venda_orcamento
```

## 17.2 Status de pagamento

```txt
pago
nao_pago
parcialmente_pago
cancelado
```

## 17.3 Status de entrega

```txt
pendente
entregue
retirado
enviado
cancelado
```

## 17.4 Formas de pagamento

```txt
dinheiro
pix
cartao_credito
cartao_debito
transferencia
outro
```

---

# 18. Regras de cálculo de vendas

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

Nunca permitir:

* Valor total negativo;
* Valor pago negativo;
* Valor em aberto NaN;
* Quantidade menor ou igual a zero.

---

# 19. Sincronização de vendas com estoque

Ao registrar venda direta:

* Reduzir `quantity_internal`;
* Aumentar `quantity_sold`;
* Criar registro em `sales`;
* Criar registro em `sale_items`;
* Criar movimentação `saida_venda`.

Ao cancelar venda:

* Devolver quantidade para `quantity_internal`;
* Reduzir `quantity_sold`;
* Alterar venda para `cancelado`;
* Criar movimentação `cancelamento_venda`.

Não baixar estoque duas vezes.

Não devolver estoque duas vezes.

Usar confirmação antes de cancelar venda.

---

# 20. Página de consignação

Criar rota:

```txt
/app/consignacao
```

Adicionar no menu lateral:

```txt
Consignação
```

A página deve controlar:

* Lotes de consignação;
* Consignatário;
* Produtos enviados;
* Quantidade enviada;
* Quantidade vendida;
* Quantidade devolvida;
* Quantidade restante;
* Valor consignado;
* Valor vendido;
* Valor pago;
* Valor em aberto;
* Status do lote;
* Status dos itens.

---

# 21. Regras de cálculo da consignação

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

Nunca permitir:

* Quantidade enviada menor ou igual a zero;
* Quantidade vendida maior que quantidade disponível;
* Quantidade devolvida maior que quantidade restante;
* Valor pago negativo;
* Valor em aberto NaN;
* Estoque negativo.

---

# 22. Status da consignação

## 22.1 Status do lote

```txt
em_consignacao
parcialmente_vendido
vendido_nao_pago
vendido_pago
parcialmente_pago
finalizado
cancelado
```

## 22.2 Status do item

```txt
em_consignacao
vendido_nao_pago
vendido_pago
parcialmente_pago
devolvido
finalizado
```

---

# 23. Sincronização da consignação com estoque

## 23.1 Ao criar lote

O sistema deve:

* Reduzir `quantity_internal`;
* Aumentar `quantity_consigned`;
* Criar lote em `consignments`;
* Criar itens em `consignment_items`;
* Criar movimentação `saida_consignacao`.

## 23.2 Ao registrar devolução

O sistema deve:

* Aumentar `quantity_internal`;
* Reduzir `quantity_consigned`;
* Aumentar `quantity_returned`;
* Recalcular `quantity_remaining`;
* Criar movimentação `devolucao_consignacao`.

## 23.3 Ao registrar venda consignada

O sistema deve:

* Reduzir `quantity_consigned`;
* Aumentar `quantity_sold`;
* Aumentar `quantity_sold` no item de consignação;
* Recalcular `quantity_remaining`;
* Atualizar valores vendidos;
* Não devolver peça para estoque;
* Não criar venda direta duplicada, a menos que isso seja explicitamente solicitado em fase futura.

## 23.4 Ao registrar pagamento

O sistema deve:

* Aumentar `paid_value`;
* Recalcular `open_value`;
* Atualizar status do item;
* Atualizar status do lote.

---

# 24. Estoque pronto atualizado

A página `/app/estoque` deve continuar funcionando.

Adicionar indicadores sem quebrar o que já existe:

* Total de peças em estoque interno;
* Total de peças em consignação;
* Total de peças vendidas;
* Valor parado em estoque;
* Valor em consignação;
* Valor vendido não pago.

Adicionar ou exibir histórico de movimentações quando possível.

Não remover funcionalidades antigas do estoque.

---

# 25. Componentes novos ou atualizados

Criar quando necessário:

```txt
ProductCatalogCard
ProductImageUploader
CatalogProductForm
PublicCatalogGrid
SaleForm
SaleCard
SaleStatusBadge
ConsignmentForm
ConsignmentItemTable
ConsignmentStatusBadge
StockMovementTable
PaymentStatusBadge
```

Reaproveitar componentes existentes sempre que possível.

Não duplicar componentes sem necessidade.

---

# 26. Hooks novos

Criar quando necessário:

```txt
useCatalog
useStorage
useSales
useConsignments
useReadyStockMovements
```

Manter padrão dos hooks já existentes.

Não misturar toda a lógica dentro das páginas.

---

# 27. Arquivos utilitários novos

Criar ou atualizar:

```txt
src/lib/storage.ts
src/lib/salesCalculations.ts
src/lib/consignmentCalculations.ts
src/lib/stockMovements.ts
```

---

# 28. Regras de interface

Manter visual compatível com o sistema atual:

* SaaS moderno;
* Sidebar escura;
* Cards brancos;
* Botões azuis;
* Destaques em laranja;
* Status positivos em verde;
* Erros em vermelho;
* Bordas arredondadas;
* Responsivo;
* Limpo;
* Profissional.

Não criar um visual completamente diferente.

---

# 29. Feedbacks obrigatórios

Toda ação importante deve ter feedback:

* Loading;
* Sucesso;
* Erro;
* Confirmação antes de excluir;
* Confirmação antes de cancelar venda;
* Confirmação antes de devolver estoque;
* Confirmação antes de ocultar produto público;
* Mensagem de estoque insuficiente;
* Mensagem de upload concluído;
* Mensagem de imagem removida.

---

# 30. Validações obrigatórias

Validar:

* Campos obrigatórios;
* Estoque suficiente;
* Quantidade maior que zero;
* Valor monetário válido;
* Upload com arquivo permitido;
* Máximo de 2 imagens;
* Produto público com imagem principal;
* Produto público sem preço visível;
* Venda sem estoque negativo;
* Consignação sem estoque negativo;
* Pagamento sem valor negativo.

---

# 31. Testes obrigatórios por fase

Antes de concluir qualquer fase, testar:

* Build;
* TypeScript;
* Rotas;
* Login;
* RLS;
* Página não quebra;
* Dados antigos continuam funcionando;
* Nenhum item premium apareceu;
* Nenhum preço apareceu no catálogo público;
* Nenhum custo interno apareceu publicamente.

---

# 32. Definição de pronto da V2

A V2 estará pronta quando:

* Catálogo público funcionar sem login;
* Produtos ocultos não aparecerem publicamente;
* Upload de imagens funcionar;
* Buckets existirem;
* Policies de Storage funcionarem;
* Vendas funcionarem;
* Vendas baixarem estoque;
* Venda cancelada devolver estoque;
* Consignação funcionar;
* Consignação baixar estoque;
* Devolução retornar estoque;
* Venda consignada não retornar estoque;
* Pagamentos atualizarem aberto/pago;
* Indicadores funcionarem;
* RLS proteger dados privados;
* O sistema antigo continuar funcionando.

---

# 33. Formato de resposta do Codex ao final de cada fase

Ao terminar uma fase, responder assim:

```txt
Fase concluída.

Arquivos criados/alterados:
- arquivo 1
- arquivo 2

Banco de dados:
- migration criada/alterada
- tabelas/colunas adicionadas
- policies aplicadas

O que foi implementado:
- item 1
- item 2

Testes executados:
- build
- TypeScript
- fluxo testado

Pendências:
- nenhuma
```

Se houver erro:

```txt
Fase não concluída.

Erro encontrado:
- descrição do erro

Arquivos impactados:
- arquivo 1

Como corrigir:
- ação objetiva
```

---

# 34. Regra final

A prioridade da V2 é:

```txt
Ampliar sem quebrar.
Proteger dados.
Não expor preço no catálogo público.
Controlar estoque corretamente.
Controlar pagos e não pagos.
Controlar consignação com clareza.
Manter o sistema gratuito.
```
