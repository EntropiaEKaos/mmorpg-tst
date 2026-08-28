from pathlib import Path

visual = Path('src/visualQa.tsx')
text = visual.read_text(encoding='utf-8')
if "import LocaleBridge from './components/LocaleBridge';" not in text:
    text = text.replace(
        "import SocialHub from './components/SocialHub';",
        "import SocialHub from './components/SocialHub';\nimport LocaleBridge from './components/LocaleBridge';",
        1,
    )
old = "createRoot(document.getElementById('root')!).render(<StrictMode><VisualQa /></StrictMode>);"
new = "createRoot(document.getElementById('root')!).render(<StrictMode><LocaleBridge /><VisualQa /></StrictMode>);"
if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise SystemExit('visual QA root anchor not found')
visual.write_text(text, encoding='utf-8')

capture = Path('tools/capture-moria-9-32.mjs')
text = capture.read_text(encoding='utf-8')
old = """  await page.locator(`[data-visual-qa-ready=\"${panel}\"]`).waitFor({ state: 'visible' });
  await page.screenshot({ path: `${output}/${panel}.png`, fullPage: true });
"""
new = """  await page.locator(`[data-visual-qa-ready=\"${panel}\"]`).waitFor({ state: 'visible' });
  await page.waitForTimeout(150);
  const bodyText = await page.locator('body').innerText();
  const forbiddenByPanel = {
    library: ['LIBRARY', 'Back to library', 'Previous', 'Next'],
    mail: ['MAILBOX', 'Compose', 'Refresh', 'Back to inbox', 'Claim Attachments'],
    social: [\"AUTHORITATIVE SOCIAL\", \"MOR'IA SOCIAL HALL\", 'FRIENDS', 'NEARBY ADVENTURERS', 'IGNORED', 'Nobody ignored.'],
  };
  const leaks = forbiddenByPanel[panel].filter((label) => bodyText.includes(label));
  if (leaks.length) {
    throw new Error(`PT-BR visual QA leak in ${panel}: ${leaks.join(', ')}`);
  }
  await page.screenshot({ path: `${output}/${panel}.png`, fullPage: true });
"""
if old in text:
    text = text.replace(old, new, 1)
elif 'forbiddenByPanel' not in text:
    raise SystemExit('capture anchor not found')
capture.write_text(text, encoding='utf-8')

doc = Path('docs/MORIA_9_32_LIBRARY_MAIL_SOCIAL_PTBR.md')
text = doc.read_text(encoding='utf-8')
section = """

## 9.32.1 — Paridade do Visual QA

A primeira captura revelou que o harness isolado não carregava o `LocaleBridge` usado pelo `App.tsx`. O jogo normal já carregava essa camada, mas os screenshots ficaram parcialmente em inglês. A correção 9.32.1 faz o harness usar a mesma infraestrutura de locale do runtime real e adiciona uma barreira automática contra regressão: a captura falha se rótulos ingleses críticos reaparecerem em Biblioteca, Correio ou Social.

Isso transforma os prints em uma verificação funcional de localização, e não apenas em evidência visual.
"""
if '## 9.32.1 — Paridade do Visual QA' not in text:
    text += section
doc.write_text(text, encoding='utf-8')

print("Mor'ia 9.32.1 visual QA locale parity applied")
