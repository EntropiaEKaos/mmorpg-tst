from pathlib import Path
import json

CATALOG = Path('src/i18n/pt-BR.928.json')
catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
catalog.update({
    'unread message': 'não lida',
    'unread messages': 'não lidas',
    'message': 'mensagem',
    'messages': 'mensagens',
    'eldoria': 'Eldoria',
    'frostpeak': 'Frostpeak',
    'shadowfen': 'Shadowfen',
    'emberhold': 'Emberhold',
    'voidlands': 'Voidlands',
})
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')


def patch(path: str, replacements: list[tuple[str, str]]) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
        elif new not in text:
            raise SystemExit(f'missing required anchor in {path}: {old[:120]}')
    p.write_text(text, encoding='utf-8')


# Fragment translation must be idempotent. A plain split/join translated "Guilda"
# again because "Guild" is a prefix of the already-localized word.
patch('src/i18n/index.ts', [
    ("function preserveWhitespace(source: string, translated: string) {\n", "function escapeRegExp(source: string) {\n  return source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');\n}\n\nfunction preserveWhitespace(source: string, translated: string) {\n"),
    ("  for (const [from,to] of PT_BR_FRAGMENTS) translated = translated.split(from).join(to);", "  for (const [from,to] of PT_BR_FRAGMENTS) {\n    if (/^[A-Za-z0-9_]+$/.test(from)) {\n      translated = translated.replace(new RegExp(`\\\\b${escapeRegExp(from)}\\\\b`, 'g'), to);\n    } else {\n      translated = translated.split(from).join(to);\n    }\n  }"),
])

patch('src/components/MailBox.tsx', [
    ("            <div className=\"text-xs text-amber-200/60\">{unreadCount} {tr('unread')} · {mail.length} {tr('total')}</div>", "            <div className=\"text-xs text-amber-200/60\">{unreadCount} {tr(unreadCount === 1 ? 'unread message' : 'unread messages')} · {mail.length} {tr(mail.length === 1 ? 'message' : 'messages')}</div>"),
])

capture = Path('tools/capture-moria-9-32.mjs')
text = capture.read_text(encoding='utf-8')
old = """    social: [\"AUTHORITATIVE SOCIAL\", \"MOR'IA SOCIAL HALL\", 'FRIENDS', 'NEARBY ADVENTURERS', 'IGNORED', 'Nobody ignored.'],
"""
new = """    social: [\"AUTHORITATIVE SOCIAL\", \"MOR'IA SOCIAL HALL\", 'FRIENDS', 'NEARBY ADVENTURERS', 'IGNORED', 'Nobody ignored.', 'Guildaa', 'eldoria'],
"""
if old in text:
    text = text.replace(old, new, 1)
elif "'Guildaa'" not in text:
    raise SystemExit('social visual corruption assertion anchor not found')
capture.write_text(text, encoding='utf-8')

doc = Path('docs/MORIA_9_32_LIBRARY_MAIL_SOCIAL_PTBR.md')
text = doc.read_text(encoding='utf-8')
section = """

## 9.32.3 — Idempotência da tradução

A revisão humana dos PNGs 9.32.2 detectou `Guildaaa` no Salão Social. A causa não estava no componente Social, mas no fallback global: fragmentos de uma palavra eram substituídos por `split/join`, fazendo `Guild` casar novamente dentro de `Guilda`.

O motor de localização agora aplica limites de palavra aos fragmentos alfanuméricos de uma palavra. Isso torna traduções como `Guild → Guilda` idempotentes e evita corrupção progressiva quando o `LocaleBridge`, Strict Mode ou uma nova renderização processam texto já localizado.

A mesma rodada:

- corrige singular/plural do contador do Correio (`1 não lida · 1 mensagem`);
- apresenta IDs de regiões com capitalização canônica em superfícies sociais;
- faz o visual QA reprovar `Guildaa` e o ID cru `eldoria`;
- mantém os três prints como critério obrigatório de aceite.
"""
if '## 9.32.3 — Idempotência da tradução' not in text:
    text += section
doc.write_text(text, encoding='utf-8')

print("Mor'ia 9.32.3 i18n idempotence and visual quality closure applied")
