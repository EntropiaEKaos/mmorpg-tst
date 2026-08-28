# Mor'ia 9.33 — Itens, Depósito, Leilões e Coin Shop em PT-BR

## Objetivo

Fechar a camada visual e textual do bloco de itens/economia sem alterar regras de inventário, persistência de depósito, escrow de leilão ou consumo de moedas.

## Escopo

- Inventário: textos residuais de encaixes, raridade, instruções de uso/drag-and-drop, loja embutida e conteúdo dinâmico.
- Depósito: cabeçalho, capacidade, instruções, aviso de lotação, saldo bancário e acessibilidade.
- Casa de Leilões: navegação, busca, filtros, anúncios, vendedores, raridades, compra/cancelamento e formulário de venda.
- Coin Shop: categorias, saldo, estados de roadmap, itens/descrições, insuficiência de saldo e concessão demo.
- Conteúdo econômico dinâmico: nomes de vendedores e itens de seed do leilão, além dos itens atuais da Coin Shop.

## Contratos preservados

- Nenhum ID de item ou listing foi alterado.
- `moria_auction_house` continua usando o mesmo formato persistido.
- A lógica de escrow/cancelamento/compra do leilão não foi modificada.
- O Depósito mantém `tibia_depot_<player>` e limite atual de 40 slots.
- A Coin Shop continua permitindo gasto apenas no efeito já suportado (`allblessings`); itens de roadmap continuam não compráveis.
- Nenhum custo, preço, recompensa ou efeito foi rebalanceado nesta versão.

## Visual QA

A página isolada de QA renderiza os componentes React reais com fixtures determinísticas. O gate gera e publica quatro PNGs:

- `inventory.png`
- `depot.png`
- `auction.png`
- `coinshop.png`

O script de captura reprova rótulos ingleses críticos antes de salvar os screenshots.

## Critério de aceite

1. auditoria PT-BR;
2. `npm audit` do cliente e servidor;
3. typecheck + build;
4. check + suíte completa do servidor;
5. Playwright estável + audit;
6. quatro screenshots reais sem vazamentos críticos;
7. revisão humana dos PNGs antes de avançar.

## Próximo bloco sugerido

9.34: Bank/Skills/Spellbook/Training + revisão de Tooltips, seguida por uma rodada de screenshots de gameplay em resolução desktop e compacta.
