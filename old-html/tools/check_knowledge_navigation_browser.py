#!/usr/bin/env python3
"""Isolated Chromium regression: real header, footer, sidebar and production CSS/JS.
No third-party network or HotDoc traffic is required. No website content is changed.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT/'styles.css').read_text()
JS = (ROOT/'knowledge-navigation.js').read_text()
CASES = ('knowledge/index.html','knowledge/headache.html','knowledge/diabetes.html','knowledge/articles/understanding-neck-pain.html')
SIZES = ((1440,900),(1280,680),(1100,620),(1025,700),(1024,768),(820,820),(768,900),(390,844),(320,640))
errors=[]
checked=0

def fixture(path):
    soup = BeautifulSoup((ROOT/path).read_text(), 'html.parser')
    header = soup.select_one('header')
    nav = soup.select_one('aside.knowledge-unified-nav')
    assert nav and header
    # A deliberately long article ensures that footer containment is tested at scroll bottom.
    return f'''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>{CSS}</style></head>
      <body><header>{header.decode_contents()}</header><main class="page-main"><div class="shell page-layout">
      {str(nav)}<article class="article" style="min-height:1650px"><h1>Preserved patient education</h1>
      <p style="padding-top:70px">The article remains scrollable.</p></article></div></main>
      <footer style="min-height:360px"><div class="shell">Practice footer</div></footer></body></html>'''

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in SIZES:
        for path in CASES:
            page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
            page.set_content(fixture(path),wait_until='domcontentloaded',timeout=30000)
            page.evaluate(JS)
            aside=page.locator('aside.knowledge-unified-nav')
            groups=aside.locator('details.knowledge-nav-group')
            toggle=aside.locator('button.knowledge-topics-toggle')
            content=aside.locator('.knowledge-topics-content')
            assert groups.count()==4 and aside.locator('a[href]').count()==21
            # Exactly one expansion maximum: desktop landing shows first, others show their active group.
            open_count=sum(groups.nth(i).evaluate('(e)=>e.open') for i in range(4))
            if width>1024 and open_count!=1: errors.append(f'{width} {path} expected exactly one desktop group, got {open_count}')
            if width<=1024 and open_count>1: errors.append(f'{width} {path} multiple compact groups open')
            if width>1024:
                vals=aside.evaluate('e => ({position:getComputedStyle(e).position,overflow:getComputedStyle(e).overflowY,height:e.getBoundingClientRect().height,max:e.style.maxHeight||getComputedStyle(e).maxHeight})')
                if vals['position']!='sticky' or vals['overflow']!='auto': errors.append(f'{width} {path} sticky/scroll incorrect: {vals}')
                if vals['height'] > height - 130:errors.append(f'{width} {path} sidebar exceeds viewport: {vals}')
            if width<=700:
                if not toggle.is_visible() or content.is_visible(): errors.append(f'{width} {path} mobile topics not collapsed')
                if aside.bounding_box()['y'] > page.locator('article').bounding_box()['y']:
                    errors.append(f'{width} {path} compact mobile menu not discoverable before article')
                toggle.click()
                if not content.is_visible() or toggle.get_attribute('aria-expanded')!='true':errors.append(f'{width} {path} toggle failed')
                toggle.focus()
                page.keyboard.press('Enter')
                if content.is_visible():errors.append(f'{width} {path} keyboard close failed')
                toggle.click()
            elif not content.is_visible() or toggle.is_visible():errors.append(f'{width} {path} desktop/tablet disclosure mode incorrect')
            # Native summary keyboard support and one-open behaviour at all widths.
            other=next(i for i in range(4) if not groups.nth(i).evaluate('(e)=>e.open'))
            summary=groups.nth(other).locator('summary')
            summary.focus()
            page.keyboard.press('Enter')
            page.wait_for_timeout(70)
            now=sum(groups.nth(i).evaluate('(e)=>e.open') for i in range(4))
            if now!=1 or not groups.nth(other).evaluate('(e)=>e.open'):errors.append(f'{width} {path} accordion not single-open after keyboard activation')
            # Verify full nav is accessible in a deliberately short viewport/sidebar.
            if width>1024:
                aside.evaluate('(e)=>{e.style.setProperty("max-height","170px","important");e.style.setProperty("overflow-y","auto","important")}')
                target=aside.locator('a[href$="telehealth-access-to-care.html"]')
                # Make the lowest group open; keyboard focus must scroll the sidebar itself.
                groups.nth(3).locator('summary').click()
                target.focus()
                page.wait_for_timeout(60)
                scroll=aside.evaluate('(e)=>({top:e.scrollTop, range:e.scrollHeight-e.clientHeight})')
                if scroll['range']<=0 or scroll['top']<=0:errors.append(f'{width} {path} sidebar last topic inaccessible: {scroll}')
                aside.evaluate('(e)=>{e.style.removeProperty("max-height");e.style.removeProperty("overflow-y")}')
            # Scroll to end and ensure sidebar's box never covers footer, regardless of accordion.
            page.locator('footer').scroll_into_view_if_needed()
            page.wait_for_timeout(50)
            a=aside.bounding_box(); foot=page.locator('footer').bounding_box()
            if a and foot and a['y']+a['height']>foot['y']+2:
                errors.append(f'{width} {path} sidebar overlaps footer by {round(a["y"]+a["height"]-foot["y"],1)}px')
            if page.evaluate('document.documentElement.scrollWidth>innerWidth+1'):errors.append(f'{width} {path} horizontal overflow')
            checked+=1
            page.close()
    # No-JavaScript fallback: all category links remain reachable, including on small screens.
    for width in (1440,390):
        page=browser.new_page(viewport={'width':width,'height':680},java_script_enabled=False)
        page.set_content(fixture('knowledge/index.html'),wait_until='domcontentloaded')
        nav=page.locator('aside.knowledge-unified-nav')
        if nav.locator('a[href]').count()!=21:errors.append(f'{width} noJS links missing')
        if not all(nav.locator('details').nth(i).evaluate('(e)=>e.open') for i in range(4)):
            errors.append(f'{width} noJS categories not accessible')
        page.close()
    browser.close()

if errors:
    print('FAIL: '+str(len(errors))+' navigation issues')
    print('\n'.join(errors[:30]))
    raise SystemExit(1)
print(f'PASS: {checked} real-markup layout/interaction cases (9 viewport sizes x 4 Knowledge Centre pages)')
print('PASS: desktop sticky scroll, single-open accordion, keyboard disclosure, mobile compact menu')
print('PASS: footer containment, horizontal overflow, 21 category links and no-JS fallback')
