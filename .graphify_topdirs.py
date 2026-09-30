import json
from collections import Counter
d = json.load(open('.graphify_detect.json'))
c = Counter()
for k, files in d.get('files', {}).items():
    for f in files:
        parts = f.replace('\\', '/').split('/')
        lvl2 = '/'.join(parts[:2]) if len(parts) > 2 else (parts[0] if len(parts) > 1 else '(root)')
        c[lvl2] += 1
for name, cnt in c.most_common(10):
    print(cnt, name)