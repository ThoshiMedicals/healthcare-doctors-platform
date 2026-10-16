#!/usr/bin/env python3
"""Exhaustive static navigation, breadcrumb, structured-data and link certification."""
from pathlib import Path
from urllib.parse import urlparse,unquote,urljoin
from bs4 import BeautifulSoup
from collections import Counter
import hashlib,json,sys
from sync_navigation_ownership import ROOT,read_crumbs,MANIFEST
M=json.loads(MANIFEST.read_text(encoding='utf-8'))
SECTIONS=M['sections'];PAGES=M['pages'];stats=Counter();errors=[];missing=[]

def err(route,*parts):errors.append({'page':route,'error':' '.join(str(x) for x in parts)})
for route,record in PAGES.items():
 p=ROOT/route;markup=p.read_text(encoding='utf-8');dom=BeautifulSoup(markup,'html.parser');stats['pages']+=1
 nav=dom.select_one('#primary-nav');links=nav.select('a[href]') if nav else []
 if len(links)!=7:err(route,'nav link count',len(links));continue
 keys=[x.get('data-nav-key') for x in links]
 if keys!=[x['key'] for x in SECTIONS]:err(route,'wrong key order',keys)
 labels=[x.get_text(' ',strip=True) for x in links]
 if labels!=[x['label'] for x in SECTIONS]:err(route,'wrong nav labels',labels)
 sect=record['section'];hub=next((x['hub'] for x in SECTIONS if x['key']==sect),None)
 if nav.get('data-nav-owner')!=(sect or ''):err(route,'bad owner attr')
 if nav.get('data-nav-is-hub')!=str(hub==route).lower():err(route,'bad hub attr')
 if nav.get('data-nav-route')!=route:err(route,'bad nav route')
 active=[x for x in links if x.get('aria-current')]
 state='page' if route==hub else 'location'
 if sect:
  if len(active)!=1 or active[0].get('data-nav-key')!=sect or active[0].get('aria-current')!=state:err(route,'bad active',[(x.get('data-nav-key'),x.get('aria-current')) for x in active])
  stats['active_'+sect]+=1
 else:
  if active:err(route,'unowned page has active state')
 for link in links:
  u=urlparse(link.get('href',''))
  if u.scheme or u.netloc:err(route,'external header link',u.geturl());continue
  dest=(p.parent/unquote(u.path)).resolve()
  if not dest.is_file():err(route,'broken header link',link.get('href'))
  stats['header_links']+=1
 crumbs=read_crumbs(p,markup)
 if crumbs!=record['breadcrumbs']:err(route,'visible breadcrumbs differ from manifest')
 else:stats['breadcrumb_path_valid']+=1
 bnav=dom.select_one('nav.visible-breadcrumbs')
 if sect and (not bnav or len(bnav.select('[aria-current="page"]'))!=1):err(route,'invalid visible breadcrumb current marker')
 for crumb in crumbs[:-1]:
  if not (ROOT/crumb['path']).is_file():err(route,'broken breadcrumb link',crumb)
  stats['breadcrumb_links']+=1
 all_bc=[];all_entities=[]
 for script in dom.select('script[type="application/ld+json"]'):
  try:data=json.loads(script.string or script.get_text())
  except Exception as e:err(route,'invalid JSON-LD',e);continue
  ds=[data]+(data.get('@graph',[]) if isinstance(data,dict) else [])
  for entity in ds:
   if isinstance(entity,dict):
    if entity.get('@type')=='BreadcrumbList':all_bc.append(entity)
    else:all_entities.append(entity)
 if len(all_bc)!=(1 if crumbs else 0):err(route,'breadcrumb schema count',len(all_bc))
 if crumbs and len(all_bc)==1:
  entries=all_bc[0]['itemListElement']
  for i,x in enumerate(crumbs):
   expected=urljoin(M['baseUrl'],x['path'] if x['path']!='index.html' else '')
   actual=entries[i] if i<len(entries) else {}
   if actual.get('position')!=i+1 or actual.get('name')!=x['label'] or actual.get('item')!=expected:err(route,'JSON-LD crumb mismatch',i)
 stats['schema_entities']+=len(all_entities)
 if not dom.select_one('main#main') or not dom.select_one('header') or not dom.select_one('footer'):err(route,'missing landmark')
 if route.startswith('knowledge/') and route!='knowledge/index.html':stats['knowledge_children']+=1
 if route in ['book-appointment.html','medicare-exclusions.html','new-patient-prescribing-policy.html','patient-code-of-conduct.html'] and sect=='patient-info':stats['corrected_patient_files']+=1
 if route=='join-our-team.html' and sect=='about':stats['corrected_careers']=1
for f in ROOT.rglob('*.html'):
 dom=BeautifulSoup(f.read_text(encoding='utf-8'),'html.parser')
 for a in dom.select('a[href]'):
  href=a.get('href');u=urlparse(href)
  if u.scheme or u.netloc or href.startswith('#') or href.startswith('tel:') or href.startswith('mailto:'):continue
  if not u.path:continue
  target=(f.parent/unquote(u.path)).resolve()
  if not target.is_file():missing.append({'page':f.relative_to(ROOT).as_posix(),'href':href})
report={'static_stats':dict(stats),'errors':errors,'all_local_missing':missing,'local_missing_count':len(missing),'passed':len(errors)==0}
output=ROOT/'qa'/'navigation-ownership-qa.json';output.parent.mkdir(exist_ok=True)
output.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print('Pages',stats['pages'],'Header links',stats['header_links'],'Breadcrumb parent links',stats['breadcrumb_links'],'Knowledge children',stats['knowledge_children'],'Patient utilities',stats['corrected_patient_files'],'schema other entities',stats['schema_entities'])
print('Navigation/breadcrumb errors:',len(errors),'Other local links missing:',len(missing),'examples:',missing[:10])
if errors:print('ERRORS:',errors[:20]);sys.exit(1)
