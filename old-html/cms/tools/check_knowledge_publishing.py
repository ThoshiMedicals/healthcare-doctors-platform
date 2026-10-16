#!/usr/bin/env python3
"""Validate private Knowledge Centre calendar exports before publication or release.

Examples:
  python cms/tools/check_knowledge_publishing.py
  python cms/tools/check_knowledge_publishing.py --register /secure/editorial-register.json --release

The validator checks evidence fields and the approved article content fingerprint.
It cannot authenticate a signature or deploy website files; genuine approval and
live publication must be independently verified by authorised people.
"""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import date, datetime
import json
from pathlib import Path
import re
import sys
from zoneinfo import ZoneInfo
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'cms/tools'))
from build_clinical_governance import content_fingerprint

MONTHS=('January','February','March','April','May','June','July','August','September','October','November','December')
STATES={'planned','assigned','drafting','clinical_review','approved','scheduled','published','review_due','on_hold'}
CHECKLIST=('sourceVerificationComplete','seoReviewComplete','accessibilityReviewComplete','internalLinksVerified')
APPROVED_STAGES={'approved','scheduled','published'}
SHA_RE=re.compile(r'[a-f0-9]{64}')
PATH_RE=re.compile(r'knowledge/articles/[a-z0-9][a-z0-9-]*\.html')
TODAY=datetime.now(ZoneInfo('Australia/Brisbane')).date()


def iso(value,field,key,required=False):
    if not value and not required:return None
    if not isinstance(value,str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',value):
        raise ValueError(f'{key}: {field} requires an actual YYYY-MM-DD date')
    try:return date.fromisoformat(value)
    except ValueError:raise ValueError(f'{key}: {field} is not a calendar date')


def populated(value):
    return isinstance(value,str) and len(value.strip())>=3 and value.strip().lower() not in ('tbd','todo','pending','placeholder','unknown','n/a')


def check(record,release=False):
    key=record.get('id') or 'unnamed'
    issues=[]
    def require(test,msg):
        if not test:issues.append(f'{key}: {msg}')
    state=record.get('status')
    require(state in STATES,'invalid status')
    year=record.get('year');month=record.get('monthNumber')
    require(isinstance(year,int) and 2026<=year<=2150,'invalid planning year')
    require(isinstance(month,int) and 1<=month<=12,'invalid month number')
    if isinstance(month,int) and 1<=month<=12:require(record.get('month')==MONTHS[month-1],'month label does not match month number')
    for field in ('theme','primaryCategory'):require(populated(record.get(field)),f'{field} is missing')
    try:
        due=iso(record.get('dueDate'),'dueDate',key)
        target=iso(record.get('plannedPublicationDate'),'plannedPublicationDate',key)
        live=iso(record.get('publicationDate'),'publicationDate',key)
        review=iso(record.get('nextReviewDate'),'nextReviewDate',key)
    except ValueError as e:
        issues.append(str(e));return issues
    if state in {'assigned','drafting','clinical_review','approved','scheduled','published','review_due'}:
        require(populated(record.get('contentOwner')),'contentOwner must be assigned')
        require(due is not None,'dueDate must be set')
    if state in {'clinical_review','approved','scheduled','published','review_due'}:
        path=record.get('articlePath') or ''
        require(bool(PATH_RE.fullmatch(path)), 'articlePath must be knowledge/articles/<slug>.html')
    if state in APPROVED_STAGES:
        ca=record.get('clinicalApproval') or {}
        require(ca.get('status')=='approved','clinical approval is not recorded as approved')
        for field in ('reviewedBy','reviewReference','approvedBy','approvalReference','evidenceReference'):
            require(populated(ca.get(field)),f'clinicalApproval.{field} missing genuine evidence')
        try:
            checked=iso(ca.get('reviewedAt'),'clinicalApproval.reviewedAt',key,True)
            signed=iso(ca.get('approvedAt'),'clinicalApproval.approvedAt',key,True)
            if checked and signed:
                require(checked<=signed<=TODAY,'review / practice approval must be in chronological order and not future-dated')
                require(review is not None and review>signed,'nextReviewDate must follow practice approval')
        except ValueError as e:issues.append(str(e))
        for field in CHECKLIST:require(record.get(field) is True,f'{field} must be checked')
        sha=ca.get('reviewedContentSha256') or ''
        require(bool(SHA_RE.fullmatch(sha)),'approved content SHA-256 is missing')
        path=record.get('articlePath') or ''
        if PATH_RE.fullmatch(path):
            file=ROOT/path
            require(file.is_file(),'approved article HTML does not exist in this website release')
            if file.is_file() and SHA_RE.fullmatch(sha):
                try:require(content_fingerprint(path)==sha,'article main content has changed since approval')
                except (ValueError,OSError) as e:issues.append(f'{key}: fingerprint unavailable: {e}')
    if state in {'scheduled','published'}:require(target is not None,'plannedPublicationDate required for scheduled or published content')
    if state=='published':
        require(live is not None,'publicationDate must reflect actual publication')
        require(populated(record.get('liveVerifiedBy')),'named operator must verify live deployment')
        try:
            verified=iso(record.get('liveVerifiedAt'),'liveVerifiedAt',key,True)
            signed=iso((record.get('clinicalApproval') or {}).get('approvedAt'),'approvedAt',key,True)
            if live:
                require(live<=TODAY,'actual publicationDate cannot be in the future')
                require(review is not None and review>live,'nextReviewDate must follow actual publication')
                if signed:require(signed<=live,'published before practice approval')
            if verified and live:require(verified>=live and verified<=TODAY,'live verification date inconsistent with publication date')
        except ValueError as e:issues.append(str(e))
        if release:
            require(review is not None and review>TODAY,'published article review date is due; initiate a new review cycle')
            path=record.get('articlePath') or ''
            if PATH_RE.fullmatch(path):
                site=(ROOT/'sitemap.xml').read_text(encoding='utf-8')
                require('/'+path in site,'published page is absent from sitemap.xml')
                registry=json.loads((ROOT/'cms/content-registry.json').read_text(encoding='utf-8'))
                catalogue=json.loads((ROOT/'cms/knowledge-centre-articles.json').read_text(encoding='utf-8'))
                require(path in registry['knowledgeCentre']['articles'],'published page is absent from content-registry article inventory')
                require(any(a.get('url')==path for a in catalogue['articles']),'published page is absent from knowledge-centre-articles.json')
                category_pages=(ROOT/'knowledge').glob('*.html')
                require(any('articles/'+Path(path).name in f.read_text(encoding='utf-8') for f in category_pages),'published page has no Knowledge Centre category inbound link')
                if (ROOT/path).exists():
                    html=(ROOT/path).read_text(encoding='utf-8')
                    require('rel="canonical"' in html,'published page has no canonical link')
                    require('name="description"' in html,'published page missing SEO description')
    return issues


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--register',type=Path,default=ROOT/'cms/editorial-calendar.json',help='Private register JSON exported from admin dashboard')
    p.add_argument('--release',action='store_true',help='Also enforce sitemap and SEO checks on recorded published articles')
    args=p.parse_args()
    document=json.loads(args.register.read_text(encoding='utf-8'))
    rows=document.get('yearlySchedule',document.get('records'))
    if not isinstance(rows,list) or not rows:raise ValueError('Register has no editorial records')
    seen=set();issues=[]
    for r in rows:
        if not isinstance(r,dict):issues.append('Entry must be an object');continue
        key=(r.get('year'),r.get('monthNumber'))
        if key in seen:issues.append(f'Duplicate year/month: {key}')
        seen.add(key)
        issues.extend(check(r,args.release))
    tallies=Counter(r.get('status') for r in rows if isinstance(r,dict))
    if issues:
        print('PUBLICATION WORKFLOW FAIL')
        for issue in issues:print(' -',issue)
        return 1
    print(f'PUBLICATION WORKFLOW PASS | records={len(rows)} | '+', '.join(f'{k}={v}' for k,v in sorted(tallies.items())))
    return 0

if __name__=='__main__':
    try:sys.exit(main())
    except (OSError,ValueError,TypeError,KeyError,AttributeError,json.JSONDecodeError) as exc:
        print(f'PUBLICATION WORKFLOW FAIL: {exc}',file=sys.stderr)
        sys.exit(1)
