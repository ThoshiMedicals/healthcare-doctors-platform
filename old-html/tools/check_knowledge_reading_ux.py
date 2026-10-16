#!/usr/bin/env python3
"""Knowledge Centre reading UX regression: section anchors and patient-care sequence.
Does not alter clinical content or claim clinical approval.
"""
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1]
files=sorted((R/'knowledge').rglob('*.html'))
assert len(files)==102, f'Expected 102 Knowledge Centre pages, found {len(files)}'
article_count=0;hub_count=0
for p in files:
    s=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
    article=s.select_one('main.kc-ux-shell article.kc-ux-page')
    assert article, p
    toc=s.select_one('main .on-this-page .on-this-page-links')
    assert toc and s.select_one('main .on-this-page .on-this-page-title'),p
    assert len(toc.select('a[href^="#"]'))>=3,p
    fragment_ids=[a['href'][1:] for a in toc.select('a[href^="#"]')]
    all_ids={node.get('id') for node in s.select('[id]')}
    assert len(fragment_ids)==len(set(fragment_ids)),p
    assert all(frag in all_ids for frag in fragment_ids),p
    script=s.select_one('script[src$="knowledge-reading.js"]')
    assert script,p
    if 'knowledge-article' in article.get('class',[]):
        article_count+=1
        section_ids=[n.get('id') for n in article.select(':scope > section.article-section')]
        target=['frequently-asked-questions','trusted-australian-information',
                'related-knowledge-centre-guides','related-services','related-practitioners']
        assert [a for a in section_ids if a in target]==target,p
        assert len(article.select('section#frequently-asked-questions details'))>=1,p
        assert len(article.select('#related-knowledge-centre-guides a'))>=1,p
        assert len(article.select('#related-services a'))>=1,p
        assert len(article.select('#related-practitioners a'))>=1,p
        assert len(article.select('.knowledge-final-cta a.wmc-book-appointment'))==1,p
    else:
        hub_count+=1
assert article_count==81 and hub_count==21,(article_count,hub_count)
print('KNOWLEDGE UX PASS | 81 articles | 21 hubs | fragments, FAQs, links, section order, booking intact')
