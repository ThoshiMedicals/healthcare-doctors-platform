#!/usr/bin/env python3
"""Fail-closed Knowledge Centre authority-cluster link and review-readiness gate.

Run from anywhere: python cms/tools/check_authority_cluster_flow.py
Checks links and navigation, NOT the accuracy of clinical information or signatures.
"""
from pathlib import Path
from urllib.parse import urljoin,urlparse
from bs4 import BeautifulSoup
import json,sys
ROOT=Path(__file__).resolve().parents[2]
URL='https://gabbamedicalcentre.com.au/'
DATA=json.loads((ROOT/'cms/authority-cluster-flow-map.json').read_text('utf-8'))
issues=[]
def fail(msg):issues.append(msg)
def content_links(path,selector='main a[href]'):
    doc=BeautifulSoup((ROOT/path).read_text('utf-8'),'html.parser')
    links=set()
    for a in doc.select(selector):
        resolved=urlparse(urljoin(URL+path,a.get('href','')))
        if resolved.hostname in ('gabbamedicalcentre.com.au','www.gabbamedicalcentre.com.au'):
            links.add(resolved.path.lstrip('/') or 'index.html')
    return links,doc
for cluster in DATA['clusters']:
    pages=cluster['members']
    if len(pages)<2:fail(cluster['name']+': isolated topic')
    hub=cluster['hub']
    if not (ROOT/hub).is_file():fail('missing cluster hub '+hub)
    for article in pages:
        if not (ROOT/article).is_file():fail('missing article '+article);continue
        links,doc=content_links(article)
        missing=set(pages)-{article}-links
        if missing:fail(article+': missing cluster peers '+', '.join(sorted(missing)))
        if hub not in links:fail(article+': missing hub '+hub)
        for dest in ('#related-services','#related-practitioners','#related-knowledge-centre-guides'):
            if not doc.select_one(dest+' a[href]'):fail(article+': missing links in '+dest)
        if not doc.select_one('main a[href*="hotdoc"]'):fail(article+': no booking action')
        toc=doc.select_one('nav.on-this-page')
        if not toc:fail(article+': no On This Page navigation')
        else:
            for a in toc.select('a[href^="#"]'):
                if not doc.find(id=a.get('href','')[1:]):fail(article+': bad TOC anchor '+a.get('href',''))
        if not doc.select_one('main details summary'):fail(article+': no FAQ')
        if not doc.select_one('[data-governance-page]'):fail(article+': no governance host')
    if hub=='knowledge/preventive-healthcare.html':
        for h in ('knowledge/healthy-ageing.html','knowledge/preventive-healthcare.html'):
            hub_links,_=content_links(h)
            for article in pages:
                if article not in hub_links:fail(h+': missing shared preventive/ageing page '+article)
for service,pages in DATA['serviceArticleReturnLinks'].items():
    if not (ROOT/service).is_file():fail('missing service '+service);continue
    links,doc=content_links(service)
    if not doc.select_one('#patient-guides') or not doc.select_one('nav.on-this-page a[href="#patient-guides"]'):fail(service+': guide section/anchor absent')
    for article in pages:
        if article not in links:fail(service+': no article return '+article)
        elif service not in content_links(article)[0]:fail(article+': no service return '+service)
for doctor,pages in DATA['practitionerArticleReturnLinks'].items():
    if not (ROOT/doctor).is_file():fail('missing practitioner '+doctor);continue
    links,doc=content_links(doctor)
    if not doc.select_one('#patient-guides') or not doc.select_one('nav.on-this-page a[href="#patient-guides"]'):fail(doctor+': guide section/anchor absent')
    for article in pages:
        if article not in links:fail(doctor+': no guide '+article)
if not (ROOT/'governance-published.js').is_file():fail('missing governance bundle')
if DATA['newArticleCount']!=0:fail('this release cannot create new articles')
if issues:
    print('AUTHORITY CLUSTER FLOW FAIL ('+str(len(issues))+')')
    for msg in issues[:60]:print(' -',msg)
    sys.exit(1)
print('AUTHORITY CLUSTER FLOW PASS | clusters='+str(len(DATA['clusters']))+' | guides='+str(sum(len(c['members']) for c in DATA['clusters']))+' | services='+str(len(DATA['serviceArticleReturnLinks']))+' | practitioners='+str(len(DATA['practitionerArticleReturnLinks']))+' | new articles=0')
