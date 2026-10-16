#!/usr/bin/env python3
"""Release gate: exercise real Digital Reception JavaScript against approved query cases.

Run from website root: python cms/tools/check_digital_reception_coverage.py
Requires playwright Python package and installed Chromium for browser-based checks.
Does not access external sites or submit patient information; runs on an isolated page.
"""
from pathlib import Path
import shutil
import json
import sys

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/'cms/digital-reception-coverage-qa.json'
SCRIPT=ROOT/'digital-reception.js'
INDEX=ROOT/'search-index/manifest.json'


def main():
    data=json.loads(MANIFEST.read_text('utf-8'))
    cases=data['cases']
    if len(cases)!=49:
        raise ValueError('Coverage matrix case count changed; reconcile with patient-intent requirements')
    source=SCRIPT.read_text('utf-8')
    payload=INDEX.read_text('utf-8')
    for case in cases:
        if not (ROOT/case['expected_result_url']).is_file():
            raise ValueError('Broken acceptance target: '+case['expected_result_url'])
    from playwright.sync_api import sync_playwright
    # Avoid external-site navigation in browser isolation.
    source=source.replace(
        "const SCRIPT_URL=(SCRIPT_NODE&&SCRIPT_NODE.src)?SCRIPT_NODE.src:location.href;",
        "const SCRIPT_URL='https://gabbamedicalcentre.com.au/digital-reception.js';")
    errors=[]
    failures=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('chromium-browser') or None,args=['--no-sandbox','--disable-dev-shm-usage'])
        for width in [1440,390,320]:
            page=browser.new_page(viewport={'width':width,'height':850},device_scale_factor=1)
            page.on('pageerror',lambda err:errors.append(str(err)))
            requests=[]
            def topic_route(route):
                url=route.request.url
                relative=url.split('/search-index/',1)[1].split('?',1)[0]
                target=ROOT/'search-index'/relative
                requests.append(relative)
                if not target.is_file():route.fulfill(status=404,body='Not found')
                else:route.fulfill(status=200,content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=target.read_bytes())
            page.route('**/search-index/**',topic_route)
            page.route('**/digital-reception-index.js*',lambda route:route.fulfill(status=200,content_type='text/javascript',body=(ROOT/'digital-reception-index.js').read_bytes()))
            page.set_content('<html lang="en-AU"><head></head><body><main><h1>Practice</h1></main></body></html>')
            page.add_style_tag(content=(ROOT/'styles.css').read_text('utf-8'))
            page.add_script_tag(content=source)
            if requests:failures.append(f'{width}px: eager index requested before opening')
            page.locator('.digital-reception-launcher').click()
            page.wait_for_function('document.querySelector(".digital-reception-status")?.textContent.includes("Enter a topic")',timeout=20000)
            if requests!=['manifest.json']:failures.append(f'{width}px: expected only the router on open, got {requests}')
            for case in cases:
                page.locator('.digital-reception-input').fill(case['query'])
                page.locator('.digital-reception-search').click()
                page.wait_for_function('''() => {const el=document.querySelector('.digital-reception-results');return el&&!el.hasAttribute('aria-busy')&&!el.textContent.includes('Finding relevant website information');}''',timeout=25000)
                # Show more is intentionally incremental and preserves result order.
                while page.locator('.digital-reception-show-more').count():
                    page.locator('.digital-reception-show-more').click()
                urls=page.locator('.digital-reception-results a.digital-reception-result[href]').evaluate_all(
                    "els=>els.map(a=>decodeURIComponent(new URL(a.href).pathname.replace(/^\\//,'')))")
                labels=page.locator('.digital-reception-results').inner_text()
                expected=case['expected_result_url']
                response=case['response']
                if expected not in urls:
                    failures.append(f'{width}px {case["query"]}: missing {expected}; got {urls[:8]}')
                if response=='emergency':
                    if 'call 000' not in labels.lower() or any('book-appointment.html' in u for u in urls):
                        failures.append(f'{width}px {case["query"]}: emergency advice missing or booking result shown')
                elif response=='no-direct-guide':
                    if 'no directly matching guide' not in labels.lower():
                        failures.append(f'{width}px {case["query"]}: unsupported condition inferred')
                else:
                    if not urls or not all(u.startswith('knowledge/articles/') for u in urls):
                        failures.append(f'{width}px {case["query"]}: unexpected service/doctor result {urls[:8]}')
                # Published guides remain primary results; care links are shown
                # in a separate, clearly-labelled OPTIONAL care section.
                if response=='guide-results':
                    option=page.locator('.digital-reception-care-options')
                    if option.count()!=1:failures.append(f'{width}px {case["query"]}: verified optional care route missing')
                    else:
                        option_urls=option.locator('a[href]').evaluate_all("els=>els.map(a=>new URL(a.href).pathname.substring(1))")
                        if not any(u.startswith('services/') for u in option_urls):failures.append(f'{width}px {case["query"]}: linked service missing')
                        if not any(u.startswith('doctors/') for u in option_urls):failures.append(f'{width}px {case["query"]}: linked practitioner missing')
                        if option.locator('a[data-hotdoc-widget="lightbox"]').count()!=1:failures.append(f'{width}px {case["query"]}: HotDoc care route missing')
                elif response=='no-direct-guide':
                    if page.locator('.digital-reception-care-options a[href*="services/family-health.html"]').count()!=1:
                        failures.append(f'{width}px {case["query"]}: no honest Family Health care alternative')
            # Content-first scenarios and non-healthcare practice lookups.
            for query,minimum in [('pain',5),('headache',4),('diabetes',6),('sore throat',2)]:
                page.locator('.digital-reception-input').fill(query)
                page.locator('.digital-reception-search').click()
                page.wait_for_function('''() => {const el=document.querySelector('.digital-reception-results');return el&&!el.hasAttribute('aria-busy')&&!el.textContent.includes('Finding relevant website information');}''',timeout=25000)
                total=page.locator('.digital-reception-results-heading span').inner_text()
                import re
                match=re.search(r'(\d+) matching',total)
                if not match or int(match.group(1))<minimum:
                    failures.append(f'{width}px {query}: expected at least {minimum} guide results, got {total}')
                if query=='diabetes':
                    more=page.locator('.digital-reception-show-more')
                    if more.count()!=1:failures.append(f'{width}px diabetes: Show more missing')
                    else:
                        more.click()
                        if page.locator('.digital-reception-result[href]').count()<6:failures.append(f'{width}px diabetes: Show more failed')
            for query,expected in [('parking','access-parking.html'),('fees','fees-billing.html'),('book appointment','book-appointment.html'),('test results','test-results.html'),('referrals','referrals.html'),('scripts','repeat-scripts.html')]:
                page.locator('.digital-reception-input').fill(query)
                page.locator('.digital-reception-search').click()
                page.wait_for_function('''() => {const el=document.querySelector('.digital-reception-results');return el&&!el.hasAttribute('aria-busy')&&!el.textContent.includes('Finding relevant website information');}''',timeout=25000)
                urls=page.locator('.digital-reception-results a.digital-reception-result[href]').evaluate_all("els=>els.map(a=>new URL(a.href).pathname.split('/').pop())")
                if expected not in urls:failures.append(f'{width}px {query}: missing practice page {expected}')
                if page.locator('.digital-reception-care-options').count():failures.append(f'{width}px {query}: administrative task incorrectly shows clinical funnel')
            if page.locator('.digital-reception-actions a').count()!=2:
                failures.append(f'{width}px: persistent booking/call controls changed')
            if page.locator('.digital-reception-actions [data-hotdoc-widget="lightbox"]').count()!=1:
                failures.append(f'{width}px: approved HotDoc lightbox button changed')
            if len(requests)!=len(set(requests)):failures.append(f'{width}px: duplicate topic request')
            if 'symptoms.json' not in requests:failures.append(f'{width}px: symptom index not loaded on demand')
            page.locator('.digital-reception-close').click()
            if page.locator('.digital-reception-launcher').get_attribute('aria-expanded')!='false':
                failures.append(f'{width}px: launcher did not close')
            page.close()
        browser.close()
    if errors or failures:
        for msg in (errors+failures)[:60]:print('FAIL',msg)
        raise ValueError(f'Coverage errors={len(errors)} failures={len(failures)}')
    print(f'PASS: {len(cases)} patient-intent tests at desktop, 390px and 320px')
    print('PASS: knowledge-first search with sourced optional care pathways, emergency safeguards, practical tasks and preserved HotDoc controls.')

if __name__=='__main__':
    try:main()
    except (ValueError,ImportError) as exc:
        print('DIGITAL RECEPTION COVERAGE ERROR:',exc,file=sys.stderr)
        sys.exit(1)
