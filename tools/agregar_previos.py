"""Agrega a data.json las preguntas de juegos previos de un archivo como tools/previos2.txt."""
import json, sys, os
D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, '..', 'data.json')
data = json.load(open(P, encoding='utf-8'))
PFX = {'vof':'v','refran':'r','intrusa':'i','letras':'l','cuatro':'q','anagramas':'a','pista':'p','encadenadas':'c'}
for k in PFX: data.setdefault(k, [])
def next_id(k):
    nums = [int(x['id'][1:]) for x in data[k] if x['id'][1:].isdigit()]
    return PFX[k] + str((max(nums) if nums else 0) + 1).zfill(2)
sec = None; n_add = 0
for line in open(sys.argv[1], encoding='utf-8'):
    line = line.rstrip('\n')
    if not line.strip() or line.startswith('# '): continue
    if line.startswith('## '): sec = line[3:].strip(); continue
    f = line.split('|'); n = int(f[0]); it = {'id': next_id(sec), 'n': n}
    if sec == 'vof': it.update(v = f[1] == 'V', p = f[2])
    elif sec == 'refran': it.update(t = f[1], r = f[2].split(';'))
    elif sec == 'intrusa': it.update(o = f[1].split(';'), c = int(f[2]), x = f[3])
    elif sec == 'letras': it.update(r = f[1], h = f[2])
    elif sec == 'cuatro': it.update(p = f[1], o = f[2].split(';'), c = int(f[3]))
    elif sec == 'anagramas': it.update(r = f[1], h = f[2])
    elif sec == 'pista': it.update(r = f[1].split(';'), h = f[2].split(';'))
    elif sec == 'encadenadas':
        it['k'] = f[1].split(',')
        it['w'] = [{'r': w.split('=',1)[0], 'd': w.split('=',1)[1]} for w in f[2:]]
    data[sec].append(it); n_add += 1
data['version'] = data.get('version', 1) + 1
json.dump(data, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('agregadas', n_add, '| versión', data['version'])
