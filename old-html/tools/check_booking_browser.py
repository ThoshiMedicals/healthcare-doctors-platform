#!/usr/bin/env python3
"""Offline browser smoke checks for the approved HotDoc recovery dialog and lazy-search failure path.
Actual provider preselection and real appointment completion require live HotDoc validation.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
DOC='https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors'
ROOT='https://gabbamedicalcentre.com.au/digital-reception.js'

def main():
 errors=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('chromium-browser') or None,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (1440,1024,768,390,320):
   page=browser.new_page(viewport={'width':width,'height':850})
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(f'<html><body><main><a class="wmc-book-appointment" data-hotdoc-button data-hotdoc-widget="lightbox" href="{DOC}">Book Appointment</a></main></body></html>')
   page.add_style_tag(content=(R/'styles.css').read_text())
   page.add_script_tag(content=(R/'booking-resilience.js').read_text())
   page.locator('[data-hotdoc-button]').click()
   assert page.locator('#wmc-booking-recovery').is_visible(),f'{width}: no booking recovery'
   assert page.locator('.wmc-booking-recovery-online').get_attribute('href')==DOC, f'{width}: incorrect fallback URL'
   assert page.locator('.wmc-booking-recovery-call').get_attribute('href')=='tel:+61732173344'
   page.keyboard.press('Escape')
   assert page.locator('#wmc-booking-recovery').is_hidden(), f'{width}: Escape cannot close recovery'
   page.close()
  # Simulate index delivery failure without allowing external navigation.
  page=browser.new_page(viewport={'width':390,'height':800})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/search-index/**',lambda route:route.abort())
  page.route('**/digital-reception-index.js*',lambda route:route.abort())
  page.set_content('<html><body><main><h1>Practice</h1></main></body></html>')
  source=(R/'digital-reception.js').read_text().replace("const SCRIPT_URL=(SCRIPT_NODE&&SCRIPT_NODE.src)?SCRIPT_NODE.src:location.href;",f"const SCRIPT_URL='{ROOT}';")
  page.add_style_tag(content=(R/'styles.css').read_text())
  page.add_script_tag(content=source)
  page.locator('.digital-reception-launcher').click()
  page.wait_for_function('document.querySelector(".digital-reception-results")?.textContent.includes("Search is temporarily unavailable")',timeout=15000)
  assert page.locator('.digital-reception-results a[href*="book-appointment.html"]').count()==1
  assert page.locator('.digital-reception-results a[href^="tel:"]').count()==1
  page.locator('.digital-reception-input').fill('worst headache sudden')
  page.locator('.digital-reception-search').click()
  assert 'call 000' in page.locator('.digital-reception-results').inner_text().lower(), 'Emergency instructions lost without index'
  page.close()
  browser.close()
 assert not errors,errors
 print('PASS: HotDoc recovery, correct Book Online/Call Clinic destinations, Escape focus handling at 1440/1024/768/390/320px')
 print('PASS: missing lazy search resource shows book/call fallback; urgent safety advice remains immediately available; no JS errors')
if __name__=='__main__':main()
