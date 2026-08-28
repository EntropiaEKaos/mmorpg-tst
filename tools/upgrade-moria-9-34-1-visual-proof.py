from pathlib import Path
import json

CATALOG = Path('src/i18n/pt-BR.928.json')
catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
catalog['You have'] = 'Você tem'
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')

visual = Path('src/visualQa.tsx')
text = visual.read_text(encoding='utf-8')
anchor = "  localStorage.removeItem('moria_mail_Aurora');\n"
addition = "  localStorage.removeItem('moria_mail_Aurora');\n  // Deterministic HUD position for screenshot proof. This only affects visual-qa.html.\n  localStorage.setItem('moria:hud:action-bar:position', JSON.stringify({ x: 220, y: 820 }));\n"
if addition not in text:
    if anchor not in text:
        raise SystemExit('visual QA seed anchor not found')
    text = text.replace(anchor, addition, 1)
visual.write_text(text, encoding='utf-8')

tooltip = Path('src/components/Tooltip.tsx')
text = tooltip.read_text(encoding='utf-8')
old_enter = """  const handleEnter = useCallback(() => {
    if (disabled) return;
    timerRef.current = setTimeout(() => {
"""
new_enter = """  const handleEnter = useCallback(() => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
"""
if new_enter not in text:
    if old_enter not in text:
        raise SystemExit('Tooltip enter anchor not found')
    text = text.replace(old_enter, new_enter, 1)
old_events = """      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className=\"inline-flex\"
"""
new_events = """      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onFocusCapture={handleEnter}
      onBlurCapture={handleLeave}
      data-tooltip-trigger=\"true\"
      className=\"inline-flex\"
"""
if new_events not in text:
    if old_events not in text:
        raise SystemExit('Tooltip event anchor not found')
    text = text.replace(old_events, new_events, 1)
tooltip.write_text(text, encoding='utf-8')

capture = Path('tools/capture-moria-9-34.mjs')
text = capture.read_text(encoding='utf-8')
text = text.replace(
    "talents: ['TALENT TREE', 'Points:', 'Reset (500', 'Requires:', 'MAXED', 'TIER 1', 'talent point(s)'],",
    "talents: ['TALENT TREE', 'Points:', 'Reset (500', 'Requires:', 'MAXED', 'TIER 1', 'talent point(s)', 'You have'],",
)
old_action = """  if (panel === 'actionbar') {
    await page.locator('[data-qa-actionbar] .moria-hotbar-slot').first().hover();
    await page.waitForTimeout(260);
  } else if (panel === 'castbar') {
"""
new_action = """  if (panel === 'actionbar') {
    const hud = page.locator('[data-hud-window=\"action-bar\"]');
    await hud.waitFor({ state: 'visible' });
    const box = await hud.boundingBox();
    if (!box || box.width < 500 || box.height < 60 || box.x < 0 || box.y < 0 || box.x + box.width > 1440 || box.y + box.height > 1000) {
      throw new Error(`Mor'ia 9.34 Action Bar is not visibly framed: ${JSON.stringify(box)}`);
    }
    const hudText = await hud.innerText();
    const normalizedHudText = hudText.toLocaleUpperCase('pt-BR');
    if (!normalizedHudText.includes('BARRA DE AÇÕES')) throw new Error(`Mor'ia 9.34 Action Bar title missing: ${hudText}`);
    const spellSlot = page.locator('[data-qa-actionbar] .moria-hotbar-slot').first();
    const tooltipTrigger = spellSlot.locator('..');
    const triggerClass = await tooltipTrigger.getAttribute('class');
    const triggerQa = await tooltipTrigger.getAttribute('data-tooltip-trigger');
    if (!triggerClass?.includes('inline-flex') || triggerQa !== 'true') throw new Error(`Mor'ia 9.34 tooltip trigger wrapper not found: ${triggerClass} / ${triggerQa}`);
    if (await spellSlot.isDisabled()) throw new Error("Mor'ia 9.34 spell proof slot is unexpectedly disabled");
    await spellSlot.focus();
    const focused = await spellSlot.evaluate((node) => node === document.activeElement);
    if (!focused) throw new Error("Mor'ia 9.34 spell proof slot did not receive focus");
    await page.locator('#__global_tooltip_root__ > div').waitFor({ state: 'visible', timeout: 3000 });
    await page.waitForTimeout(180);
    const tooltipText = await page.locator('#__global_tooltip_root__').innerText();
    for (const required of ['Fúria', 'Atalho:', 'Custo de Mana:', 'Recarga:', 'Combos reativos']) {
      if (!tooltipText.includes(required)) throw new Error(`Mor'ia 9.34 Action Bar tooltip missing ${required}: ${tooltipText}`);
    }
  } else if (panel === 'castbar') {
"""
if new_action not in text:
    if old_action not in text:
        raise SystemExit('capture Action Bar anchor not found')
    text = text.replace(old_action, new_action, 1)
capture.write_text(text, encoding='utf-8')

Path('docs/MORIA_9_34_1_VISUAL_PROOF.md').write_text("""# Mor'ia 9.34.1 — Visual Proof Hardening

## Motivo

A inspeção humana da primeira captura 9.34 encontrou dois problemas que o gate textual não detectou:

1. a Árvore de Talentos ainda exibia `You have` em inglês;
2. `actionbar.png` podia ser aceito mesmo com a barra fora do enquadramento visível.

Durante o endurecimento do gate, a automação também expôs fragilidade na ativação do tooltip quando o foco ocorre em um controle filho.

## Correções

- adiciona `You have -> Você tem` ao catálogo PT-BR;
- fixa uma posição determinística da Action Bar apenas no `visual-qa.html`;
- o capturador exige que a janela `action-bar` tenha dimensões reais e esteja completamente dentro da viewport 1440x1000;
- o capturador valida o título `Barra de Ações` sem depender da capitalização visual aplicada pelo CSS;
- o Tooltip real usa `pointerenter/pointerleave` e `focus/blur` em fase de captura, garantindo a ativação quando o foco está no botão filho e melhorando suporte a teclado/pen;
- agendamentos de tooltip anteriores são cancelados antes de um novo timer, evitando timers concorrentes;
- wrappers reais recebem `data-tooltip-trigger=\"true\"` para QA estrutural sem alterar regras de jogo;
- a prova visual confirma que o slot está habilitado, recebe foco real, aguarda o portal visível e exige: `Fúria`, `Atalho:`, `Custo de Mana:`, `Recarga:` e `Combos reativos`;
- adiciona `You have` à lista de vazamentos proibidos do print de Talentos.

## Escopo

Nenhuma regra de combate, cooldown, dano, progressão, talento, item ou autoridade do servidor é alterada. A mudança é de apresentação, acessibilidade de interação e qualidade da prova visual.

## Gate

A 9.34.1 só pode ser considerada aprovada com auditoria PT-BR, typecheck/build, auditoria de dependências, testes do servidor e quatro PNGs não vazios, seguidos de inspeção humana.
""", encoding='utf-8')

print("Mor'ia 9.34.1 visual proof hardening prepared")
