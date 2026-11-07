import json, unicodedata, sys, os
D = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(D, '..', 'data.json'), encoding='utf-8'))
LET = list("ABCDEFGHIJLMNÑOPQRSTUVXYZ")
def keep_n(s):
    s = s.lower().replace('ñ', '\0')
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s.replace('\0', 'ñ')
def norm(s):
    return ''.join(c for c in keep_n(s).replace('ñ','n') if c.isalnum())
err = []; seen = {}
def reg(word, where):
    k = norm(word)
    if k in seen: err.append(f"Repetida '{word}' en {where} y {seen[k]}")
    else: seen[k] = where
for r in data['roscos']:
    ls = [p['l'] for p in r['p']]
    if ls != LET: err.append(f"{r['id']}: letras {ls}")
    for p in r['p']:
        l = p['l'].lower()
        for a in p['r']:
            w = keep_n(a)
            ok = w.startswith(l) if p['t'] == 'e' else (l in w)
            if not ok: err.append(f"{r['id']} {p['l']}: '{a}' no cumple ({p['t']})")
        reg(p['r'][0], f"rosco {r['id']}-{p['l']}")
for q in data['cuatro']:
    if len(q['o']) != 4 or not 0 <= q['c'] < 4: err.append(q['id'])
for p in data['pista']:
    if len(p['h']) != 4: err.append(p['id'])
    reg(p['r'][0], f"pista {p['id']}")
for c in data['encadenadas']:
    w = c['w']
    if len(c['k']) != len(w) - 1: err.append(c['id'] + ' k')
    for i, k in enumerate(c['k']):
        if not norm(w[i]['r']).endswith(k) or not norm(w[i+1]['r']).startswith(k):
            err.append(f"{c['id']}: {w[i]['r']} -> {w[i+1]['r']} por '{k}'")
    for x in w: reg(x['r'], f"encadenada {c['id']}")
for a in data['anagramas']: reg(a['r'], f"anagrama {a['id']}")
for x in data.get('letras',[]): reg(x['r'], f"letra a letra {x['id']}")
for x in data.get('vof',[]):
    if not isinstance(x.get('v'),bool) or not x.get('p'): err.append(x['id'])
for x in data.get('refran',[]):
    if x['t'].count('___')!=1 or not x['r']: err.append(x['id']+' sin ___')
for x in data.get('intrusa',[]):
    if len(x['o'])!=4 or not 0<=x['c']<4 or len(set(norm(o) for o in x['o']))!=4: err.append(x['id'])
ids = [x['id'] for k in ('roscos','cuatro','pista','encadenadas','anagramas','vof','refran','intrusa','letras') for x in data.get(k,[])]
if len(ids) != len(set(ids)): err.append('ids duplicados')
print('\n'.join(err) if err else 'OK')
from collections import Counter
print('Roscos por nivel:', dict(Counter(r['nivel'] for r in data['roscos'])))
for k in ('cuatro','pista','encadenadas','anagramas','vof','refran','intrusa','letras'):
    print(k, dict(Counter(x['n'] for x in data.get(k,[]))))
if not err:
    open(os.path.join(D, '..', 'data.js'), 'w', encoding='utf-8').write('window.BANCO=' + json.dumps(data, ensure_ascii=False) + ';\n')
    print('data.js generado')
sys.exit(1 if err else 0)
