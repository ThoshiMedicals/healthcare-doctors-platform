#!/usr/bin/env python3
"""Synchronise a single patient-facing Knowledge Centre sidebar across its pages.

The sidebar is static HTML for SEO and accessibility; the tiny JavaScript enhancer
only manages narrow-screen disclosure state. Rerunning this is safe/idempotent.
"""
from __future__ import annotations
import html
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE = ROOT / 'knowledge'
CONFIG = json.loads((ROOT / 'cms/knowledge-navigation-groups.json').read_text())
SIDEBAR_RE = re.compile(r'<aside\b(?=[^>]*\bclass="[^"]*\bpage-nav\b[^"]*")(?=[^>]*aria-label="Healthcare Knowledge Centre categories")[^>]*>.*?</aside>', re.S)
SCRIPT_RE = re.compile(r'<script\b[^>]*\bsrc="[^\"]*knowledge-navigation\.js"[^>]*>\s*</script>', re.S)


def render(prefix: str, active: str, is_hub: bool) -> str:
    a = ['<aside aria-label="Healthcare Knowledge Centre categories" class="page-nav knowledge-unified-nav" id="related-pages" data-knowledge-nav="unified">',
         '<div class="nav-title">Knowledge Centre</div>']
    home = CONFIG['home']
    active_home = active == home['href']
    a.append(f'<a class="knowledge-nav-home{" active" if active_home else ""}" href="{prefix}{home["href"]}"' +
             (' aria-current="page"' if active_home else '') + f'>{html.escape(home["label"])}</a>')
    a.append('<div class="knowledge-nav-groups">')
    for i, group in enumerate(CONFIG['groups'], 1):
        present = any(x['href'] == active for x in group['items'])
        a.append(f'<details class="knowledge-nav-group" data-knowledge-group="{i}"{" data-current-group=\"true\"" if present else ""} open>')
        a.append(f'<summary>{html.escape(group["title"])}</summary>')
        a.append('<div class="knowledge-nav-links">')
        for item in group['items']:
            active_item = active == item['href']
            state = (' class="active"' if active_item else '')
            current = (' aria-current="page"' if (active_item and is_hub) else (' aria-current="location"' if active_item else ''))
            a.append(f'<a href="{prefix}{item["href"]}"{state}{current}>{html.escape(item["label"])}</a>')
        a.append('</div></details>')
    a.append('</div></aside>')
    return ''.join(a)


def build() -> tuple[int,int]:
    hrefs = {CONFIG['home']['href']} | {i['href'] for group in CONFIG['groups'] for i in group['items']}
    if len(hrefs) != 21:
        raise ValueError('Expected one Knowledge Centre home and exactly 20 unique topic hubs')
    for href in hrefs:
        if not (KNOWLEDGE / href).is_file():
            raise FileNotFoundError(f'Missing topic hub: {href}')
    changes = 0
    pages = sorted(KNOWLEDGE.rglob('*.html'))
    for path in pages:
        source = path.read_text()
        found = SIDEBAR_RE.findall(source)
        if len(found) != 1:
            raise RuntimeError(f'Expected one Knowledge Centre sidebar in {path}: got {len(found)}')
        old_sidebar = BeautifulSoup(found[0], 'html.parser')
        current = old_sidebar.select_one('a.active')
        if current is None or not current.get('href'):
            raise RuntimeError(f'Current group unavailable for {path}')
        dest = (path.parent / current['href'].split('#')[0]).resolve()
        if dest.parent != KNOWLEDGE:
            raise RuntimeError(f'Unrecognised sidebar selection {path}: {dest}')
        active = dest.name
        if active not in hrefs:
            raise RuntimeError(f'Unrecognised category: {active}')
        prefix = '../' if path.parent == KNOWLEDGE / 'articles' else ''
        new_source = SIDEBAR_RE.sub(lambda _: render(prefix, active, path.parent == KNOWLEDGE), source, count=1)
        script = f'<script defer="" src="{prefix}../knowledge-navigation.js"></script>'
        if SCRIPT_RE.search(new_source):
            new_source = SCRIPT_RE.sub(script, new_source, count=1)
        else:
            new_source = new_source.replace('</body>', script + '</body>')
        if new_source != source:
            path.write_text(new_source)
            changes += 1
    return changes,len(pages)

if __name__ == '__main__':
    changed, total = build()
    print(f'Unified navigation generated for {total} Knowledge Centre pages ({changed} modified).')
