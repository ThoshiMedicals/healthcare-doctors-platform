#!/usr/bin/env python3
"""Generate Digital Reception's topic-based, lazily fetched JSON corpus.

Purely derived from the same verified 195-page public index. Do not edit the
JSON files manually: use build_digital_reception_index.py --build.
"""
from pathlib import Path
import hashlib,json,re

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'search-index'
NAMES=['symptoms','conditions','mental-health','life-stages','prevention','services','doctors',
       'billing','appointments','referrals','pathology','imaging','prescriptions','administration']
STOP={'a','an','the','i','is','are','in','at','to','for','from','my','me','can','how','do','does','of','with','about','what','where','when','and','or','we','your','you','our','on','please','have','get','find','need'}

def classify(e,articles,hubs):
    u=e['url']; cat=e['category']
    if cat=='Doctor' or u.startswith('doctors/'):return 'doctors'
    if cat=='Service' or u.startswith('services/'):
        if 'pathology' in u:return 'pathology'
        if 'radiology' in u or 'ecg' in u:return 'imaging'
        return 'services'
    if cat=='Knowledge Centre':
        topic=articles.get(u) or hubs.get(u,'')
        if u=='knowledge/index.html':return 'administration'
        if topic in ('Headache & Migraine','Cough & Sore Throat','Pain & Musculoskeletal Health','Sleep & Fatigue'):return 'symptoms'
        if topic in ('Diabetes & Ongoing Care','Blood Pressure & Heart Health','Chronic Disease Management'):return 'conditions'
        if topic in ('Mental Health','ADHD & Neurodiversity'):return 'mental-health'
        if topic in ("Women's Health","Men's Health","Children's Health",'Pregnancy & Antenatal Care','Menopause & Midlife Health','Healthy Ageing','Weight & Healthy Lifestyle'):return 'life-stages'
        return 'prevention'
    if 'referrals' in u:return 'referrals'
    if any(s in u for s in ('scripts','prescrib','prescription')):return 'prescriptions'
    if any(s in u for s in ('result','pathology')):return 'pathology'
    if any(s in u for s in ('radiology','imaging')):return 'imaging'
    if any(s in u for s in ('billing','medicare','fees','bulk-billing')):return 'billing'
    if any(s in u for s in ('appointment','telehealth','after-hours')):return 'appointments'
    return 'administration'

def render(entries):
    articles={a['url']:a.get('category','') for a in json.loads((ROOT/'cms/knowledge-centre-articles.json').read_text())['articles']}
    hubs={a['url']:a['name'] for a in json.loads((ROOT/'cms/knowledge-centre-content-architecture.json').read_text())['categories']}
    shards={n:[] for n in NAMES};routing={}; strong={}
    for e in entries:
        name=classify(e,articles,hubs)
        shards[name].append(e);routing[e['url']]=name
        text=' '.join(str(e.get(k,'')) for k in ['title','h1','description','headings','keywords'])
        for term in sorted(set(re.findall('[a-z0-9]+',text.lower()))):
            if term not in STOP:strong[term]=strong.get(term,0)|(1<<NAMES.index(name))
    assert len(routing)==len(entries)==len(set(routing))
    assert all(shards.values())
    # Used to display independently sourced service/practitioner links without
    # fetching unrelated large content shards. No medical judgment is inferred.
    catalog=[{k:e[k] for k in ('url','title','h1','category','description','related')} for e in entries]
    payloads={name+'.json':json.dumps(shards[name],ensure_ascii=False,separators=(',',':'))+'\n' for name in NAMES}
    payloads['manifest.json']=json.dumps({'schema':1,'count':len(entries),'shards':NAMES,'routes':routing,'strong':strong,'catalog':catalog},ensure_ascii=False,separators=(',',':'))+'\n'
    return payloads

def apply(entries,check=False):
    files=render(entries)
    if not check:OUT.mkdir(exist_ok=True)
    for name,content in files.items():
        path=OUT/name
        if check:
            if not path.exists() or path.read_text('utf-8')!=content:
                raise ValueError('Stale Digital Reception topic index: '+name+' (run --build)')
        elif not path.exists() or path.read_text('utf-8')!=content:
            path.write_text(content,'utf-8')
    # A changing article must update the cache key for both manifest and every
    # shard; a stale cache must never show obsolete healthcare information.
    fingerprint=hashlib.sha256(files['manifest.json'].encode('utf-8')).hexdigest()[:12]
    controller_path=ROOT/'digital-reception.js'
    controller=controller_path.read_text('utf-8')
    for regex in (r'(search-index/manifest\.json\?v=)[0-9a-f]{12}',r"(name\+'\.json\?v=)[0-9a-f]{12}"):
        refreshed,n=re.subn(regex,lambda m:m.group(1)+fingerprint,controller)
        if n!=1:raise ValueError('Search controller version slot missing: '+regex)
        controller=refreshed
    if check:
        if controller!=controller_path.read_text('utf-8'):raise ValueError('Stale Digital Reception topic cache version (run --build)')
    elif controller!=controller_path.read_text('utf-8'):
        controller_path.write_text(controller,'utf-8')
    extra=[p.name for p in OUT.glob('*.json') if p.name not in files]
    if extra:raise ValueError('Obsolete topic indexes require explicit review: '+str(extra))
    print('PASS: Digital Reception topic datasets current:',len(entries),'pages in',len(NAMES),'topic files')
