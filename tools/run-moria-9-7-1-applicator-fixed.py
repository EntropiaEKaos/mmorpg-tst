from pathlib import Path

source = Path('tools/apply-moria-9-7-1-spatial.py').read_text()
changes = {
'''"  const showBar=request.distance<=options.monsterBarDistance||boss||request.targeted;",''': '''"  const showBar = request.distance <= options.monsterBarDistance || boss || request.targeted;",''',
'''"  const damaged=hp<maxHp;\\n  const showBar=boss||request.targeted===true||(elite&&request.distance<=options.monsterBarDistance)||(damaged&&request.distance<=options.monsterBarDistance);"''': '''"  const damaged = (Number(monster.hp) || 0) < Math.max(1, Number(monster.maxHp) || 1);\\n  const showBar = boss || request.targeted === true || (elite && request.distance <= options.monsterBarDistance) || (damaged && request.distance <= options.monsterBarDistance);"''',
'''"    const preferredY=request.y-Math.round(request.size*(boss?.58:.40))-height;",''': '''"    const preferredY = request.y - Math.round(request.size * (boss ? .58 : .40)) - height;",''',
'''"    const visualHeight=Math.max(request.size*.55,request.visualHeight??request.size*.86);\\n    const spriteTop=request.y+request.size-visualHeight;\\n    const preferredY=Math.round(spriteTop-5-height);"''': '''"    const visualHeight = Math.max(request.size * .55, request.visualHeight ?? request.size * .86);\\n    const spriteTop = request.y + request.size - visualHeight;\\n    const preferredY = Math.round(spriteTop - 5 - height);"''',
'''"      size,distance:dist(playerPos,n.pos),entity:{name:n.name,role:n.role},",''': '''"      requests.push({ kind: 'npc', x, y, size, distance: Math.hypot(n.pos.x - playerPos.x, n.pos.y - playerPos.y), entity: { name: n.name, role: n.role } });",''',
'''"      size,visualHeight:size*.88,distance:dist(playerPos,n.pos),entity:{name:n.name,role:n.role},")''': '''"      requests.push({ kind: 'npc', x, y, size, visualHeight: size * .88, distance: Math.hypot(n.pos.x - playerPos.x, n.pos.y - playerPos.y), entity: { name: n.name, role: n.role } });")''',
'''"      kind:'monster',x:sx,y:sy,size,distance:dist(playerPos,{x:mx,y:my}),targeted:String(targetId||'')===String(m.id||''),",''': '''"      requests.push({ kind: 'monster', x, y, size, distance: Math.hypot(mx - playerPos.x, my - playerPos.y), targeted: targetId === m.id, entity: { name: m.name, hp: m.hp, maxHp: m.maxHp, level: m.level, type: m.type } });",''',
'''"      kind:'monster',x:sx,y:sy,size,visualHeight:size*Math.max(.68,Math.min(1.55,.72+Number(m.size??m.msSize??1)*.32)),distance:dist(playerPos,{x:mx,y:my}),targeted:String(targetId||'')===String(m.id||''),")''': '''"      requests.push({ kind: 'monster', x, y, size, visualHeight: size * Math.max(.68, Math.min(1.55, .72 + Number(m.size ?? m.msSize ?? 1) * .32)), distance: Math.hypot(mx - playerPos.x, my - playerPos.y), targeted: targetId === m.id, entity: { name: m.name, hp: m.hp, maxHp: m.maxHp, level: m.level, type: m.type } });")''',
}
for old, new in changes.items():
    if old not in source:
        raise SystemExit(f'adapter anchor missing: {old[:120]!r}')
    source = source.replace(old, new, 1)
exec(compile(source, 'apply-moria-9-7-1-spatial-fixed.py', 'exec'), {'__name__': '__main__'})
