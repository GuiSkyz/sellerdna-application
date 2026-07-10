---
target: frontend/src/app/(dashboard)/products/page.tsx
total_score: 22
p0_count: 1
p1_count: 3
timestamp: 2026-07-09T22:00:04Z
slug: frontend-src-app-dashboard-products-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Modal de edição em massa exibe spinner, mas o feedback depende de alertas nativos |
| 2 | Match System / Real World | 3/4 | Terminologia clara, mas faltavam atributos chave do ecossistema e-commerce e Mercado Livre |
| 3 | User Control and Freedom | 2/4 | Apenas 3 campos editáveis em massa (preço, estoque e categoria ML), impedindo criação completa de anúncios |
| 4 | Consistency and Standards | 3/4 | Padrão visual consistente com o restante da aplicação |
| 5 | Error Prevention | 3/4 | Valida seleção de pelo menos 1 campo antes de enviar |
| 6 | Recognition Rather Than Recall | 2/4 | Campos misturados em lista simples sem categorização visual estilo ERP |
| 7 | Flexibility and Efficiency | 1/4 | Poder restrito na edição em massa: vendedor precisaria abrir produto a produto para preencher GTIN, NCM, Marca, Garantia ou Tipo de Anúncio |
| 8 | Aesthetic and Minimalist Design | 3/4 | Interface funcional, mas sem a ergonomia de abas ou seções agrupadas de um ERP profissional |
| 9 | Error Recovery | 1/4 | Mensagens de erro em `alert()` nativo do navegador |
| 10 | Help and Documentation | 1/4 | Falta explicação de campos obrigatórios para publicação no Mercado Livre |
| **Total** | | **22/40** | **Necessita Upgrade Estrutural (Inspirado no Tiny ERP)** |

## Anti-Patterns Verdict

**LLM assessment**: A edição em massa anterior funcionava apenas como um "ajuste rápido de estoque e preço", deixando de lado a complexidade real da operação de e-commerce e Mercado Livre. Para criar um anúncio de alta conversão sem rejeição da API do Mercado Livre, o produto precisa de atributos estruturais completos (GTIN/EAN, NCM, Marca, Tipo de Anúncio Clássico/Premium, Condição, Garantia e especificações técnicas).

## Priority Issues & Tiny ERP Inspiration
- **[P0] Ausência de Atributos Necessários para Anúncio no ML**:
  - *Problema*: Vendedores que utilizam edição em massa precisam preparar o catálogo para publicação imediata. Ter apenas Preço, Estoque e Categoria impede o fluxo.
  - *Solução (Inspirado no Tiny ERP)*: Expandir a Edição em Massa para contemplar **todos os atributos essenciais de anúncio**:
    1. **Comercial & Estoque**: Preço de Venda (R$) e Quantidade em Estoque.
    2. **Anúncio Mercado Livre**: Categoria ML (MLB), Tipo de Anúncio (Clássico `gold_special` / Premium `gold_pro`) e Condição (Novo / Usado).
    3. **Fiscal & Identificação**: Marca, GTIN/EAN e NCM.
    4. **Especificações & Garantia**: Tipo de Perfume, Gênero, Volume (ml), Tipo de Garantia e Tempo de Garantia.
- **[P1] Categorização Ergonomicamente Organizada (Abas/Seções)**:
  - *Solução*: Agrupar os campos em abas ou cards categorizados com toggles individuais (checkbox por campo), com contador de campos ativos.
