import json, unicodedata, sys, os
from collections import Counter
D = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(D, '..', 'data.json'), encoding='utf-8'))
LET = list("ABCDEFGHIJLMNÑOPQRSTUVXYZ")
def keep_n(s):
    s = s.lower().replace('ñ', '\0')
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s.replace('\0', 'ñ')
def norm(s): return ''.join(c for c in keep_n(s).replace('ñ','n') if c.isalnum())
err = []; seen = {}
def reg(word, where):
    k = norm(word)
    if k in seen: err.append(f"Repetida '{word}' en {where} y {seen[k]}")
    else: seen[k] = where
cnt = Counter()
for e in data['rosco']:
    l = e['l'].lower(); cnt[(e['n'], e['l'])] += 1
    for a in e['r']:
        w = keep_n(a); ok = w.startswith(l) if e['t'] == 'e' else (l in w)
        if not ok: err.append(f"rosco {e['n']}-{e['l']}: '{a}' no cumple ({e['t']})")
    reg(e['r'][0], f"rosco {e['n']}-{e['l']}")
for n in (1,2,3):
    for l in LET:
        if cnt[(n,l)] < 10: err.append(f"rosco nivel {n} letra {l}: solo {cnt[(n,l)]}")
for q in data['cuatro']:
    if len(q['o']) != 4 or not 0 <= q['c'] < 4: err.append(q['id'])
for p in data['pista']:
    if len(p['h']) != 4: err.append(p['id']); 
    reg(p['r'][0], f"pista {p['id']}")
for c in data['encadenadas']:
    w = c['w']
    if len(c['k']) != len(w) - 1: err.append(c['id'] + ' k')
    for i, k in enumerate(c['k']):
        if not norm(w[i]['r']).endswith(k) or not norm(w[i+1]['r']).startswith(k):
            err.append(f"{c['id']}: {w[i]['r']} -> {w[i+1]['r']} por '{k}'")
    for x in w: reg(x['r'], f"encadenada {c['id']}")
for a in data['anagramas']: reg(a['r'], f"anagrama {a['id']}")
for x in data['letras']: reg(x['r'], f"letra a letra {x['id']}")
for x in data['refran']:
    if x['t'].count('___') != 1: err.append(x['id'] + ' sin ___')
    reg(x['r'][0], f"refrán {x['id']}")
for x in data['vof']:
    if not isinstance(x.get('v'), bool) or not x.get('p'): err.append(x['id'])
for x in data['intrusa']:
    if len(x['o']) != 4 or not 0 <= x['c'] < 4 or len(set(norm(o) for o in x['o'])) != 4: err.append(x['id'])
ids = [x['id'] for k,v in data.items() if isinstance(v, list) for x in v]
if len(ids) != len(set(ids)): err.append('ids duplicados')
print('\n'.join(err) if err else 'OK')
print('Palabras de rosco por nivel:', dict(Counter(e['n'] for e in data['rosco'])))
for k in ('cuatro','vof','intrusa','refran','letras','anagramas','pista','encadenadas'):
    print(k, dict(Counter(x['n'] for x in data[k])))
print('Palabras únicas registradas:', len(seen))
if not err:
    open(os.path.join(D, '..', 'data.js'), 'w', encoding='utf-8').write('window.BANCO=' + json.dumps(data, ensure_ascii=False) + ';\n')
    print('data.js generado')
sys.exit(1 if err else 0)
