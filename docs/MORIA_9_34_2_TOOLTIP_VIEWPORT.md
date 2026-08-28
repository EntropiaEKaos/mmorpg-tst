# Mor'ia 9.34.2 — Tooltip viewport safety

## Motivo
A revisão humana da 9.34.1 confirmou o funcionamento do Tooltip e da Barra de Ações, mas revelou que tooltips altos podiam ultrapassar a borda inferior da viewport. O posicionador antigo estimava uma altura fixa de 200 px, enquanto o conteúdo técnico real pode ser muito maior.

## Correção
- o portal mede sua largura e altura reais com `useLayoutEffect`;
- o posicionador tenta a direção preferida, a oposta e depois as direções perpendiculares;
- a posição final é limitada às bordas reais da viewport;
- conteúdo excepcionalmente alto recebe `maxHeight` e rolagem de segurança;
- o QA mede o `boundingBox` real do portal e falha se qualquer borda escapar da viewport.

## Contratos preservados
Nenhuma regra de dano, cooldown, mana, reação elemental, autoridade do servidor ou ação da Barra de Ações foi alterada. Esta correção é estritamente de apresentação e robustez visual.

## Gate
A correção só é aceita depois de typecheck, build, auditorias de segurança, 323 testes do servidor, captura Playwright e revisão humana do novo screenshot da ActionBar.
