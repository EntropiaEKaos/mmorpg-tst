from pathlib import Path

TOOLTIP = Path('src/components/Tooltip.tsx')
text = TOOLTIP.read_text(encoding='utf-8')

# The 9.34.1 base applicator has already converted the real Tooltip trigger to
# local state. Keep that architecture, but remove the legacy dedicated root:
# portalling directly to document.body is simpler and avoids mutating the DOM
# while React is rendering TooltipPortal under StrictMode.
root_block = """const TOOLTIP_ID = '__global_tooltip_root__';

function ensureRoot(): HTMLElement {
  let root = document.getElementById(TOOLTIP_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = TOOLTIP_ID;
    root.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
    document.body.appendChild(root);
  }
  return root;
}

"""
if root_block not in text:
    raise SystemExit('Tooltip dedicated root anchor not found')
text = text.replace(root_block, '', 1)

portal_target = """    ensureRoot(),
  );
}"""
body_target = """    document.body,
  );
}"""
if portal_target not in text:
    raise SystemExit('Tooltip portal target anchor not found')
text = text.replace(portal_target, body_target, 1)

old_effect = """  useEffect(() => {
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
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleEnter, handleLeave]);
"""
new_effect = """  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
"""
if old_effect not in text:
    raise SystemExit('Tooltip native listener effect anchor not found')
text = text.replace(old_effect, new_effect, 1)

old_wrapper = """      <div ref={triggerRef} data-tooltip-trigger=\"true\" className=\"inline-flex\">
        {children}
      </div>
"""
new_wrapper = """      <div
        ref={triggerRef}
        data-tooltip-trigger=\"true\"
        data-tooltip-open={localData ? 'true' : 'false'}
        className=\"inline-flex\"
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        onFocusCapture={handleEnter}
        onBlurCapture={handleLeave}
      >
        {children}
      </div>
"""
if old_wrapper not in text:
    raise SystemExit('Tooltip wrapper anchor not found')
text = text.replace(old_wrapper, new_wrapper, 1)
TOOLTIP.write_text(text, encoding='utf-8')

# Real production hardening uncovered by the visual proof: legacy/incomplete
# player snapshots may not carry a skills object. Opening a spell tooltip must
# not crash the whole React tree in that case.
SCALING = Path('src/game/elementalScaling.ts')
scaling = SCALING.read_text(encoding='utf-8')
old_skill = "function skillLevel(player:Player,id:string){ const raw=(player.skills as unknown as Record<string,{level:number}|number|undefined>)[id]; return Math.max(1,num(typeof raw==='object'&&raw?raw.level:raw,10)); }"
new_skill = "function skillLevel(player:Player,id:string){ const raw=((player.skills || {}) as unknown as Record<string,{level:number}|number|undefined>)[id]; return Math.max(1,num(typeof raw==='object'&&raw?raw.level:raw,10)); }"
if old_skill not in scaling:
    raise SystemExit('elemental scaling skill fallback anchor not found')
scaling = scaling.replace(old_skill, new_skill, 1)
SCALING.write_text(scaling, encoding='utf-8')

CAPTURE = Path('tools/capture-moria-9-34.mjs')
capture = CAPTURE.read_text(encoding='utf-8')
old_locator = """    const spellSlot = page.locator('[data-qa-actionbar] .moria-hotbar-slot').first();
    const tooltipTrigger = spellSlot.locator('..');
"""
new_locator = """    const tooltipTrigger = hud.locator('[data-tooltip-trigger=\"true\"]').first();
    await tooltipTrigger.waitFor({ state: 'visible', timeout: 3000 });
    const spellSlot = tooltipTrigger.locator('.moria-hotbar-slot').first();
    await spellSlot.waitFor({ state: 'visible', timeout: 3000 });
"""
if old_locator not in capture:
    raise SystemExit('Action Bar tooltip locator block not found')
capture = capture.replace(old_locator, new_locator, 1)

old_focus = """    await spellSlot.focus();
    const focused = await spellSlot.evaluate((node) => node === document.activeElement);
    if (!focused) throw new Error(\"Mor'ia 9.34 spell proof slot did not receive focus\");
    const portal = page.locator('#__global_tooltip_root__ [data-tooltip-portal=\"true\"]');
    await portal.waitFor({ state: 'visible', timeout: 3000 });
"""
new_hover = """    await tooltipTrigger.hover();
    await page.waitForTimeout(320);
    const tooltipState = await page.evaluate(() => {
      const hudNode = document.querySelector('[data-hud-window=\"action-bar\"]');
      const trigger = hudNode?.querySelector('[data-tooltip-trigger=\"true\"]');
      const portal = document.querySelector('body > [data-tooltip-portal=\"true\"]');
      return {
        triggerFound: Boolean(trigger),
        openState: trigger?.getAttribute('data-tooltip-open') || null,
        portalFound: Boolean(portal),
        tooltipText: portal?.textContent || '',
        hudText: hudNode?.textContent || '',
      };
    });
    if (!tooltipState.triggerFound || tooltipState.openState !== 'true') {
      throw new Error(`Mor'ia 9.34 Tooltip local state did not open after real hover: ${JSON.stringify(tooltipState)}`);
    }
    const portal = page.locator('body > [data-tooltip-portal=\"true\"]');
    await portal.waitFor({ state: 'visible', timeout: 3000 });
"""
if old_focus not in capture:
    raise SystemExit('Action Bar focus proof anchor not found')
capture = capture.replace(old_focus, new_hover, 1)
CAPTURE.write_text(capture, encoding='utf-8')

DOC = Path('docs/MORIA_9_34_1_VISUAL_PROOF.md')
doc = DOC.read_text(encoding='utf-8')
doc = doc.replace(
    '- trigger usa listeners nativos `pointerenter/pointerleave` e `focusin/focusout`, incluindo foco de controles filhos;\n',
    '- o trigger usa `onPointerEnter/onPointerLeave` e `onFocusCapture/onBlurCapture` diretamente no wrapper React, incluindo foco de controles filhos e eliminando a corrida entre render e `useEffect`;\n',
)
doc = doc.replace(
    '- `data-tooltip-trigger` e `data-tooltip-portal` fornecem contratos estruturais de QA sem alterar gameplay;\n',
    '- `data-tooltip-trigger`, `data-tooltip-open` e `data-tooltip-portal` fornecem contratos estruturais de QA sem alterar gameplay;\n',
)
doc = doc.replace(
    '- a captura prova slot habilitado, foco real, portal real e conteúdo real: `Fúria`, `Atalho:`, `Custo de Mana:`, `Recarga:` e `Combos reativos`;\n',
    '- a captura prova slot habilitado, `hover` real, estado local aberto, portal real no `document.body` e conteúdo real: `Fúria`, `Atalho:`, `Custo de Mana:`, `Recarga:` e `Combos reativos`;\n',
)
doc += '\n- O harness ancora a prova no wrapper real `[data-tooltip-trigger]` dentro da ActionBar e usa uma leitura DOM instantânea após o hover para evitar que o auto-wait do Playwright confunda reconciliação React com ausência do trigger.\n'
doc += '- O QA revelou um bug real de compatibilidade: `buildSpellScalingBreakdown` podia desmontar a interface ao abrir um tooltip se um snapshot legado não tivesse `player.skills`. `skillLevel` agora trata `skills` ausente como catálogo vazio e mantém o fallback de nível 10.\n'
if 'data-tooltip-open' not in doc or '`document.body`' not in doc or 'leitura DOM instantânea' not in doc or 'snapshot legado' not in doc:
    raise SystemExit('9.34.1 documentation instrumentation anchor not found')
DOC.write_text(doc, encoding='utf-8')

print("Mor'ia 9.34.1 race-free tooltip and legacy scaling hardening prepared")
