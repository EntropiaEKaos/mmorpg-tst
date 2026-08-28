import { useEffect } from 'react';
import { getLocale, setLocale, translateGameText, type MoriaLocale } from '../i18n';

const ATTRS = ['placeholder','title','aria-label'] as const;

function translateTree(root: Node) {
  if (getLocale() !== 'pt-BR') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || ['SCRIPT','STYLE','CODE','PRE','TEXTAREA'].includes(parent.tagName)) continue;
    const next = translateGameText(node.nodeValue || '');
    if (next !== node.nodeValue) node.nodeValue = next;
  }
  if (root instanceof Element) {
    for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
      if (!(el instanceof HTMLElement)) continue;
      for (const attr of ATTRS) {
        const current = el.getAttribute(attr);
        if (!current) continue;
        const next = translateGameText(current);
        if (next !== current) el.setAttribute(attr, next);
      }
    }
  }
}

function installCanvasTranslation() {
  if (getLocale() !== 'pt-BR' || typeof CanvasRenderingContext2D === 'undefined') return () => {};
  const proto = CanvasRenderingContext2D.prototype;
  const originalFillText = proto.fillText;
  const originalStrokeText = proto.strokeText;

  const localizedFillText = function(this: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth?: number) {
    const localized = translateGameText(text);
    if (maxWidth === undefined) originalFillText.call(this, localized, x, y);
    else originalFillText.call(this, localized, x, y, maxWidth);
  };
  const localizedStrokeText = function(this: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth?: number) {
    const localized = translateGameText(text);
    if (maxWidth === undefined) originalStrokeText.call(this, localized, x, y);
    else originalStrokeText.call(this, localized, x, y, maxWidth);
  };

  proto.fillText = localizedFillText;
  proto.strokeText = localizedStrokeText;
  return () => {
    if (proto.fillText === localizedFillText) proto.fillText = originalFillText;
    if (proto.strokeText === localizedStrokeText) proto.strokeText = originalStrokeText;
  };
}

export default function LocaleBridge() {
  useEffect(() => {
    document.documentElement.lang = getLocale();
    document.documentElement.dataset.moriaLocale = getLocale();
    const restoreCanvas = installCanvasTranslation();
    translateTree(document.body);
    const observer = new MutationObserver((entries) => {
      for (const entry of entries) {
        if (entry.type === 'characterData') translateTree(entry.target);
        for (const node of Array.from(entry.addedNodes)) translateTree(node);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => {
      observer.disconnect();
      restoreCanvas();
    };
  }, []);
  return null;
}

export function LocaleToggle() {
  const locale = getLocale();
  const choose = (next: MoriaLocale) => { if (next !== locale) setLocale(next); };
  return (
    <div className="fixed right-3 top-3 z-[9999] flex rounded-lg border border-amber-200/15 bg-black/65 p-1 text-[9px] font-bold tracking-wider backdrop-blur-md">
      <button onClick={() => choose('pt-BR')} className={`rounded px-2 py-1 ${locale === 'pt-BR' ? 'bg-amber-200/15 text-amber-100' : 'text-slate-400'}`}>PT-BR</button>
      <button onClick={() => choose('en-US')} className={`rounded px-2 py-1 ${locale === 'en-US' ? 'bg-amber-200/15 text-amber-100' : 'text-slate-400'}`}>EN</button>
    </div>
  );
}
