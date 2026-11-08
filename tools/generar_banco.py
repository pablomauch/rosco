"""Genera data.json desde cero a partir de tools/banco/*.txt (rosco_1..3 y previos)."""
import json, os, glob
D = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(D, 'banco')
data = {'version': 4, 'rosco': [], 'cuatro': [], 'vof': [], 'intrusa': [], 'refran': [], 'letras': [], 'anagramas': [], 'pista': [], 'encadenadas': []}
for f in sorted(glob.glob(os.path.join(B, 'rosco_*.txt'))):
    n = None
    for line in open(f, encoding='utf-8'):
        line = line.strip()
        if not line: continue
        if line.startswith('# '): n = int(line[2:]); continue
        l, t, d, r = line.split('|')
        data['rosco'].append({'id': f"r{n}{len(data['rosco'])+1:04d}", 'n': n, 'l': l, 't': t, 'd': d, 'r': [x.strip() for x in r.split(';')]})
PFX = {'vof':'v','refran':'f','intrusa':'i','letras':'l','cuatro':'q','anagramas':'a','pista':'p','encadenadas':'c'}
sec = None
for line in open(os.path.join(B, 'previos.txt'), encoding='utf-8'):
    line = line.rstrip('\n')
    if not line.strip() or line.startswith('# '): continue
    if line.startswith('## '): sec = line[3:].strip(); continue
    f = line.split('|'); it = {'id': PFX[sec] + str(len(data[sec]) + 1).zfill(3), 'n': int(f[0])}
    if sec == 'vof': it.update(v = f[1] == 'V', p = f[2])
    elif sec == 'refran': it.update(t = f[1], r = f[2].split(';'))
    elif sec == 'intrusa': it.update(o = f[1].split(';'), c = int(f[2]), x = f[3])
    elif sec in ('letras', 'anagramas'): it.update(r = f[1], h = f[2])
    elif sec == 'cuatro': it.update(p = f[1], o = f[2].split(';'), c = int(f[3]))
    elif sec == 'pista': it.update(r = f[1].split(';'), h = f[2].split(';'))
    elif sec == 'encadenadas':
        it['k'] = f[1].split(','); it['w'] = [{'r': w.split('=',1)[0], 'd': w.split('=',1)[1]} for w in f[2:]]
    data[sec].append(it)
json.dump(data, open(os.path.join(D, '..', 'data.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print({k: len(v) for k, v in data.items() if isinstance(v, list)})
