#!/usr/bin/env python3
"""Validate documented governance approvals and build a public, fail-closed JS review registry.

Usage:
  python cms/tools/build_clinical_governance.py --check
  python cms/tools/build_clinical_governance.py --build
  python cms/tools/build_clinical_governance.py --approvals /private/path/approvals.json --build
  python cms/tools/build_clinical_governance.py --fingerprint services/womens-health.html

This is not an approval application. Only authorised staff can certify real reviews.
The builder checks format, evidence fields and the approved page-content hash, not
whether a named reviewer actually signed the referenced internal record.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
from datetime import date, datetime
from zoneinfo import ZoneInfo
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
REGISTRY=ROOT/'cms'/'governance-records.json'
OUTPUT=ROOT/'governance-published.js'
STATES={'awaiting_review','owner_submitted','in_review','approval_pending','approved','review_due','superseded'}
PUBLIC_FIELDS=('status','reviewedBy','lastReviewed','nextReview','contentOwner')
PRIVATE_FIELDS=('contentOwnerSubmittedBy','contentOwnerSubmittedAt','reviewerSignedBy','reviewerSignedAt','approvedBy','approvedAt','approvalReference','evidenceReference','reviewedContentSha256','reviewType')
HOST_RE=re.compile(r'<div\b(?=[^>]*\bdata-governance-review\b)[^>]*>\s*</div>',re.I)
MAIN_RE=re.compile(r'<main\b[^>]*>(.*?)</main>',re.S|re.I)


def content_fingerprint(path: str) -> str:
    source=(ROOT/path).read_text(encoding='utf-8')
    match=MAIN_RE.search(source)
    if not match:
        raise ValueError(f'{path}: missing main content')
    normalized=HOST_RE.sub('',match.group(1)).strip()
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


def parse_date(value: str, path: str, label: str) -> date:
    if not isinstance(value,str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',value):
        raise ValueError(f'{path}: {label} must be a real ISO YYYY-MM-DD date')
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ValueError(f'{path}: {label} invalid calendar date')


def require_nonempty(entry: dict, fields: tuple[str,...]) -> None:
    for field in fields:
        if not isinstance(entry.get(field), str) or len(entry[field].strip())<3:
            raise ValueError(f"{entry['path']}: status approved without verified {field}")
        if entry[field].strip() in ('[Date]','[Department]','[Reviewer]','TBD','TODO','PLACEHOLDER'):
            raise ValueError(f"{entry['path']}: placeholder {field} is forbidden")


def build(registry: dict, private_approvals: list[dict]) -> dict:
    seen=set()
    approved={}
    records=registry.get('records')
    if not isinstance(records,list) or not records:
        raise ValueError('governance eligibility registry must contain pages')
    for entry in records:
        path=entry.get('path')
        if not isinstance(path,str) or not re.fullmatch(r'[a-zA-Z0-9_/-]+\.html',path):
            raise ValueError(f'illegal eligibility path: {path!r}')
        if path.startswith('/') or '..' in Path(path).parts or path in seen:
            raise ValueError(f'unsafe or duplicate governance page: {path}')
        seen.add(path)
        htmlpath=ROOT/path
        if not htmlpath.is_file():
            raise ValueError(f'governance page does not exist: {path}')
        html=htmlpath.read_text(encoding='utf-8')
        if html.count('data-governance-review')!=1 or f'data-governance-page="{path}"' not in html:
            raise ValueError(f'governance host missing or incorrect: {path}')
        if html.count('governance-published.js')!=1:
            raise ValueError(f'governance data script missing: {path}')
        if entry.get('status') != 'awaiting_review':
            raise ValueError(f'{path}: public eligibility inventory must never claim review approval')
    if not isinstance(private_approvals,list):
        raise ValueError('private approvals input must provide a records array')
    private_seen=set()
    for entry in private_approvals:
        path=entry.get('path')
        if path not in seen or path in private_seen:
            raise ValueError(f'private approval path not eligible or duplicate: {path}')
        private_seen.add(path)
        status=entry.get('status')
        if status not in STATES:
            raise ValueError(f'{path}: invalid status {status!r}')
        if status!='approved':
            continue
        require_nonempty(entry, PUBLIC_FIELDS[1:]+PRIVATE_FIELDS[:-2])
        if entry.get('reviewType') not in {'clinical','operational','institutional'}:
            raise ValueError(f'{path}: missing or invalid reviewType')
        eligible=next(item for item in records if item['path']==path)
        if entry['reviewType']!=eligible.get('reviewType'):
            raise ValueError(f'{path}: reviewType must match eligible page type')
        submitted=parse_date(entry['contentOwnerSubmittedAt'],path,'contentOwnerSubmittedAt')
        reviewer_signed=parse_date(entry['reviewerSignedAt'],path,'reviewerSignedAt')
        reviewed=parse_date(entry['lastReviewed'],path,'lastReviewed')
        next_due=parse_date(entry['nextReview'],path,'nextReview')
        approved_at=parse_date(entry['approvedAt'],path,'approvedAt')
        today_brisbane=datetime.now(ZoneInfo('Australia/Brisbane')).date()
        if submitted>today_brisbane or reviewed>today_brisbane or reviewer_signed>today_brisbane or approved_at>today_brisbane:
            raise ValueError(f'{path}: submission, review or approval cannot be in the future')
        if reviewed!=reviewer_signed:
            raise ValueError(f'{path}: Last Reviewed must be the actual reviewer sign-off date')
        if not submitted<=reviewer_signed<=approved_at:
            raise ValueError(f'{path}: real owner submission -> reviewer sign-off -> practice approval sequence is required')
        if next_due<=approved_at:
            raise ValueError(f'{path}: next review due must be later than actual practice approval')
        if next_due<today_brisbane:
            raise ValueError(f'{path}: review is overdue; move private approval status to review_due and complete new review before public attribution')
        if approved_at<reviewed:
            raise ValueError(f'{path}: approval predates content review')
        if not re.fullmatch(r'[a-f0-9]{64}',str(entry.get('reviewedContentSha256') or '')):
            raise ValueError(f'{path}: valid reviewedContentSha256 is required after sign-off')
        if entry['reviewedContentSha256']!=content_fingerprint(path):
            raise ValueError(f'{path}: page content changed since authorised review; new approval is needed')
        approved[path]={k:entry[k].strip() for k in PUBLIC_FIELDS}
    return dict(sorted(approved.items()))


def generated_js(approved: dict) -> str:
    data=json.dumps(approved,ensure_ascii=False,separators=(',',':'),sort_keys=True)
    data=data.replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    return ("/* Generated from documented approvals in cms/governance-records.json.\n"
            "   Do not edit; never include private evidence or draft reviews. */\n"
            "window.WMC_APPROVED_GOVERNANCE = Object.freeze("+data+");\n")


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--approvals", metavar="PRIVATE_FILE", type=Path, help="Restricted-access approvals file OUTSIDE the website root")
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check',action='store_true')
    mode.add_argument('--build',action='store_true')
    mode.add_argument('--fingerprint',metavar='PAGE',type=str)
    args=parser.parse_args()
    if args.fingerprint:
        reg=json.loads(REGISTRY.read_text(encoding='utf-8'))
        if args.fingerprint not in {x['path'] for x in reg['records']}:
            raise ValueError(f'{args.fingerprint}: page is not currently review eligible')
        print(f'{args.fingerprint}\n{content_fingerprint(args.fingerprint)}')
        return
    reg=json.loads(REGISTRY.read_text(encoding='utf-8'))
    private_approvals=[]
    if args.approvals:
        private_path=args.approvals.resolve()
        if private_path.is_relative_to(ROOT):
            raise ValueError('private approval records MUST remain outside the public website root')
        if not private_path.is_file():
            raise ValueError('private approval records file not found')
        private_approvals=json.loads(private_path.read_text(encoding='utf-8')).get('records',[])
    elif OUTPUT.exists() and '"status":"approved"' in OUTPUT.read_text(encoding='utf-8'):
        raise ValueError('existing public reviews detected: --approvals is required to prevent accidental removal')
    approved=build(reg,private_approvals)
    js=generated_js(approved)
    if args.build:
        OUTPUT.write_text(js,encoding='utf-8')
    elif not OUTPUT.exists() or OUTPUT.read_text(encoding='utf-8')!=js:
        raise ValueError('public governance bundle is absent/out of sync: run --build')
    print(f'Governance validation PASS | eligible={len(reg["records"])} | evidence-approved={len(approved)} | public-bundle={OUTPUT.name}')


if __name__=='__main__':
    try:main()
    except (OSError,ValueError,KeyError,json.JSONDecodeError) as exc:
        print(f'Governance validation FAILED: {exc}',file=sys.stderr)
        sys.exit(1)
