#!/usr/bin/env python3
"""Synchronise static header, progressive runtime metadata and breadcrumbs from one manifest.

Run from any directory: python tools/sync_navigation_ownership.py
For any newly published HTML file, first add its canonical record to
navigation-ownership.json. This script fails closed for unlisted HTML routes.
"""
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
import html, json, re, sys
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'navigation-ownership.json'

def load():
 data=json.loads(MANIFEST.read_text(encoding='utf-8'))
 actual={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*.html')}
 expected=set(data['pages'])
 if actual!=expected:raise ValueError('Manifest and HTML routes differ: missing='+str(sorted(actual-expected))+' surplus='+str(sorted(expected-actual)))
 return data

def real_route(page,href):
 p=urlparse(href)
 if p.scheme or p.netloc:raise ValueError('Breadcrumb link is external: '+href)
 return (page.parent / unquote(p.path)).resolve().relative_to(ROOT.resolve()).as_posix()

def read_crumbs(page,markup):
 dom=BeautifulSoup(markup,'html.parser')
 nav=dom.select_one('nav.visible-breadcrumbs')
 if nav is None:return []
 out=[]
 if nav.select_one('ol'):
  for li in nav.select('ol > li'):
   a=li.find('a');last=li.find(attrs={'aria-current':'page'})
   text=(a or last or li).get_text(' ',strip=True).replace('›','').strip()
   out.append({'label':text,'path':real_route(page,a['href']) if a else page.relative_to(ROOT).as_posix()})
 else:
  wrapper=nav.select_one(':scope > .shell') or nav
  for item in wrapper.find_all(['a','span'],recursive=False):
   if item.name=='a':out.append({'label':item.get_text(' ',strip=True),'path':real_route(page,item['href'])})
   elif item.has_attr('aria-current'):out.append({'label':item.get_text(' ',strip=True),'path':page.relative_to(ROOT).as_posix()})
 return out

def href_to(page,route):
 import os
 return os.path.relpath(ROOT/route,page.parent).replace('\\','/')

def make_breadcrumb(page,items,legacy=False):
 nodes=[]
 for i,x in enumerate(items):
  label=html.escape(x['label'],quote=False)
  last=i==len(items)-1
  if legacy:
   nodes.append(f'<span aria-current="page">{label}</span>' if last else f'<a href="{html.escape(href_to(page,x["path"]),quote=True)}">{label}</a>')
  else:
   body=f'<span aria-current="page">{label}</span>' if last else f'<a href="{html.escape(href_to(page,x["path"]),quote=True)}">{label}</a><span aria-hidden="true" class="breadcrumb-separator">›</span>'
   nodes.append(f'<li>{body}</li>')
 if legacy:return '<nav aria-label="Breadcrumb" class="visible-breadcrumbs"><div class="shell">'+' › '.join(nodes)+'</div></nav>'
 return '<nav aria-label="Breadcrumb" class="visible-breadcrumbs"><ol>'+''.join(nodes)+'</ol></nav>'

NAV_RE=re.compile(r'<nav\b(?=[^>]*\bid="primary-nav")[^>]*>.*?</nav>',re.S)
A_RE=re.compile(r'<a\b[^>]*>.*?</a>',re.S)
BC_RE=re.compile(r'<nav\b(?=[^>]*\bclass="visible-breadcrumbs")[^>]*>.*?</nav>',re.S)
SCRIPT_RE=re.compile(r'<script\b[^>]*\btype="application/ld\+json"[^>]*>.*?</script>',re.S)

def sync_nav(markup,page,record,sections):
 match=NAV_RE.search(markup)
 if match is None:raise ValueError('Missing primary nav '+str(page))
 found=match.group(); start=found[:found.index('>')+1]
 start=re.sub(r'\sdata-nav-(owner|is-hub|route)="[^"]*"','',start)
 route=page.relative_to(ROOT).as_posix()
 owner=record['section'] or ''
 hub=owner and next(x['hub'] for x in sections if x['key']==owner)
 is_hub=bool(hub==route)
 start=start[:-1]+f' data-nav-owner="{owner}" data-nav-is-hub="{str(is_hub).lower()}" data-nav-route="{html.escape(route,quote=True)}">'
 old_anchors=A_RE.findall(found)
 if len(old_anchors)!=len(sections):raise ValueError('Unexpected nav link count '+route)
 entries=[]
 for anchor,section in zip(old_anchors,sections):
  open_tag=anchor[:anchor.index('>')+1]
  open_tag=re.sub(r'\s(?:aria-current|data-nav-key)="[^"]*"','',open_tag)
  state='page' if is_hub else 'location'
  extra=f' data-nav-key="{section["key"]}"'
  if owner==section['key']:extra+=f' aria-current="{state}"'
  open_tag=open_tag[:-1]+extra+'>'
  entries.append(open_tag+anchor[anchor.index('>')+1:])
 body=found[found.index('>')+1:found.rfind('</nav>')]
 idx=0
 def replace(_):
  nonlocal idx
  val=entries[idx];idx+=1;return val
 body=A_RE.sub(replace,body)
 updated=start+body+'</nav>'
 return markup[:match.start()]+updated+markup[match.end():]

def strip_breadcrumb_from_data(root):
 if isinstance(root,dict) and root.get('@type')=='BreadcrumbList':return None,True
 if isinstance(root,dict) and isinstance(root.get('@graph'),list):
  old=root['@graph'];new=[o for o in old if not (isinstance(o,dict) and o.get('@type')=='BreadcrumbList')]
  if len(new)!=len(old):
   root['@graph']=new
   if not new and set(root).issubset({'@context','@graph'}):return None,True
   return root,True
 return root,False

def sync_schema(markup,page,record,base_url):
 # Drop stale and duplicated article/organisation BreadcrumbLists, but retain
 # other schema entities and scripts. One manifest-built list per route remains.
 def rewrite(match):
  tag=match.group();op=tag[:tag.find('>')+1]
  inside=tag[len(op):-len('</script>')]
  try:parsed=json.loads(inside)
  except (json.JSONDecodeError,ValueError):return tag
  cleaned,change=strip_breadcrumb_from_data(parsed)
  if not change:return tag
  if cleaned is None:return ''
  return op+json.dumps(cleaned,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+'</script>'
 markup=SCRIPT_RE.sub(rewrite,markup)
 crumbs=record['breadcrumbs']
 if crumbs:
  data={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[
   {'@type':'ListItem','position':i+1,'name':x['label'],'item':urljoin(base_url,x['path'] if x['path']!='index.html' else '')}
   for i,x in enumerate(crumbs)]}
  script='<script data-schema="navigation-breadcrumb" type="application/ld+json">'+json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+'</script>'
  if '</head>' not in markup:raise ValueError('Missing head '+str(page))
  markup=markup.replace('</head>',script+'</head>',1)
 return markup

def apply(data):
 sections=data['sections'];hubs={s['key']:s['hub'] for s in sections}
 for route,record in data['pages'].items():
  p=ROOT/route; content=p.read_text(encoding='utf-8')
  owner=record['section'];crumbs=record['breadcrumbs']
  if owner not in hubs and owner is not None:raise ValueError('Bad owner '+route)
  if owner and hubs[owner] not in [x['path'] for x in crumbs]:raise ValueError('Not aligned breadcrumb owner '+route)
  if crumbs and (crumbs[0]['path']!='index.html' or crumbs[-1]['path']!=route):raise ValueError('Invalid breadcrumb boundary '+route)
  content=sync_nav(content,p,record,sections)
  old_bcs=read_crumbs(p,content)
  if old_bcs!=crumbs:
   found=BC_RE.search(content)
   if not found:raise ValueError('Missing displayed breadcrumb '+route)
   legacy='<ol' not in found.group()
   content=content[:found.start()]+make_breadcrumb(p,crumbs,legacy)+content[found.end():]
   if read_crumbs(p,content)!=crumbs:raise ValueError('Failed breadcrumb rewrite '+route)
  content=sync_schema(content,p,record,data['baseUrl'])
  p.write_text(content,encoding='utf-8')

if __name__=='__main__':
 m=load();apply(m)
 print('Navigation synced for',len(m['pages']),'pages /',sum(v['section']=='knowledge' for v in m['pages'].values())-1,'Knowledge child pages.')
