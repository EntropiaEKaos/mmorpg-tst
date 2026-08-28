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
old_bus = """// Singleton tooltip state
let tooltipListeners: Array<(d: TooltipData | null) => void> = [];

function showGlobalTooltip(data: TooltipData) {
  tooltipListeners.forEach((fn) => fn(data));
}

function hideGlobalTooltip() {
  tooltipListeners.forEach((fn) => fn(null));
}
"""
new_bus = """// Browser-level tooltip event bus. This remains presentation-only while avoiding
// module-instance coupling under HMR, split bundles and isolated visual-QA entrypoints.
const TOOLTIP_SHOW_EVENT = 'moria-tooltip-show';
const TOOLTIP_HIDE_EVENT = 'moria-tooltip-hide';

function showGlobalTooltip(data: TooltipData) {
  window.dispatchEvent(new CustomEvent<TooltipData>(TOOLTIP_SHOW_EVENT, { detail: data }));
}

function hideGlobalTooltip() {
  window.dispatchEvent(new Event(TOOLTIP_HIDE_EVENT));
}
"""
if new_bus not in text:
    if old_bus not in text:
        raise SystemExit('Tooltip singleton bus anchor not found')
    text = text.replace(old_bus, new_bus, 1)

old_effect = """  useEffect(() => {
    tooltipListeners.push(setData);
    return () => {
      tooltipListeners = tooltipListeners.filter((fn) => fn !== setData);
    };
  }, []);
"""
new_effect = """  useEffect(() => {
    const handleShow = (event: Event) => setData((event as CustomEvent<TooltipData>).detail);
    const handleHide = () => setData(null);
    window.addEventListener(TOOLTIP_SHOW_EVENT, handleShow);
    window.addEventListener(TOOLTIP_HIDE_EVENT, handleHide);
    return () => {
      window.removeEventListener(TOOLTIP_SHOW_EVENT, handleShow);
      window.removeEventListener(TOOLTIP_HIDE_EVENT, handleHide);
    };
  }, []);
"""
if new_effect not in text:
    if old_effect not in text:
        raise SystemExit('Tooltip renderer effect anchor not found')
    text = text.replace(old_effect, new_effect, 1)

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

leave_anchor = """  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    hideGlobalTooltip();
  }, []);

"""
native_effect = """  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    hideGlobalTooltip();
  }, []);

  // Native wrapper listeners deliberately use focusin/focusout because focus is
  // owned by child controls. This is robust for mouse, pen, keyboard, HMR and
  // isolated visual-QA entrypoints without changing any gameplay authority.
  useEffect(() => {
    const node = triggerRef.current;
    if (!node) return;
    node.addEventListener('pointerenter', handleEnter);
    node.addEventListener('pointerleave', handleLeave);
    node.addEventListener('focusin', handleEnter);
    node.addEventListener('focusout', handleLeave);
    return () => {
      node.removeEventListener('pointerenter', handleEnter);
      node.removeEventListener('pointerleave', handleLeave);
      node.removeEventListener('focusin', handleEnter);
      node.removeEventListener('focusout', handleLeave);
    };
  }, [handleEnter, handleLeave]);

"""
if native_effect not in text:
    if leave_anchor not in text:
        raise SystemExit('Tooltip native listener anchor not found')
    text = text.replace(leave_anchor, native_effect, 1)

old_events = """      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className=\"inline-flex\"
"""
old_events_2 = """      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onFocusCapture={handleEnter}
      onBlurCapture={handleLeave}
      data-tooltip-trigger=\"true\"
      className=\"inline-flex\"
"""
new_events = """      data-tooltip-trigger=\"true\"
      className=\"inline-flex\"
"""
if new_events not in text:
    if old_events in text:
        text = text.replace(old_events, new_events, 1)
    elif old_events_2 in text:
        text = text.replace(old_events_2, new_events, 1)
    else:
        raise SystemExit('Tooltip event anchor not found')
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
    if (await spellSlot.isDisabled()) throw new Error(\"Mor'ia 9.34 spell proof slot is unexpectedly disabled\");
    await page.evaluate(() => {
      window.__moriaTooltipShowCount = 0;
      window.addEventListener('moria-tooltip-show', () => { window.__moriaTooltipShowCount += 1; }, { once: false });
    });
    await spellSlot.focus();
    const focused = await spellSlot.evaluate((node) => node === document.activeElement);
    if (!focused) throw new Error(\"Mor'ia 9.34 spell proof slot did not receive focus\");
    await page.waitForTimeout(260);
    const diagnostics = await page.evaluate(() => ({
      showCount: window.__moriaTooltipShowCount || 0,
      activeClass: document.activeElement?.getAttribute?.('class') || '',
      rootExists: Boolean(document.getElementById('__global_tooltip_root__')),
    }));
    if (diagnostics.showCount < 1) throw new Error(`Mor'ia 9.34 tooltip trigger did not dispatch: ${JSON.stringify(diagnostics)}`);
    await page.locator('#__global_tooltip_root__ > div').waitFor({ state: 'visible', timeout: 3000 });
    const tooltipText = await page.locator('#__global_tooltip_root__').innerText();
    for (const required of ['Fúria', 'Atalho:', 'Custo de Mana:', 'Recarga:', 'Combos reativos']) {
      if (!tooltipText.includes(required)) throw new Error(`Mor'ia 9.34 Action Bar tooltip missing ${required}: ${tooltipText}`);
    }
  } else if (panel === 'castbar') {
"""
if new_action not in text:
    if old_action not in text:
        # Preserve already-hardened capture code from previous reruns, but add diagnostics if absent.
        marker = "    await spellSlot.focus();\n"
        diagnostic_block = """    await page.evaluate(() => {
      window.__moriaTooltipShowCount = 0;
      window.addEventListener('moria-tooltip-show', () => { window.__moriaTooltipShowCount += 1; }, { once: false });
    });
    await spellSlot.focus();
"""
        if diagnostic_block not in text:
            if marker not in text:
                raise SystemExit('capture Action Bar hardened anchor not found')
            text = text.replace(marker, diagnostic_block, 1)
        wait_marker = "    await page.locator('#__global_tooltip_root__ > div').waitFor({ state: 'visible', timeout: 3000 });\n"
        diagnostic_wait = """    await page.waitForTimeout(260);
    const diagnostics = await page.evaluate(() => ({
      showCount: window.__moriaTooltipShowCount || 0,
      activeClass: document.activeElement?.getAttribute?.('class') || '',
      rootExists: Boolean(document.getElementById('__global_tooltip_root__')),
    }));
    if (diagnostics.showCount < 1) throw new Error(`Mor'ia 9.34 tooltip trigger did not dispatch: ${JSON.stringify(diagnostics)}`);
    await page.locator('#__global_tooltip_root__ > div').waitFor({ state: 'visible', timeout: 3000 });
"""
        if diagnostic_wait not in text:
            if wait_marker not in text:
                raise SystemExit('capture tooltip wait anchor not found')
            text = text.replace(wait_marker, diagnostic_wait, 1)
    else:
        text = text.replace(old_action, new_action, 1)
capture.write_text(text, encoding='utf-8')

Path('docs/MORIA_9_34_1_VISUAL_PROOF.md').write_text("""# Mor'ia 9.34.1 — Visual Proof Hardening

## Motivo

A inspeção humana da primeira captura 9.34 encontrou dois problemas que o gate textual não detectou: a Árvore de Talentos ainda exibia `You have` em inglês e `actionbar.png` podia ser aceito mesmo com a barra fora do enquadramento. O endurecimento posterior confirmou que o slot estava habilitado e recebia foco, isolando a fragilidade na ativação do tooltip sob o entrypoint de QA.

## Correções

- adiciona `You have -> Você tem` ao catálogo PT-BR;
- fixa uma posição determinística da Action Bar apenas no `visual-qa.html`;
- exige geometria real e enquadramento completo da Action Bar em 1440x1000;
- valida o título em PT-BR sem depender da capitalização CSS;
- substitui o singleton de listeners por eventos do navegador (`moria-tooltip-show` / `moria-tooltip-hide`);
- o trigger real usa listeners nativos `pointerenter/pointerleave` e `focusin/focusout` no wrapper, incluindo foco de controles filhos;
- cancela timers concorrentes antes de agendar nova abertura;
- mantém `data-tooltip-trigger=\"true\"` como contrato estrutural de QA;
- a captura prova que o slot está habilitado, recebe foco, dispara o evento real e abre o portal real;
- o tooltip deve conter `Fúria`, `Atalho:`, `Custo de Mana:`, `Recarga:` e `Combos reativos`;
- `You have` passa a ser vazamento proibido no print de Talentos.

## Escopo

Nenhuma regra de combate, cooldown, dano, progressão, talento, item ou autoridade do servidor é alterada. A mudança é exclusivamente de apresentação, acessibilidade de interação e robustez da infraestrutura de tooltip/QA.

## Gate

A 9.34.1 só pode ser aprovada com auditoria PT-BR, typecheck/build, auditoria de dependências, 323 testes do servidor e quatro PNGs não vazios, seguidos de inspeção humana.
""", encoding='utf-8')

print("Mor'ia 9.34.1 visual proof hardening prepared")
