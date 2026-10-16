#!/usr/bin/env python3
"""Controlled, byte-for-byte practitioner image migration.

From the WEBSITE ROOT (external internet needed only for --download):
  python tools/import_verified_practitioner_photos.py --status
  python tools/import_verified_practitioner_photos.py --download
  python tools/import_verified_practitioner_photos.py --source-dir /secure/clinic-originals --approvals /secure/photo-approvals.json
  python tools/import_verified_practitioner_photos.py --check
  python tools/import_verified_practitioner_photos.py --check --require-all-local

Source-directory imports require a real written approval, source mapping and SHA-256.
Original bytes are never changed; missing images remain on their existing URLs.
No HTML reference points to a local filename until that real file has passed checks.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TEAM = ROOT / 'assets' / 'team'
MANIFEST = TEAM / 'MANIFEST.json'
LIBRARY = TEAM / 'INSTITUTIONAL-CATEGORY.json'
OFFICIAL_ORIGIN = 'gabbamedicalcentre.com.au'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def image_dimensions(data, filename):
    if len(data) < 1024 or len(data) > 12 * 1024 * 1024 or not (data.startswith(b'\xff\xd8\xff') or (data.startswith(b'RIFF') and data[8:12] == b'WEBP')):
        raise ValueError(f'{filename}: invalid/oversized JPEG file')
    with tempfile.NamedTemporaryFile(suffix=Path(filename).suffix) as tmp:
        tmp.write(data)
        tmp.flush()
        with Image.open(tmp.name) as im:
            if im.format not in ('JPEG', 'WEBP') or min(im.size) < 160:
                raise ValueError(f'{filename}: expected a usable JPEG or WebP original')
            dims = list(im.size)
            im.verify()
    return dims


def fetch_official(original_url):
    parsed = urlparse(original_url)
    if parsed.scheme != 'https' or parsed.hostname != OFFICIAL_ORIGIN or not parsed.path.startswith('/wp-content/uploads/2025/02/'):
        raise ValueError('Source is not an authorised existing clinic image URL')
    req = Request(original_url, headers={'User-Agent':'Mozilla/5.0 (WMC authentic photo migration)'})
    with urlopen(req, timeout=25) as res:
        if res.status != 200 or not res.headers.get('content-type','').lower().startswith(('image/jpeg','image/jpg')):
            raise ValueError(f'Source did not return a JPEG: HTTP {res.status}, {res.headers.get("content-type")}')
        data = res.read(12 * 1024 * 1024 + 1)
    return data


def approver_record(record, approvals, image_bytes):
    matches = [r for r in approvals.get('portraits', []) if r.get('filename') == record['filename']]
    if len(matches) != 1:
        raise ValueError(f"{record['filename']}: exactly one signed source-file approval required")
    appr = matches[0]
    if (appr.get('practitionerName') != record['practitioner_name']
        or appr.get('sourceUrl') != record['verified_source_url']
        or appr.get('sha256') != digest(image_bytes)
        or not str(appr.get('identityVerifiedBy', '')).strip()
        or not str(appr.get('originalSourceConfirmedBy', '')).strip()
        or appr.get('approvedForLocalHosting') is not True):
        raise ValueError(f"{record['filename']}: identity/source/hash approval missing or mismatched")


def replace_sources_in_html(text, page, record):
    original = record['verified_source_url']
    filename = record['filename']
    rel = Path(os.path.relpath(TEAM / filename, start=page.parent)).as_posix()
    canonical = f'https://{OFFICIAL_ORIGIN}/assets/team/{filename}'
    count = [0]

    def rewrite_tag(match):
        tag = match.group(0)
        if 'data-practitioner-image="true"' not in tag or original not in tag:
            return tag
        expected_local = re.search(r'\bdata-local-team-src="([^"]+)"', tag)
        if not expected_local or expected_local.group(1) != rel:
            raise ValueError(f'{page.relative_to(ROOT)}: practitioner local mapping mismatch for {filename}')
        srcliteral = f'src="{original}"'
        if srcliteral not in tag:
            raise ValueError(f'{page.relative_to(ROOT)}: unexpected practitioner image src')
        tag = tag.replace(srcliteral, f'src="{rel}"')
        tag = tag.replace(f' data-remote-team-src="{original}"', '')
        count[0] += 1
        return tag

    changed = re.sub(r'<img\b[^>]*>', rewrite_tag, text, flags=re.I | re.S)
    if count[0]:
        # Change JSON-LD practitioner images and Open Graph/Twitter URLs to
        # the now-local, absolute on-site canonical image URL.
        changed = changed.replace(original, canonical)
    return changed, count[0]


def check_site(records, require_all=False):
    issues=[]
    local=0
    remote=0
    htmls=list(ROOT.rglob('*.html'))
    for rec in records:
        fn=rec['filename']
        original=rec.get('verified_source_url') or rec.get('previous_external_url')
        f=TEAM/fn
        hosted=rec.get('status') in ('locally_imported_original','locally_imported_lossless_from_user_upload')
        if hosted:
            local+=1
            if not f.is_file():
                issues.append(f'{fn}: locally marked but source file missing')
                continue
            data=f.read_bytes()
            try:image_dimensions(data,fn)
            except Exception as e:issues.append(str(e))
            if rec.get('sha256')!=digest(data):issues.append(f'{fn}: SHA-256 mismatch')
        else:
            remote+=1
            if f.exists():issues.append(f'{fn}: file exists but is not registered as imported')
        seen=0
        for p in htmls:
            t=p.read_text(encoding='utf-8')
            if original in t or f'data-local-team-src="' in t and fn in t or f'/assets/team/{fn}' in t:
                rel=Path(os.path.relpath(f, start=p.parent)).as_posix()
                tags=re.findall(r'<img\b[^>]*>',t,flags=re.I|re.S)
                for tag in tags:
                    if f'data-local-team-src="{rel}"' not in tag:continue
                    seen+=1
                    expected=f'src="{rel}"' if hosted else f'src="{original}"'
                    if expected not in tag:issues.append(f'{p.relative_to(ROOT)}: unexpected image source for {fn}')
                if hosted and original in t:
                    issues.append(f'{p.relative_to(ROOT)}: stale external image reference to {fn}')
        if not seen:issues.append(f'{fn}: no matching published practitioner image')
    if require_all and remote:
        issues.append(f'{remote} practitioner portrait originals remain unimported')
    report={'local_portraits':local,'still_external':remote,'total_existing_portrait_origins':len(records),'consistent':not issues,'issues':issues[:80]}
    print(json.dumps(report,indent=2))
    return 0 if not issues else 1


def main():
    parser=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--status', action='store_true')
    mode.add_argument('--check',action='store_true')
    mode.add_argument('--download',action='store_true')
    mode.add_argument('--source-dir',type=Path)
    parser.add_argument('--approvals',type=Path,help='PRIVATE, non-webroot file with source and identity confirmations; required for --source-dir')
    parser.add_argument('--require-all-local',action='store_true',help='Exit nonzero if any of the 11 existing portrait originals remain remote')
    args=parser.parse_args()
    manifest=json.loads(MANIFEST.read_text(encoding='utf-8'))
    records=manifest['portraits']
    if args.status or args.check:
        code=check_site(records, args.require_all_local)
        if args.status:
            print(json.dumps({'pending': [{'practitioner':r['practitioner_name'],'expected_file':r['filename'],'source':r.get('verified_source_url') or r.get('previous_external_url')} for r in records if r.get('status') not in ('locally_imported_original','locally_imported_lossless_from_user_upload')]},indent=2))
        return code

    if args.source_dir:
        if not args.approvals or not args.approvals.is_file():
            print('STOP: an existing private --approvals JSON file is required for source-directory imports',file=sys.stderr)
            return 2
        try:
            if args.approvals.resolve().is_relative_to(ROOT.resolve()):
                print('STOP: approval evidence must remain outside the public website root',file=sys.stderr)
                return 2
        except AttributeError:
            pass
        approvals=json.loads(args.approvals.read_text())
    else:
        approvals=None

    staged={}
    try:
        for rec in records:
            if rec.get('status') in ('locally_imported_original','locally_imported_lossless_from_user_upload'):continue
            filename=rec['filename']
            if args.source_dir:
                source=args.source_dir/filename
                if not source.is_file():continue   # incremental import, never broken placeholder
                data=source.read_bytes()
                approver_record(rec,approvals,data)
            else:
                try:data=fetch_official(rec['verified_source_url'])
                except Exception as e:
                    print(f'SKIP {filename}: {e}',file=sys.stderr)
                    continue
            dims=image_dimensions(data,filename)
            if (TEAM/filename).exists():
                raise ValueError(f'{filename}: local file already exists but is not registered; stop for investigation')
            staged[filename]=(data,dims)
        if not staged:
            print('No authentic image originals could be imported; all current pages remain unchanged.')
            return 1

        # Compute every HTML change in memory before writing anything.
        edits={}
        for p in ROOT.rglob('*.html'):
            previous=p.read_text(encoding='utf-8')
            new=previous
            for rec in records:
                if rec['filename'] in staged:
                    new,_=replace_sources_in_html(new,p,rec)
            if new!=previous:edits[p]=new
        if not edits:
            raise ValueError('No matching practitioner HTML references for imported original images')

        for rec in records:
            if rec['filename'] not in staged:continue
            blob,dims=staged[rec['filename']]
            rec.update(status='locally_imported_original',sha256=digest(blob),width=dims[0],height=dims[1],size_bytes=len(blob))
        remaining=[r['practitioner_name'] for r in records if r.get('status') not in ('locally_imported_original','locally_imported_lossless_from_user_upload')]
        manifest['status']='all_verified_originals_hosted_locally' if not remaining else 'partially_locally_hosted_originals'
        manifest['warning']=('All originals hosted locally; the separate institutional photo authenticity approval is still independently controlled.'
            if not remaining else f'{len(remaining)} identified practitioner originals remain remote. Missing images are never replaced by placeholders.')
        # Never claim a signed institutional library publication approval simply because an
        # already-live photo has been mirrored locally.
        library=json.loads(LIBRARY.read_text(encoding='utf-8'))
        for ref in library['existingProductionReferences']:
            imagefile=ref['id'].replace('practitioner-','')+'.jpg'
            if imagefile in staged:
                ref['path']='assets/team/'+imagefile
                ref['status']='existing_production_original_mirrored_locally_not_newly_approved'
        library['missingOrUnverified']=f'{len(remaining)} original practitioner files remain external; two practitioners have no public verified photograph; independent institutional approval is still required.'
        # Preserve source inputs/approval outside public webroot. No image processing.
        for filename,(blob,_) in staged.items():
            (TEAM/filename).write_bytes(blob)
        for p,new in edits.items():p.write_text(new,encoding='utf-8')
        MANIFEST.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
        LIBRARY.write_text(json.dumps(library,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
        print(f'IMPORTED: {len(staged)} unchanged JPEG originals; updated {len(edits)} HTML pages; {len(remaining)} still remote')
        return check_site(records, args.require_all_local)
    except Exception as e:
        print(f'STOP: {e}. No substitute photos will be used.',file=sys.stderr)
        return 2


if __name__=='__main__':sys.exit(main())
