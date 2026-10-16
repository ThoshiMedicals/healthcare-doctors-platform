#!/usr/bin/env python3
"""Audit review-eligible HTML coverage and publication safety without publishing labels.

This script never invents clinical reviewers, dates, ownership, or approvals.
Use before signing off any new or changed public website release.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
import sys
from collections import Counter
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[2]
REGISTRY=ROOT/'cms/governance-records.json'
PUBLIC=ROOT/'governance-published.js'
APPROVAL_TEMPLATE=ROOT/'cms/governance-approval-template.json'
EXPECTED_COLS={'knowledge_article','knowledge_centre','service','practice_information','governance'}
EXPECTED_TYPES={'clinical','operational','institutional'}
PATIENT_SCOPE={
    'patient-information.html','practice-information.html','new-patients.html',
    'fees-billing.html','bulk-billing.html','faqs.html','patient-forms.html',
    'after-hours-care.html','medicare.html','medicare-exclusions.html',
    'referrals.html','repeat-scripts.html','telehealth.html',
    'access-parking.html','accessibility.html','feedback-concerns.html',
    'patient-code-of-conduct.html','patient-rights-responsibilities.html',
    'privacy-confidentiality.html','reminder-recall.html',
    'practice-policies.html','quality-safety.html','agpal-accreditation.html',
    'infection-prevention-control.html','ai-transcription-consent.html',
    'medical-students.html','new-patient-prescribing-policy.html',
    'test-results.html'
}


def audit():
    errors=[]
    registry=json.loads(REGISTRY.read_text(encoding='utf-8'))
    rows=registry.get('records',[])
    if not isinstance(rows,list) or not rows:
        errors.append('governance registry has no eligibility records')
        rows=[]
    paths=[r.get('path') for r in rows]
    if len(paths)!=len(set(paths)):
        errors.append('duplicate eligibility records')
    entries={r.get('path'):r for r in rows}
    knowledge={x.relative_to(ROOT).as_posix() for x in (ROOT/'knowledge').rglob('*.html')}
    services={x.relative_to(ROOT).as_posix() for x in (ROOT/'services').rglob('*.html')}
    required=knowledge|services|PATIENT_SCOPE
    missing=required-set(entries)
    if missing:
        errors.append('unregistered governance scope: '+', '.join(sorted(missing)))
    for page in ROOT.rglob('*.html'):
        path=page.relative_to(ROOT).as_posix()
        if path in entries:
            continue
        if 'data-governance-review' in page.read_text(encoding='utf-8'):
            errors.append(f'governance host on unregistered page: {path}')
    for record in rows:
        path=record.get('path')
        if not isinstance(path,str) or not re.fullmatch(r'[a-zA-Z0-9_/-]+\.html',path) or '..' in Path(path).parts:
            errors.append(f'invalid path: {path}')
            continue
        if record.get('collection') not in EXPECTED_COLS or record.get('reviewType') not in EXPECTED_TYPES:
            errors.append(f'missing/invalid collection or review type: {path}')
        if record.get('status')!='awaiting_review':
            errors.append(f'public eligibility record claims a completed review: {path}')
        if path.startswith('knowledge/') and (record.get('reviewType')!='clinical' or record.get('collection') not in ('knowledge_article','knowledge_centre')):
            errors.append(f'Knowledge Centre is incorrectly classified: {path}')
        if path.startswith('services/'):
            independent=path in ('services/pharmacy.html','services/radiology.html','services/pathology.html')
            if independent and record.get('reviewType')!='operational':
                errors.append(f'independent service must not claim clinical review by default: {path}')
            if not independent and record.get('reviewType')!='clinical':
                errors.append(f'clinical service incorrectly classified: {path}')
        page=ROOT/path
        if not page.is_file():
            errors.append(f'eligible HTML page missing: {path}')
            continue
        soup=BeautifulSoup(page.read_text(encoding='utf-8'),'html.parser')
        hosts=soup.select('[data-governance-review]')
        if len(hosts)!=1 or hosts[0].get('data-governance-page')!=path or not hosts[0].has_attr('hidden') or hosts[0].get_text(strip=True):
            errors.append(f'approval-gated, empty/hidden review host missing: {path}')
        scripts=[s.get('src','') for s in soup.select('script[src]')]
        if len([src for src in scripts if src.rsplit('/',1)[-1]=='governance-published.js'])!=1:
            errors.append(f'governance-published.js included incorrectly: {path}')
        if len([src for src in scripts if src.rsplit('/',1)[-1]=='site.js'])!=1:
            errors.append(f'site.js included incorrectly: {path}')
    approval_template=json.loads(APPROVAL_TEMPLATE.read_text(encoding='utf-8'))
    if approval_template.get('records')!=[]:
        errors.append('public approval template must be empty')
    if not PUBLIC.is_file():
        errors.append('public governance JS bundle missing')
    else:
        js=PUBLIC.read_text(encoding='utf-8')
        marker='window.WMC_APPROVED_GOVERNANCE = Object.freeze('
        if marker not in js or ');' not in js:
            errors.append('public governance JS bundle has incorrect structure')
        else:
            try:
                payload=json.loads(js.split(marker,1)[1].split(');',1)[0])
                if not isinstance(payload,dict):
                    errors.append('public governance payload must be an object')
                for path,fields in payload.items():
                    if path not in entries or not isinstance(fields,dict):
                        errors.append(f'unregistered public review attribution: {path}')
                    elif set(fields)!={'status','reviewedBy','lastReviewed','nextReview','contentOwner'}:
                        errors.append(f'unapproved/private fields in public review: {path}')
            except (json.JSONDecodeError,ValueError,TypeError):
                errors.append('public governance payload is not valid JSON')
    site_js=(ROOT/'site.js').read_text(encoding='utf-8')
    if 'record.nextReview >= todayInBrisbane' not in site_js:
        errors.append('runtime does not suppress past-due public review metadata')
    expected_count=json.loads((ROOT/'cms/governance-workflow.json').read_text(encoding='utf-8')).get('reviewPublication',{}).get('registeredPages')
    if expected_count!=len(rows):
        errors.append(f'workflow registeredPages stale ({expected_count} vs {len(rows)})')
    if errors:
        print(f'GOVERNANCE FRAMEWORK FAIL: {len(errors)} error(s)')
        for error in errors[:40]:print(' - '+error)
        return 1
    counts=Counter(r['collection'] for r in rows)
    print(f'GOVERNANCE FRAMEWORK PASS: {len(rows)} approval-eligible pages, {len(knowledge)} Knowledge Centre, {len(services)} service authority, {len(PATIENT_SCOPE)} essential patient/policy pages')
    print('Eligibility categories:',', '.join(f'{k}={v}' for k,v in sorted(counts.items())))
    print('PASS: private approvals remain outside deploy, hosts fail-closed, no fictional reviewers/dates, public bundle schema checked')
    return 0

if __name__=='__main__':
    arg=argparse.ArgumentParser(description=__doc__)
    arg.add_argument('--check',action='store_true',help='validate release scope and all review hosts')
    arg.parse_args()
    try:
        sys.exit(audit())
    except (OSError,ValueError,KeyError,json.JSONDecodeError) as error:
        print(f'GOVERNANCE FRAMEWORK ERROR: {error}',file=sys.stderr)
        sys.exit(1)
