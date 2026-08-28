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

singleton = """// Singleton tooltip state
let tooltipListeners: Array<(d: TooltipData | null) => void> = [];

function showGlobalTooltip(data: TooltipData) {
  tooltipListeners.forEach((fn) => fn(data));
}

function hideGlobalTooltip() {
  tooltipListeners.forEach((fn) => fn(null));
}

"""
if singleton not in text:
    raise SystemExit('Tooltip singleton anchor not found')
text = text.replace(singleton, '', 1)

renderer_start = text.find('/** Portal-rendered tooltip that lives at the body level */')
renderer_end_marker = 'export default GlobalTooltipRenderer;'
renderer_end = text.find(renderer_end_marker)
if renderer_start < 0 or renderer_end < 0:
    raise SystemExit('Tooltip renderer block anchor not found')
renderer_end += len(renderer_end_marker)
new_renderer = r'''/** Shared body-level portal renderer used by real tooltip triggers. */
function TooltipPortal({ data }: { data: TooltipData }) {
  const padding = 12;
  const tooltipW = 280;
  const tooltipH = 200;
  const r = data.rect;
  let x = 0, y = 0;
  const preferred = data.preferred || 'top';

  if (preferred === 'top' && r.top - tooltipH - padding > 0) {
    x = r.left + r.width / 2 - tooltipW / 2;
    y = r.top - tooltipH - padding;
  } else if (preferred === 'bottom' && r.bottom + tooltipH + padding < window.innerHeight) {
    x = r.left + r.width / 2 - tooltipW / 2;
    y = r.bottom + padding;
  } else if (preferred === 'left' && r.left - tooltipW - padding > 0) {
    x = r.left - tooltipW - padding;
    y = r.top + r.height / 2 - tooltipH / 2;
  } else if (preferred === 'right' && r.right + tooltipW + padding < window.innerWidth) {
    x = r.right + padding;
    y = r.top + r.height / 2 - tooltipH / 2;
  } else {
    x = r.left + r.width / 2 - tooltipW / 2;
    y = r.bottom + padding;
    if (y + tooltipH > window.innerHeight) y = Math.max(4, r.top - tooltipH - padding);
  }

  x = Math.max(4, Math.min(window.innerWidth - tooltipW - 4, x));
  y = Math.max(4, Math.min(window.innerHeight - tooltipH - 4, y));

  return createPortal(
    <div
      data-tooltip-portal="true"
      style={{ position: 'fixed', left: `${x}px`, top: `${y}px`, maxWidth: `${tooltipW}px`, zIndex: 99999, pointerEvents: 'none' }}
    >
      <div
        className="rounded-lg border-2 px-3 py-2 text-xs backdrop-blur-md shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(40,20,40,0.98) 0%, rgba(20,10,20,0.98) 100%)',
          borderColor: '#ff00ff',
          boxShadow: '0 0 20px rgba(255,0,255,0.4), 0 4px 30px rgba(0,0,0,0.8)',
          color: '#fff',
          minWidth: '160px',
        }}
      >
        {data.content}
      </div>
    </div>,
    ensureRoot(),
  );
}

/** Compatibility mount retained while trigger-owned portals handle real tooltips. */
function GlobalTooltipRenderer() {
  return null;
}

export default GlobalTooltipRenderer;'''
text = text[:renderer_start] + new_renderer + text[renderer_end:]

t_start = text.find("export function T({ content, children, position = 'top', delay = 150, disabled }: TriggerProps) {")
t_end_marker = '/** Shorthand for T */'
t_end = text.find(t_end_marker, t_start)
if t_start < 0 or t_end < 0:
    raise SystemExit('Tooltip trigger block anchor not found')
new_t = r'''export function T({ content, children, position = 'top', delay = 150, disabled }: TriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [localData, setLocalData] = useState<TooltipData | null>(null);

  const handleEnter = useCallback(() => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const node = triggerRef.current;
      if (!node) return;
      setLocalData({ content, rect: node.getBoundingClientRect(), preferred: position });
    }, delay);
  }, [content, position, delay, disabled]);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
    setLocalData(null);
  }, []);

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
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleEnter, handleLeave]);

  return (
    <>
      <div ref={triggerRef} data-tooltip-trigger="true" className="inline-flex">
        {children}
      </div>
      {localData ? <TooltipPortal data={localData} /> : null}
    </>
  );
}

'''
text = text[:t_start] + new_t + text[t_end:]
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
    if (!hudText.toLocaleUpperCase('pt-BR').includes('BARRA DE AÇÕES')) throw new Error(`Mor'ia 9.34 Action Bar title missing: ${hudText}`);
    const spellSlot = page.locator('[data-qa-actionbar] .moria-hotbar-slot').first();
    const tooltipTrigger = spellSlot.locator('..');
    const triggerClass = await tooltipTrigger.getAttribute('class');
    const triggerQa = await tooltipTrigger.getAttribute('data-tooltip-trigger');
    if (!triggerClass?.includes('inline-flex') || triggerQa !== 'true') throw new Error(`Mor'ia 9.34 tooltip trigger wrapper not found: ${triggerClass} / ${triggerQa}`);
    if (await spellSlot.isDisabled()) throw new Error("Mor'ia 9.34 spell proof slot is unexpectedly disabled");
    await spellSlot.focus();
    const focused = await spellSlot.evaluate((node) => node === document.activeElement);
    if (!focused) throw new Error("Mor'ia 9.34 spell proof slot did not receive focus");
    const portal = page.locator('#__global_tooltip_root__ [data-tooltip-portal=\"true\"]');
    await portal.waitFor({ state: 'visible', timeout: 3000 });
    const tooltipText = await portal.innerText();
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

A inspeção humana da primeira captura 9.34 encontrou dois problemas que o gate textual não detectou: a Árvore de Talentos ainda exibia `You have` em inglês e `actionbar.png` podia ser aceito mesmo com a barra fora do enquadramento. O endurecimento posterior provou que o slot estava habilitado e recebia foco; a fragilidade restante estava no acoplamento entre o trigger e o renderer singleton global no entrypoint isolado de QA.

## Correções

- adiciona `You have -> Você tem` ao catálogo PT-BR;
- fixa posição determinística da Action Bar somente no `visual-qa.html`;
- exige geometria real e enquadramento completo em 1440x1000;
- valida o título PT-BR sem depender da capitalização CSS;
- extrai `TooltipPortal`, preservando a renderização real no `body`;
- cada componente `T` passa a possuir o próprio estado de abertura e usa o portal compartilhado diretamente;
- remove o singleton obsoleto e mantém `GlobalTooltipRenderer` apenas como mount de compatibilidade;
- trigger usa listeners nativos `pointerenter/pointerleave` e `focusin/focusout`, incluindo foco de controles filhos;
- timers concorrentes são cancelados antes de novo agendamento;
- `data-tooltip-trigger` e `data-tooltip-portal` fornecem contratos estruturais de QA sem alterar gameplay;
- a captura prova slot habilitado, foco real, portal real e conteúdo real: `Fúria`, `Atalho:`, `Custo de Mana:`, `Recarga:` e `Combos reativos`;
- `You have` é vazamento proibido no print de Talentos.

## Escopo

Nenhuma regra de combate, cooldown, dano, progressão, talento, item ou autoridade do servidor é alterada. A mudança é de apresentação, acessibilidade e arquitetura do tooltip.

## Gate

A 9.34.1 só pode ser aprovada com auditoria PT-BR, typecheck/build, auditoria de dependências, 323 testes do servidor e quatro PNGs não vazios, seguidos de inspeção humana.
""", encoding='utf-8')

print("Mor'ia 9.34.1 visual proof hardening prepared")
