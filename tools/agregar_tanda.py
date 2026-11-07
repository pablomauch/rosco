"""Agrega a data.json los roscos de un archivo de tanda (formato de tools/tanda2.txt)."""
import json, sys, os
D = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1]
data = json.load(open(os.path.join(D,'..','data.json'), encoding='utf-8'))
ids = {r['id'] for r in data['roscos']}
cur = None; nuevos = []
for line in open(src, encoding='utf-8'):
    line = line.strip()
    if not line or line.startswith('# '): continue
    if line.startswith('## '):
        rid, nivel = line[3:].split(); cur = {'id':rid, 'nivel':int(nivel), 'p':[]}; nuevos.append(cur); continue
    l, t, d, r = line.split('|')
    cur['p'].append({'l':l, 't':t, 'd':d, 'r':[x.strip() for x in r.split(';')]})
for r in nuevos:
    if r['id'] in ids: data['roscos'] = [x for x in data['roscos'] if x['id']!=r['id']]
data['roscos'] += nuevos
data['version'] = data.get('version',1) + (0 if '--no-bump' in sys.argv else 1)
json.dump(data, open(os.path.join(D,'..','data.json'),'w',encoding='utf-8'), ensure_ascii=False, indent=0)
print('roscos:', len(data['roscos']), 'versión', data['version'])
