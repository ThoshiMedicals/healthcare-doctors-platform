#!/usr/bin/env python3
"""Fail a website release on absent, overlong or inconsistent search metadata.

Run `python cms/tools/check_search_metadata.py` from the site root.
This never edits the website. Designed for static production sites rather than
being a guarantee of how an external search engine renders its snippets.
"""
from __future__ import annotations
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[2]
SITE='https://gabbamedicalcentre.com.au/'
TITLE_LIMIT=60
DESCRIPTION_LIMIT=150

def validate():
    errors=[]
    seen=[]
    html_files=sorted(ROOT.rglob('*.html'))
    indexable=0
    for file in html_files:
        relative=file.relative_to(ROOT).as_posix()
        soup=BeautifulSoup(file.read_text('utf-8'),'html.parser')
        title=soup.title.get_text(' ',strip=True) if soup.title else ''
        meta=soup.find('meta',attrs={'name':'description'})
        desc=meta.get('content','').strip() if meta else ''
        robots=soup.find('meta',attrs={'name':'robots'})
        noindex='noindex' in (robots.get('content','').lower() if robots else '')
        if not title or not desc:
            errors.append(f'{relative}: missing title or description')
        if len(title)>TITLE_LIMIT:
            errors.append(f'{relative}: title {len(title)} > {TITLE_LIMIT}')
        if len(desc)>DESCRIPTION_LIMIT:
            errors.append(f'{relative}: description {len(desc)} > {DESCRIPTION_LIMIT}')
        if not noindex:
            indexable+=1
            seen.append((title,relative))
            canonical=soup.find('link',rel='canonical')
            actual=canonical.get('href','') if canonical else ''
            expected=SITE+('' if relative=='index.html' else relative)
            if actual!=expected:
                errors.append(f'{relative}: canonical URL drift: {actual!r} != {expected!r}')
            for kind,name in (('property','og:title'),('property','og:description'),('property','og:url'),('name','twitter:title'),('name','twitter:description')):
                tag=soup.find('meta',attrs={kind:name})
                expected_val=title if name.endswith(':title') else desc if name.endswith(':description') else expected
                actual_val=tag.get('content','') if tag else ''
                if actual_val!=expected_val:
                    errors.append(f'{relative}: missing or inconsistent {name}')
    counts=Counter(t for t,_ in seen)
    for t,c in counts.items():
        if c>1:errors.append(f'duplicate indexable title: {t!r} ({c} pages)')
    if errors:
        print('FAIL: search metadata checks failed')
        for msg in errors:print(' -',msg)
        raise SystemExit(1)
    print(f'PASS: {len(html_files)} HTML pages; {indexable} indexable; unique titles; search descriptions; canonical URLs; Open Graph and Twitter parity; <= {TITLE_LIMIT}/{DESCRIPTION_LIMIT} characters')

if __name__=='__main__':validate()
