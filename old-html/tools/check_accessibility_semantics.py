from pathlib import Path
from bs4 import BeautifulSoup
from collections import Counter
import re,json
R=Path(__file__).resolve().parent.parent
files=sorted(R.rglob('*.html'))
errors=[];counts=Counter()
for p in files:
 s=BeautifulSoup(p.read_text(),'html.parser');r=p.relative_to(R).as_posix()
 headings=[int(h.name[-1]) for h in s.find_all(re.compile('h[1-6]$'))]
 if len(s.find_all('h1'))!=1:errors.append((r,'not one H1'))
 for a,b in zip(headings,headings[1:]):
  if b>a+1:errors.append((r,f'heading jump {a}->{b}'))
 for tag in ('header','nav','main','footer'):
  if not s.find(tag):errors.append((r,'missing '+tag))
 if len(s.find_all('main'))!=1:errors.append((r,'main count != 1'))
 if not s.find('a',attrs={'href':'#main'}):errors.append((r,'skip link'))
 for t in s.select('div[aria-label],span[aria-label]'):
  if not t.get('role'):errors.append((r,'unnamed generic aria role '+str(t)[:110]))
 for t in s.find_all(attrs={'aria-describedby':True}):
  for id_ in t['aria-describedby'].split():
   if not s.find(id=id_):errors.append((r,'missing describedby '+id_))
 for t in s.find_all(attrs={'aria-labelledby':True}):
  for id_ in t['aria-labelledby'].split():
   if not s.find(id=id_):errors.append((r,'missing labelledby '+id_))
 for t in s.find_all('form'):
  for e in t.find_all(['input','select','textarea']):
   if e.get('type')=='hidden':continue
   id_=e.get('id')
   if not e.get('aria-label') and not e.get('aria-labelledby') and not e.find_parent('label') and not (id_ and s.find('label',attrs={'for':id_})):errors.append((r,'unlabelled '+str(e)[:100]))
 for a in s.find_all('a'):
  if not a.get_text(strip=True) and not a.get('aria-label') and not a.find('img',attrs={'alt':True}):errors.append((r,'unlabelled anchor'))
 for img in s.find_all('img'):
  if img.get('alt') is None:errors.append((r,'image missing alt'))
 counts['html_pages']+=1;counts['links']+=len(s.find_all('a'))
counts['relevant_hotdoc_hotspots']=len(BeautifulSoup((R/'index.html').read_text(),'html.parser').select('.hotdoc-store-link'))
print('COUNTS',dict(counts),'ERRORS',len(errors));print('EXAMPLES',errors[:25]);
# Print results; no production data or patient information is written.
if errors:raise SystemExit(1)
