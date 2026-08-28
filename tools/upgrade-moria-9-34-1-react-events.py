from pathlib import Path

TOOLTIP = Path('src/components/Tooltip.tsx')
text = TOOLTIP.read_text(encoding='utf-8')

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

DOC = Path('docs/MORIA_9_34_1_VISUAL_PROOF.md')
doc = DOC.read_text(encoding='utf-8')
doc = doc.replace(
    '- trigger usa listeners nativos `pointerenter/pointerleave` e `focusin/focusout`, incluindo foco de controles filhos;\n',
    '- o trigger usa `onPointerEnter/onPointerLeave` e `onFocusCapture/onBlurCapture` diretamente no wrapper React, incluindo foco de controles filhos e eliminando a corrida entre render e `useEffect`;\n',
)
if 'corrida entre render e `useEffect`' not in doc:
    raise SystemExit('9.34.1 documentation anchor not found')
DOC.write_text(doc, encoding='utf-8')

print("Mor'ia 9.34.1 React tooltip event hardening prepared")
