from pathlib import Path

p = Path('README.md')
text = p.read_text()
text = text.replace("<p><b>Versão atual: Mor'ia 9.16 — The Living Realm</b></p>", "<p><b>Versão atual: Mor'ia 9.26.1 — Road to 10 Candidate</b></p>")

section = r'''## ✦ Mor'ia 9.17–9.26.1 — Road to 10

A linha **Road to 10** conecta o Living Realm a uma camada operacional única e persistente. Nodes, facções e Chronicle agora alimentam **economia regional**, **especializações de profissão**, **Beast Care**, **política e diplomacia**, **fortificações e máquinas de cerco**, **ecologia/ameaça/corrupção**, **dungeons com blueprints e puzzles server-side**, **consequências persistentes de quests** e **upgrades funcionais de housing**.

A 9.26.1 fecha os loops que precisavam atravessar mais de um domínio: compras no Auction House alimentam o ledger regional; programas semanais de facção consomem atividade real; bounties são pagos após morte PvP autoritativa; puzzles de dungeon são validados no servidor; o boss final usa a identidade real da blueprint; e Workshop, Shopfront, Library, Stable e Siege Foundry alteram cálculos reais em vez de existirem apenas como metadata.

O baseline validado desta linha possui **308/308 testes server-side**, `npm audit` limpo em cliente e servidor, TypeScript/build aprovados e `GameScreen.tsx` mantido dentro do budget arquitetural. A revisão visual automatizada abriu o jogo em **Chromium real**, percorreu as dez abas do Road-to-10 Director e terminou com **0 erros de console/página**.

> Os screenshots abaixo são capturas reais da superfície de produto/authoring do **Road to 10 Director**. Os números ilustrativos apresentados pelo Director não são tratados como telemetria live; a autoridade e os efeitos de runtime são validados separadamente pela suíte server-side.

### 9.17 — Integration Layer

![Mor'ia 9.17 Integration](docs/screenshots/moria-9-17-integration.png)

### 9.18 — Regional Economy

![Mor'ia 9.18 Regional Economy](docs/screenshots/moria-9-18-regional-economy.png)

### 9.19 — Profession Specialization

![Mor'ia 9.19 Profession Specialization](docs/screenshots/moria-9-19-profession-specialization.png)

### 9.20 — Beast Care / Taming 2.0

![Mor'ia 9.20 Beast Care](docs/screenshots/moria-9-20-beast-care.png)

### 9.21 — Faction Politics

![Mor'ia 9.21 Faction Politics](docs/screenshots/moria-9-21-faction-politics.png)

### 9.22 — Siege Warfare

![Mor'ia 9.22 Siege Warfare](docs/screenshots/moria-9-22-siege-warfare.png)

### 9.23 — Dynamic World

![Mor'ia 9.23 Dynamic World](docs/screenshots/moria-9-23-dynamic-world.png)

### 9.24 — Dungeon Blueprints

![Mor'ia 9.24 Dungeon Blueprints](docs/screenshots/moria-9-24-dungeon-blueprints.png)

### 9.25 — Quest Consequences

![Mor'ia 9.25 Quest Consequences](docs/screenshots/moria-9-25-quest-consequences.png)

### 9.26 — Functional Housing

![Mor'ia 9.26 Housing Services](docs/screenshots/moria-9-26-housing-services.png)

O código está **feature-complete como candidato pré-10**, mas produção pública exige gates adicionais de migração/rollback, concorrência econômica, soak de guerra/mundo dinâmico, carga, observabilidade e segurança de deploy. A separação completa entre “feature ready” e “production ready” está documentada em **[Mor'ia 10.0 — Readiness Dossier](docs/MORIA_10_READINESS.md)**.

---

'''
marker = "## 🏰 Mor'ia 9.11–9.16 — The Living Realm"
if "## ✦ Mor'ia 9.17–9.26.1 — Road to 10" not in text:
    if marker not in text:
        raise SystemExit('Living Realm README marker not found')
    text = text.replace(marker, section + marker, 1)

additional = "- ✦ **[Mor'ia 10.0 — Readiness Dossier](docs/MORIA_10_READINESS.md)** — Gates de release, load/soak, migração, observabilidade, segurança e critérios para o RC 10.0.\n"
docs_marker = "## 📚 Documentação Adicional\n\n"
if additional not in text:
    if docs_marker not in text:
        raise SystemExit('Documentation README marker not found')
    text = text.replace(docs_marker, docs_marker + additional, 1)

required = [
    'docs/screenshots/moria-9-17-integration.png',
    'docs/screenshots/moria-9-18-regional-economy.png',
    'docs/screenshots/moria-9-19-profession-specialization.png',
    'docs/screenshots/moria-9-20-beast-care.png',
    'docs/screenshots/moria-9-21-faction-politics.png',
    'docs/screenshots/moria-9-22-siege-warfare.png',
    'docs/screenshots/moria-9-23-dynamic-world.png',
    'docs/screenshots/moria-9-24-dungeon-blueprints.png',
    'docs/screenshots/moria-9-25-quest-consequences.png',
    'docs/screenshots/moria-9-26-housing-services.png',
]
for image in required:
    if not Path(image).is_file():
        raise SystemExit(f'missing visual evidence: {image}')

p.write_text(text)
print("Mor'ia Road-to-10 README updated.")
