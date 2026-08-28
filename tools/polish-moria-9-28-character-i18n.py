from pathlib import Path

# 1) Fix vocation identity on normal (unmounted) avatar path.
p=Path('src/game/playerAvatar.ts')
s=p.read_text(encoding='utf-8')
old="drawPixelHuman(ctx, cx, feetY, size * 1.08, direction, style, colors, addonMask, time);"
new="drawPixelHuman(ctx, cx, feetY, size * 1.08, direction, style, colors, addonMask, time, vocationId);"
if old not in s and new not in s: raise SystemExit('normal avatar call marker missing')
s=s.replace(old,new)
p.write_text(s,encoding='utf-8')

# 2) Permanent real-renderer vocation preview for character creation.
Path('src/components/VocationPortrait.tsx').write_text(r'''import { useEffect, useRef } from 'react';
import { drawPixelHuman } from '../game/playerAvatar';

export default function VocationPortrait({ id, color, active = false }: { id: string; color: string; active?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled = false;
    const colors = { head:'#d7a06b', primary:color, secondary:'#30394a', detail:'#d9c271' };
    drawPixelHuman(ctx, canvas.width/2, canvas.height-6, 46, 'down', id, colors, 0, 520, id);
  }, [id,color]);
  return (
    <span className={`relative flex h-[76px] w-[72px] shrink-0 items-end justify-center overflow-hidden rounded-xl border ${active ? 'border-amber-200/35 bg-amber-200/[0.055]' : 'border-white/8 bg-black/20'}`}>
      <span className="absolute inset-x-2 bottom-1 h-2 rounded-full bg-black/35 blur-sm" />
      <canvas ref={ref} width={88} height={92} className="relative h-[76px] w-[72px] [image-rendering:pixelated]" data-vocation-preview={id} aria-label={`Prévia visual: ${id}`} />
    </span>
  );
}
''',encoding='utf-8')

# 3) Upgrade Login character selection to actual class sprites and direct PT-BR for key creation text.
p=Path('src/components/LoginScreen.tsx')
s=p.read_text(encoding='utf-8')
if "VocationPortrait" not in s:
    s=s.replace("import { audio } from '../game/audio';", "import { audio } from '../game/audio';\nimport VocationPortrait from './VocationPortrait';\nimport { translateGameText as tr } from '../i18n';")
# Directly localize vocation display label and key class selection strings; bridge still handles legacy text elsewhere.
s=s.replace("<span className=\"flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-2xl\" style={{ filter: `drop-shadow(0 0 8px ${v.color})` }}>{v.icon}</span>", "<VocationPortrait id={v.id} color={v.color} active={active} />")
s=s.replace("{v.name}</div>", "{tr(v.name)}</div>")
s=s.replace("{active ? 'SELECTED' : 'CHOOSE'}</div>", "{active ? tr('SELECTED') : tr('CHOOSE')}</div>")
s=s.replace("className=\"moria-scrollbar grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1\"", "className=\"moria-scrollbar grid max-h-[390px] grid-cols-2 gap-2 overflow-y-auto pr-1\"")
s=s.replace("className={`relative rounded-xl border p-3 text-left transition-all", "className={`relative min-h-[104px] rounded-xl border p-2.5 text-left transition-all")
p.write_text(s,encoding='utf-8')

# 4) Expand PT-BR catalog with high-frequency UI phrases and login fragments that are split across DOM nodes.
p=Path('src/i18n/index.ts')
s=p.read_text(encoding='utf-8')
marker="const PT_BR_PATTERNS: Array<[RegExp, string]> = ["
extra=r'''const PT_BR_FRAGMENTS: Array<[string,string]> = [
  ['Enter a world built for ', 'Entre em um mundo feito de '],
  ['danger', 'perigo'],
  [', mastery and legend.', ', domínio e lenda.'],
  ['old-school MMO tension', 'a tensão dos MMOs clássicos'],
  ['modern authoritative server', 'servidor autoritativo moderno'],
  ['living progression', 'progressão viva'],
  ['world that grows with its players', 'mundo que cresce com seus jogadores'],
  ['Create your character', 'Crie seu personagem'],
  ['New adventurer', 'Novo aventureiro'],
  ['Signed in as ', 'Conectado como '],
  ['Account authenticated.', 'Conta autenticada.'],
  ['Create your first character.', 'Crie seu primeiro personagem.'],
  ['Account created.', 'Conta criada.'],
  ['Save your recovery code before continuing.', 'Salve seu código de recuperação antes de continuar.'],
  ['Password reset.', 'Senha redefinida.'],
  ['Your recovery code was rotated; save the new code.', 'Seu código de recuperação foi renovado; salve o novo código.'],
  ['Authenticate the account first.', 'Autentique a conta primeiro.'],
  ['Weapon mastery up!', 'Maestria de arma aumentou!'],
  ['reached Lv', 'alcançou Nv.'],
  ['stats', 'atributos'],
  ['Too far away.', 'Muito longe.'],
  ['Server', 'Servidor'],
  ['World', 'Mundo'],
  ['Trade', 'Comércio'],
  ['Say', 'Falar'],
  ['Party', 'Grupo'],
  ['Guild', 'Guilda'],
  ['Friends', 'Amigos'],
  ['Mastery', 'Maestria'],
  ['Achievements', 'Conquistas'],
  ['Achievement', 'Conquista'],
  ['Daily Reward', 'Recompensa Diária'],
  ['Daily', 'Diário'],
  ['Stamina', 'Vigor'],
  ['Blessing', 'Bênção'],
  ['Blessings', 'Bênçãos'],
  ['Training', 'Treinamento'],
  ['Mounts', 'Montarias'],
  ['Mount', 'Montaria'],
  ['Pets', 'Companheiros'],
  ['Pet', 'Companheiro'],
  ['Housing', 'Moradia'],
  ['House', 'Casa'],
  ['Bank', 'Banco'],
  ['Deposit', 'Depositar'],
  ['Withdraw', 'Sacar'],
  ['Send', 'Enviar'],
  ['Claim', 'Resgatar'],
  ['Abandon', 'Abandonar'],
  ['Accept', 'Aceitar'],
  ['Completed', 'Concluído'],
  ['Complete', 'Concluir'],
  ['Progress', 'Progresso'],
  ['Objective', 'Objetivo'],
  ['Objectives', 'Objetivos'],
  ['Difficulty', 'Dificuldade'],
  ['Required', 'Necessário'],
  ['Available', 'Disponível'],
  ['Unavailable', 'Indisponível'],
  ['Cooldown', 'Recarga'],
  ['Damage', 'Dano'],
  ['Defense', 'Defesa'],
  ['Attack', 'Ataque'],
  ['Speed', 'Velocidade'],
  ['Critical Chance', 'Chance de Crítico'],
  ['Lifesteal', 'Roubo de Vida'],
  ['Resistance Pierce', 'Perfuração de Resistência'],
  ['Spell Power', 'Poder Mágico'],
  ['Physical Power', 'Poder Físico'],
  ['Damage Bonus', 'Bônus de Dano'],
  ['Skill Bonus', 'Bônus de Habilidade'],
  ['Quantity', 'Quantidade'],
  ['Unit price', 'Preço unitário'],
  ['Total price', 'Preço total'],
  ['Seller', 'Vendedor'],
  ['Buyer', 'Comprador'],
  ['Recipient', 'Destinatário'],
  ['Message', 'Mensagem'],
  ['Subject', 'Assunto'],
  ['Collection', 'Coleção'],
  ['Rarity', 'Raridade'],
  ['Type', 'Tipo'],
  ['Slot', 'Espaço'],
  ['Required level', 'Nível necessário'],
  ['Profession', 'Profissão'],
  ['Recipe', 'Receita'],
  ['Ingredients', 'Ingredientes'],
  ['Result', 'Resultado'],
  ['Stable', 'Estábulo'],
  ['Bond', 'Vínculo'],
  ['Loyalty', 'Lealdade'],
  ['Temperament', 'Temperamento'],
  ['Wildness', 'Selvageria'],
  ['Generation', 'Geração'],
  ['Mutation', 'Mutação'],
  ['Territory', 'Território'],
  ['Controller', 'Controlador'],
  ['Development', 'Desenvolvimento'],
  ['Population', 'População'],
  ['Specialization', 'Especialização'],
  ['Declare War', 'Declarar Guerra'],
  ['Attack Node', 'Atacar Node'],
  ['Defend', 'Defender'],
  ['News', 'Notícias'],
  ['Headlines', 'Manchetes'],
  ['Economy', 'Economia'],
  ['Politics', 'Política'],
  ['Discovery', 'Descoberta'],
  ['Bosses', 'Chefes'],
];

'''
if 'const PT_BR_FRAGMENTS' not in s:
    s=s.replace(marker,extra+marker)
# Apply fragments before generic word fallback.
old="  let translated = core;\n  for (const [pattern,replacement] of WORDS) translated = translated.replace(pattern,replacement);"
new="  let translated = core;\n  for (const [from,to] of PT_BR_FRAGMENTS) translated = translated.split(from).join(to);\n  for (const [pattern,replacement] of WORDS) translated = translated.replace(pattern,replacement);"
if old not in s and new not in s: raise SystemExit('translation fallback marker missing')
s=s.replace(old,new)
p.write_text(s,encoding='utf-8')

# 5) Strengthen regression coverage.
p=Path('server/test/i18n-character-9-28.test.mjs')
s=p.read_text(encoding='utf-8')
if 'normal avatar path receives the explicit vocation id' not in s:
    s += r'''

test('9.28 normal avatar path receives the explicit vocation id', () => {
  const src = read('src/game/playerAvatar.ts');
  assert.match(src, /drawPixelHuman\(ctx, cx, feetY, size \* 1\.08, direction, style, colors, addonMask, time, vocationId\)/);
});

test('9.28 character creation previews use the real pixel renderer', () => {
  const preview = read('src/components/VocationPortrait.tsx');
  const login = read('src/components/LoginScreen.tsx');
  assert.match(preview, /drawPixelHuman/);
  assert.match(preview, /data-vocation-preview/);
  assert.match(login, /VocationPortrait/);
  assert.match(login, /tr\(v\.name\)/);
});

test('9.28 pt-BR catalog includes legacy fragment migration coverage', () => {
  const src = read('src/i18n/index.ts');
  assert.match(src, /PT_BR_FRAGMENTS/);
  assert.match(src, /Recompensa Diária/);
  assert.match(src, /Chance de Crítico/);
  assert.match(src, /Manchetes/);
});
'''
p.write_text(s,encoding='utf-8')
print('9.28 character preview and PT-BR polish applied')
