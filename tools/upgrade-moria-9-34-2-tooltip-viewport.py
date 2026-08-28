from pathlib import Path

TOOLTIP = Path('src/components/Tooltip.tsx')
text = TOOLTIP.read_text(encoding='utf-8')
text = text.replace(
    "import { useState, useRef, useEffect, useCallback } from 'react';",
    "import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';",
    1,
)
old = """/** Shared body-level portal renderer used by real tooltip triggers. */
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
      data-tooltip-portal=\"true\"
      style={{ position: 'fixed', left: `${x}px`, top: `${y}px`, maxWidth: `${tooltipW}px`, zIndex: 99999, pointerEvents: 'none' }}
    >
"""
new = """type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

type TooltipSize = { width: number; height: number };

function resolveTooltipPosition(data: TooltipData, size: TooltipSize) {
  const edge = 4;
  const padding = 12;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const r = data.rect;
  const width = Math.min(size.width, Math.max(160, viewportW - edge * 2));
  const height = Math.min(size.height, Math.max(80, viewportH - edge * 2));
  const centerX = r.left + r.width / 2;
  const centerY = r.top + r.height / 2;
  const placements: Record<TooltipPlacement, { x: number; y: number }> = {
    top: { x: centerX - width / 2, y: r.top - height - padding },
    bottom: { x: centerX - width / 2, y: r.bottom + padding },
    left: { x: r.left - width - padding, y: centerY - height / 2 },
    right: { x: r.right + padding, y: centerY - height / 2 },
  };
  const preferred = (data.preferred || 'top') as TooltipPlacement;
  const opposite: Record<TooltipPlacement, TooltipPlacement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const perpendicular: Record<TooltipPlacement, TooltipPlacement[]> = {
    top: ['right', 'left'], bottom: ['right', 'left'], left: ['top', 'bottom'], right: ['top', 'bottom'],
  };
  const order = [preferred, opposite[preferred], ...perpendicular[preferred]];
  const fits = ({ x, y }: { x: number; y: number }) => x >= edge && y >= edge && x + width <= viewportW - edge && y + height <= viewportH - edge;
  const selected = order.map((placement) => placements[placement]).find(fits) || placements[preferred];
  return {
    x: Math.max(edge, Math.min(viewportW - width - edge, selected.x)),
    y: Math.max(edge, Math.min(viewportH - height - edge, selected.y)),
  };
}

/** Shared body-level portal renderer used by real tooltip triggers. */
function TooltipPortal({ data }: { data: TooltipData }) {
  const portalRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<TooltipSize>({ width: 280, height: 200 });
  const position = resolveTooltipPosition(data, measured);

  useLayoutEffect(() => {
    const node = portalRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const next = { width: Math.ceil(rect.width), height: Math.ceil(rect.height) };
    setMeasured((current) => current.width === next.width && current.height === next.height ? current : next);
  }, [data.content]);

  return createPortal(
    <div
      ref={portalRef}
      data-tooltip-portal=\"true\"
      style={{
        position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, maxWidth: '280px',
        maxHeight: 'calc(100vh - 8px)', overflowY: 'auto', zIndex: 99999, pointerEvents: 'none',
      }}
    >
"""
if old not in text:
    raise SystemExit('Tooltip viewport positioning anchor not found')
text = text.replace(old, new, 1)
TOOLTIP.write_text(text, encoding='utf-8')

CAPTURE = Path('tools/capture-moria-9-34.mjs')
capture = CAPTURE.read_text(encoding='utf-8')
anchor = """    const tooltipText = await portal.innerText();
    for (const required of ['Fúria', 'ATALHO:', 'Custo de Mana:', 'Recarga:', 'COMBOS REATIVOS']) {
"""
replacement = """    const portalBox = await portal.boundingBox();
    const viewport = page.viewportSize();
    if (!portalBox || !viewport || portalBox.x < 3 || portalBox.y < 3 || portalBox.x + portalBox.width > viewport.width - 3 || portalBox.y + portalBox.height > viewport.height - 3) {
      throw new Error(`Mor'ia 9.34.2 Tooltip escapes viewport: ${JSON.stringify({ portalBox, viewport })}`);
    }
    const tooltipText = await portal.innerText();
    for (const required of ['Fúria', 'ATALHO:', 'Custo de Mana:', 'Recarga:', 'COMBOS REATIVOS']) {
"""
if anchor not in capture:
    raise SystemExit('Tooltip viewport proof anchor not found')
capture = capture.replace(anchor, replacement, 1)
CAPTURE.write_text(capture, encoding='utf-8')

DOC = Path('docs/MORIA_9_34_2_TOOLTIP_VIEWPORT.md')
DOC.write_text("""# Mor'ia 9.34.2 — Tooltip viewport safety

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
""", encoding='utf-8')

print("Mor'ia 9.34.2 tooltip viewport safety prepared")
