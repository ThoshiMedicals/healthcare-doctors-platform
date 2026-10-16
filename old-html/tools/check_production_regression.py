#!/usr/bin/env python3
"""Production static regression gate: links, fragments, sitemap reachability, breadcrumbs,
booking destinations, widget markup and approved release artefact exclusions.
Call from the site root: python tools/check_production_regression.py
Runtime/provider semantics require separate browser and HotDoc verification.
"""
from __future__ import annotations
from pathlib import Path
from urllib.parse import urljoin,urlparse,unquote
from collections import deque
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re,sys
R=Path(__file__).resolve().parents[1]
SITE='https://gabbamedicalcentre.com.au/'

def audit():
    errors=[]
    pages={f.relative_to(R).as_posix(): BeautifulSoup(f.read_text('utf-8'),'html.parser') for f in R.rglob('*.html')}
    anchors={k:{x['id'] for x in soup.find_all(id=True)} for k,soup in pages.items()}
    outgoing={k:set() for k in pages}
    links=0; fragments=0; crumbs=0; lightboxes=0
    for path,doc in pages.items():
        breadcrumb=doc.find('nav',attrs={'aria-label':'Breadcrumb'})
        if breadcrumb:
            crumbs+=1
            current=breadcrumb.find(attrs={'aria-current':'page'})
            if not current:errors.append(path+': breadcrumb missing current page')
        for element in doc.find_all(['a','link','img','script'],recursive=True):
            key='href' if element.name in ('a','link') else 'src'
            url=(element.get(key) or '').strip()
            if not url or url.lower().startswith(('data:','tel:','mailto:','javascript:','#digital-reception')):
                continue
            if element.name=='a' and element.get('data-hotdoc-widget')=='lightbox':lightboxes+=1
            parsed=urlparse(urljoin(SITE+path,url))
            if parsed.netloc not in ('gabbamedicalcentre.com.au','www.gabbamedicalcentre.com.au'):continue
            tgt=unquote(parsed.path).lstrip('/') or 'index.html'
            if tgt.endswith('/'):
                tgt+='index.html'
            target=R/tgt
            if not target.is_file() and url.startswith(('https://gabbamedicalcentre.com.au/wp-content/uploads/','https://www.gabbamedicalcentre.com.au/wp-content/uploads/')):
                # Preserved external-origin CMS media, not part of the static ZIP.
                continue
            if not target.is_file():
                # Local link/src that cannot resolve is a release error.
                errors.append(path+': missing local target '+url)
                continue
            links+=1
            if tgt.endswith('.html'):
                outgoing[path].add(tgt)
            if element.name=='a' and parsed.fragment:
                fragments+=1
                if tgt not in anchors or unquote(parsed.fragment) not in anchors[tgt]:
                    errors.append(path+': invalid fragment '+url)
        # Local #anchor-only references point to same document.
        for a in doc.select('a[href^="#"]'):
            fragment=unquote(a.get('href','')[1:])
            if fragment and fragment not in anchors[path]:errors.append(path+': missing own anchor #'+fragment)
        if breadcrumb and path not in ('index.html','404.html'):
            home=breadcrumb.select_one('a[href]')
            if not home:errors.append(path+': no breadcrumb home link')
    locations={}
    xroot=ET.parse(R/'sitemap.xml').getroot()
    for n in xroot.findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
        u=urlparse(n.text or '');locations[u.path.lstrip('/') or 'index.html']=True
    public={key for key,doc in pages.items() if 'noindex' not in str(doc.find('meta',attrs={'name':'robots'})).lower()}
    if set(locations)!=public:errors.append('Sitemap differs from indexable pages: '+str((public-set(locations),set(locations)-public)))
    visited={'index.html'};q=deque(['index.html'])
    while q:
        a=q.popleft()
        for b in outgoing[a]:
            if b not in visited:visited.add(b);q.append(b)
    if public-visited:errors.append('Orphan sitemap pages: '+str(sorted(public-visited)))
    # Practitioner-specific destinations must remain consistent and must use approved Lightbox markup.
    doctor_count=0;bookable=0;online_buttons=0
    for path,doc in pages.items():
        if not path.startswith('doctors/'):continue
        doctor_count+=1
        anchors_for_doctor=[a for a in doc.select('a[href]') if re.search(r'Book with Dr\s',a.get_text(' ',strip=True),re.I)]
        if anchors_for_doctor:
            bookable+=1
            urls={a.get('href') for a in anchors_for_doctor}
            if len(urls)!=1:errors.append(path+': mismatched individual doctor URLs')
            for a in anchors_for_doctor:
                online_buttons+=1
                if 'hotdoc.com.au/' not in a['href'] or a.get('data-hotdoc-widget')!='lightbox':
                    errors.append(path+': invalid personal HotDoc lightbox CTA')
    booking=(R/'booking-resilience.js').read_text('utf-8')
    for token in ('Book Online','Call Clinic','data-hotdoc-widget'):
        if token not in booking:errors.append('HotDoc fallback missing '+token)
    digital=(R/'digital-reception.js').read_text('utf-8')
    for token in ('search-index/manifest.json?v=','search-index/','const loadIndex','indexUnavailable','emergency(q)'):
        if token not in digital:errors.append('Digital Reception lazy/emergency missing '+token)
    if not (R/'search-index/manifest.json').is_file() or not (R/'search-index/symptoms.json').is_file():errors.append('Topic-search manifests missing')
    if (R/'styles.css.bak_hero_gap').exists() or (R/'styles.css.bak_logo_prominence').exists():errors.append('Stylesheet backups still shipped')
    if any(R.rglob('__pycache__/*')):errors.append('Compiled Python caches still shipped')
    if errors:
        print('FAIL:',len(errors),'production regression findings')
        for item in errors[:45]:print(' -',item)
        raise SystemExit(1)
    print(f'PASS: {len(pages)} HTML pages, {len(public)} indexable, {links} local file links/references, {fragments} cross-page/inline fragments, {crumbs} breadcrumb trails, no orphan pages')
    print(f'PASS: {doctor_count} practitioner profiles, {bookable} individual booking destinations, {online_buttons} doctor-specific Lightbox CTAs, {lightboxes} website Lightbox anchors')
    print('PASS: Digital Reception lazy and emergency controls, HotDoc fallback markup and deployment artefact exclusions')

if __name__=='__main__':audit()
