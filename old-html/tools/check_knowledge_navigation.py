#!/usr/bin/env python3
"""Regression gate for a single, consistent Knowledge Centre topic navigation."""
from pathlib import Path
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
K = ROOT / 'knowledge'
DATA = json.loads((ROOT / 'cms/knowledge-navigation-groups.json').read_text())
TOPICS = {item['href'] for group in DATA['groups'] for item in group['items']}
PAGES = sorted(K.rglob('*.html'))
errors = []
links_checked = 0

if len(TOPICS) != 20 or len(DATA['groups']) != 4 or len(PAGES) != 102:
    errors.append('Unexpected number of topics, groups or pages')
for path in PAGES:
    soup = BeautifulSoup(path.read_text(), 'html.parser')
    navs = soup.select('aside.page-nav.knowledge-unified-nav[aria-label="Healthcare Knowledge Centre categories"]')
    if len(navs) != 1:
        errors.append(f'{path.name}: expected one unified navigation; found {len(navs)}')
        continue
    nav = navs[0]
    groups = nav.select('details.knowledge-nav-group')
    if len(groups) != len(DATA['groups']):
        errors.append(f'{path.name}: group count differs')
    for elem,group in zip(groups,DATA['groups']):
        if elem.summary.get_text(' ',strip=True) != group['title']:
            errors.append(f'{path.name}: group header differs')
        if elem.get('open') is None:
            errors.append(f'{path.name}: must be visible without JavaScript')
        anchors = elem.select(':scope > .knowledge-nav-links > a')
        if len(anchors) != len(group['items']):
            errors.append(f'{path.name}: topic count differs in {group["title"]}')
        for anchor,item in zip(anchors,group['items']):
            if anchor.get_text(' ',strip=True) != item['label']:
                errors.append(f'{path.name}: topic label differs: {item["label"]}')
            dest = (path.parent / anchor.get('href','')).resolve()
            if dest != (K / item['href']).resolve():
                errors.append(f'{path.name}: incorrect topic target {anchor.get("href")}')
            links_checked += 1
    selected = nav.select('a.active')
    if len(selected)!=1:
        errors.append(f'{path.name}: expected one active hub; found {len(selected)}')
    else:
        selected_href = (path.parent / selected[0]['href']).resolve()
        if selected_href.parent != K or selected_href.name not in TOPICS | {'index.html'}:
            errors.append(f'{path.name}: active hub target invalid')
        if path.parent == K and selected_href != path.resolve():
            errors.append(f'{path.name}: page should have itself as active hub')
        if path.parent == K / 'articles' and selected[0].get('aria-current') != 'location':
            errors.append(f'{path.name}: hub on article must use aria-current=location')
        active_group = nav.select('details[data-current-group="true"]')
        if selected_href.name == 'index.html':
            if active_group: errors.append(f'{path.name}: home cannot activate a topic group')
        elif len(active_group) != 1 or selected[0] not in active_group[0].descendants:
            errors.append(f'{path.name}: wrong active disclosure group')
    if len(nav.select('a[href]')) != 21:
        errors.append(f'{path.name}: incomplete or duplicate sidebar list')
    script = soup.select('script[src*="knowledge-navigation.js"]')
    if len(script)!=1 or not (path.parent / script[0]['src']).is_file():
        errors.append(f'{path.name}: missing or duplicate local navigation controller')
    if soup.select('body.home-page'):
        errors.append(f'{path.name}: knowledge navigation should not appear on homepage')
if errors:
    print(f'FAIL {len(errors)} issues:')
    print('\n'.join(errors[:35]))
    sys.exit(1)
print(f'PASS: {len(PAGES)} Knowledge Centre pages, one navigation each, {len(DATA["groups"])} groups, {len(TOPICS)} unique topics, {links_checked} checked group links')
print('PASS: active locations, static no-JS fallback, on-disk targets, responsive controller references')
