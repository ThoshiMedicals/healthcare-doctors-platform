#!/usr/bin/env python3
"""Digital Reception static search index builder / release freshness gate.

Usage from the website root:
  python cms/tools/build_digital_reception_index.py --build
  python cms/tools/build_digital_reception_index.py --check

--build regenerates indexed page data without changing the Digital Reception UI.
--check fails if published pages, metadata, content or internal links have drifted.
No-index HTML pages (404 and the Updates article template) are not indexed.
"""
import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse, unquote
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[2]
INDEX=ROOT/'digital-reception-index.js'
CONTROLLER=ROOT/'digital-reception.js'
SITEMAP=ROOT/'sitemap.xml'
EXCLUDE_SELECTORS=[
    'script','style','noscript','template','svg','header','footer','nav','aside',
    '.breadcrumb-bar','.on-this-page','.page-nav','.persistent-care-actions',
    '.digital-reception-panel','.digital-reception-launcher','.skip-link',
    '.page-section-nav','.hero-hours-link','.service-booking-cta',
    '.knowledge-final-cta','.visually-hidden','.sr-only',
]

# Explicit discovery terms are patient-centred descriptions, not claims of service availability.
CATEGORY_ALIASES={
    'Service':['services','treatment','procedure','gp service','healthcare'],
    'Doctor':['doctor','dr','gp','practitioner','clinician','healthcare professional','book with doctor'],
    'Knowledge Centre':['guide','education','health information','understand','learn','wellbeing'],
    'Patient Information':['patient information','appointment guidance','patient help'],
    'Practice & Governance':['practice information','policy','quality','governance','patient rights'],
    'Updates':['practice updates','news','announcements','health updates'],
    'Team':['our team','staff','doctors','practitioner','healthcare team'],
    'Practice':['clinic','medical centre','Woolloongabba','Brisbane','reception']
}
SPECIAL={
'book-appointment.html':['hotdoc','book now','online appointment','book a gp','see a doctor','booking','appointment'],
'contact.html':['phone','call reception','contact number','hours','address','location'],
'faqs.html':['faq','frequently asked questions','questions','help'],
'fees-billing.html':['fees','prices','costs','billing','private fees','payment','bulk billing','medicare'],
'bulk-billing.html':['free consultation','bulk billed','100% bulk billing','medicare eligibility','no gap'],
'medicare.html':['medicare','rebate','medicare number','bulk bill'],
'new-patients.html':['first visit','new patients','registration','first appointment'],
'new-patient-prescribing-policy.html':['new patient scripts','prescription policy','restricted medicines'],
'repeat-scripts.html':['script','scripts','repeat prescription','medication','repeat scripts','renew prescription'],
'test-results.html':['pathology results','test results','blood results','scan result','recall','follow up'],
'referrals.html':['specialist referral','referral','referrals'],
'access-parking.html':['parking','car park','wheelchair parking','drop off','driving','public transport','arrival'],
'accessibility.html':['disability','wheelchair','mobility','step free','accessibility','accessible clinic'],
'after-hours-care.html':['after hours','out of hours','clinic closed','urgent','home doctor','13 health','emergency'],
'agpal-accreditation.html':['agpal','accreditation','quality','accredited practice','standards','RACGP'],
'quality-safety.html':['clinical governance','patient safety','quality and safety','governance'],
'privacy-confidentiality.html':['privacy','confidentiality','personal data','patient records'],
'patient-forms.html':['new patient form','registration form','forms','medical history form'],
'patient-information.html':['patient information','patient hub','policies','access to care'],
'practice-information.html':['practice information','governance','clinic policies'],
'patient-code-of-conduct.html':['patient code of conduct','safe and respectful practice','respectful behaviour','visitor conduct','behaviour policy','harassment','threatening behaviour','practice safety'],
'services/iron-infusions.html':['iron deficiency','intravenous iron','iron infusion'],
'services/implanon-insertion-removal.html':['implanon','contraceptive implant','rod','birth control implant','implant removal'],
'services/iud-insertion-removal.html':['iud','intrauterine device','mirena','contraception','iud insertion','iud removal'],
'services/pap-smear-cervical-screening.html':['pap smear','cervical screening','cervical screening test','cst'],
'services/pathology.html':['pathology','blood test','laboratory','third party','independent provider'],
'services/radiology.html':['radiology','x ray','ultrasound','imaging','third party','independent provider'],
'services/pharmacy.html':['pharmacy','chemist','medicines','prescriptions','third party','independent provider'],
'services/ear-care-ear-syringing.html':['ear care','ear syringing','ear wax','blocked ears'],
'services/ecg.html':['ecg','electrocardiogram','heart test'],
'services/spirometry.html':['spirometry','lung function','breathing test'],
'services/nebulising.html':['nebuliser','nebulizer','nebulising','breathing treatment'],
'services/wound-dressings.html':['wound care','dressing change','wound dressing'],
'services/antenatal-postnatal-care.html':['antenatal','postnatal','pregnancy','after birth','maternity'],
'services/pre-pregnancy-care.html':['preconception','pre pregnancy','planning pregnancy'],
'services/breast-check.html':['breast exam','breast check','breast health'],
'services/prostate-care.html':['prostate','prostate check','mens health'],
'updates/index.html':['updates','practice updates','new information','announcement'],
'knowledge/index.html':['healthcare knowledge centre','health guides','patient education','health information'],
'about-us.html':['about us','about woolloongabba medical centre','our philosophy','our story','our community','quality and accreditation','join our team','medical centre network'],
'medical-centre-network.html':['our medical centre network','seven practices','brisbane healthcare network'],
'local-healthcare-access.html':['local health access','inner brisbane','inner south','community access']
}

def clean(s):return re.sub(r'\s+',' ',s or '').strip()

def path_category(path):
    if path.startswith('doctors/'):return 'Doctor'
    if path.startswith('services/') or path=='services.html':return 'Service'
    if path.startswith('knowledge/'):return 'Knowledge Centre'
    if path.startswith('updates/'):return 'Updates'
    if path.startswith('team') or path=='join-our-team.html':return 'Team'
    if path in {'patient-information.html','new-patients.html','faqs.html','test-results.html','repeat-scripts.html','fees-billing.html','bulk-billing.html','medicare.html','medicare-exclusions.html','new-patient-prescribing-policy.html','patient-forms.html','after-hours-care.html','telehealth.html','referrals.html'}:return 'Patient Information'
    if path in {'access-parking.html','accessibility.html','agpal-accreditation.html','privacy-confidentiality.html','infection-prevention-control.html','practice-information.html','practice-policies.html','quality-safety.html','patient-rights-responsibilities.html','patient-code-of-conduct.html','reminder-recall.html','feedback-concerns.html','medical-students.html','ai-transcription-consent.html'}:return 'Practice & Governance'
    return 'Practice'

def index():
    roots=ET.parse(SITEMAP).getroot()
    names=[]
    for x in roots.findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
        loc=x.text
        if not loc:continue
        url=urlparse(loc)
        if url.hostname not in ('gabbamedicalcentre.com.au','www.gabbamedicalcentre.com.au'):raise ValueError('Unexpected sitemap domain '+loc)
        path=unquote(url.path).lstrip('/') or 'index.html'
        if any(part in ('','.','..') for part in path.split('/')) or '\\' in path or not path.endswith('.html'):
            raise ValueError('Invalid public HTML path in sitemap: '+loc)
        names.append(path)
    if len(names)!=len(set(names)):raise ValueError('Repeated sitemap entries')
    # Check against the ACTUAL public HTML inventory, not just the sitemap.
    # A new page cannot be silently omitted from the regenerated search index.
    all_html={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*.html')}
    public_html=set()
    for path in sorted(all_html):
        doc=BeautifulSoup((ROOT/path).read_text('utf-8'),'html.parser')
        robots=doc.find('meta',attrs={'name':'robots'})
        if not robots or 'noindex' not in robots.get('content','').lower():
            public_html.add(path)
    sitemap_paths=set(names)
    if public_html!=sitemap_paths:
        missing=sorted(public_html-sitemap_paths)
        extra=sorted(sitemap_paths-public_html)
        raise ValueError(f'Public HTML / sitemap drift: public pages absent from sitemap={missing}; invalid sitemap pages={extra}. Update sitemap.xml first.')
    entries=[]
    for path in names:
        file=ROOT/path
        if not file.is_file():raise FileNotFoundError(path)
        soup=BeautifulSoup(file.read_text('utf-8'),'html.parser')
        if soup.find('meta',attrs={'name':'robots','content':re.compile('noindex',re.I)}):raise ValueError('Noindex sitemap entry '+path)
        original=soup.find('main') or soup.body or soup
        main=BeautifulSoup(str(original),'html.parser')
        for tag in main.select(','.join(EXCLUDE_SELECTORS)):tag.decompose()
        for tag in main.select('[hidden],[aria-hidden="true"]'):tag.decompose()
        # Exclude any global sticky action outside the principal patient content.
        meta=soup.find('meta',attrs={'name':'description'})
        description=clean(meta.get('content','')) if meta else ''
        heading=(main.find('h1') or soup.find('h1'))
        h1=clean(heading.get_text(' ',strip=True)) if heading else ''
        title=clean(soup.title.get_text(' ',strip=True)).split(' | ')[0] if soup.title else h1
        headings=list(dict.fromkeys([clean(h.get_text(' ',strip=True)) for h in main.select('h2,h3,h4') if clean(h.get_text(' ',strip=True))]))[:45]
        content=clean(main.get_text(' ',strip=True))
        # Retain searchable FAQ question content but avoid repeating site-wide navigation on every page.
        maxlen=12000 if path=='faqs.html' else 7300 if path.startswith('knowledge/') else 5800
        body=content[:maxlen].rsplit(' ',1)[0] if len(content)>maxlen else content
        category=path_category(path)
        # Use a small, curated synonym list + genuine subject terms from title/path.
        keywords=list(dict.fromkeys([*CATEGORY_ALIASES[category],*SPECIAL.get(path,[]),path.replace('/',' ').replace('-',' ').replace('.html','')]))
        if path.startswith('doctors/'):
            keywords.extend(['book with '+h1,'dr '+h1.removeprefix('Dr ').removeprefix('Mr ')])
        # Actual in-main document relationships, NOT imagined service offerings.
        links=[]
        for a in main.find_all('a',href=True):
            href=a['href']
            if href.startswith(('#','tel:','mailto:','javascript:')):continue
            from urllib.parse import urljoin
            dest=urlparse(urljoin('https://gabbamedicalcentre.com.au/'+path,href))
            if dest.hostname not in ('gabbamedicalcentre.com.au','www.gabbamedicalcentre.com.au'):continue
            target=dest.path.lstrip('/') or 'index.html'
            if target==path or not target.endswith('.html'):continue
            if not (ROOT/target).exists():continue
            if target not in links:links.append(target)
        # Exclude site header/footer links from relationship collection (already removed above).
        result=dict(title=title,h1=h1,category=category,description=description,headings=headings,keywords=keywords,related=links[:32],text=body,url=path)
        entries.append(result)
    return entries

# The corpus lives in a separate lazily loaded static script. Rebuilding must
# never overwrite the small accessible UI controller or its existing routing.
DATA_START='window.WMC_DIGITAL_RECEPTION_INDEX = '
DATA_END=';\n'

def split_payload(source):
    if source.count(DATA_START)!=1:
        raise ValueError('Digital Reception generated index boundary changed')
    a=source.index(DATA_START)+len(DATA_START)
    b=source.index(DATA_END,a)
    try:current=json.loads(source[a:b])
    except json.JSONDecodeError as error:raise ValueError('Malformed index') from error
    if not isinstance(current,list):raise ValueError('Index must be an array')
    return current,a,b

def check(entries,source):
    actual,_,_=split_payload(source)
    if actual!=entries:
        old={x.get('url'):x for x in actual if isinstance(x,dict)}
        new={x['url']:x for x in entries}
        raise ValueError('Stale Digital Reception index. Missing='+str(sorted(new.keys()-old.keys()))+
                         '; obsolete='+str(sorted(old.keys()-new.keys()))+
                         '; modified='+str(sorted(k for k in new.keys()&old.keys() if new[k]!=old[k]))+
                         '. Run --build.')
    if len(entries)!=len({x['url'] for x in entries}):raise ValueError('Duplicate index entries')
    print('PASS: Digital Reception index current and complete:',len(entries),'public pages; categories:',dict(sorted(Counter(x['category'] for x in entries).items())))

def update(entries,source):
    existing,a,b=split_payload(source)
    payload=json.dumps(entries,ensure_ascii=False,separators=(',',':'))
    updated=source[:a]+payload+source[b:]
    if updated!=source:
        INDEX.write_text(updated,'utf-8')
        print('Rebuilt lazy search index:',len(entries),'pages')
    else:print('Search index already current:',len(entries),'pages')
    # Fingerprint the exact generated resource to make browser caching safe.
    version=hashlib.sha256(updated.encode('utf-8')).hexdigest()[:12]
    controller=CONTROLLER.read_text('utf-8')
    import re
    refreshed,count=re.subn(r'digital-reception-index\.js\?v=[0-9a-f]{12}',
                              'digital-reception-index.js?v='+version, controller)
    if count!=1:raise ValueError('Controller index version reference changed')
    if refreshed!=controller:CONTROLLER.write_text(refreshed,'utf-8')
    check(entries,updated)
    from build_search_shards import apply
    apply(entries)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--build',action='store_true',help='Refresh index from public site')
    group.add_argument('--check',action='store_true',help='Fail the release if index is stale')
    args=parser.parse_args()
    entries=index()
    source=INDEX.read_text('utf-8')
    if args.build:update(entries,source)
    else:
        check(entries,source)
        from build_search_shards import apply
        apply(entries,check=True)


if __name__=='__main__':
    try:main()
    except (ValueError,FileNotFoundError) as exc:
        print('Digital Reception index ERROR:',exc,file=sys.stderr)
        sys.exit(1)
