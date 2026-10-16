#!/usr/bin/env python3
"""Build a production ZIP with automatic Digital Reception index refresh.

Run from any directory:
  python tools/build_website_release.py --output /path/to/website-release.zip

No page templates, artwork, content, booking links or UI scripts are rewritten.
For safety, deploy the resulting ZIP as the WHOLE website release package.
"""
from __future__ import annotations
import argparse
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INDEX_SCRIPT=ROOT/'cms/tools/build_digital_reception_index.py'
METADATA_SCRIPT=ROOT/'cms/tools/check_search_metadata.py'
PRACTITIONER_IMAGES_SCRIPT=ROOT/'tools/import_verified_practitioner_photos.py'
PUBLISHING_CHECK=ROOT/'cms/tools/check_knowledge_publishing.py'
GOVERNANCE_SCOPE_CHECK=ROOT/'cms/tools/check_governance_framework.py'
GOVERNANCE_EVIDENCE_CHECK=ROOT/'cms/tools/build_clinical_governance.py'
SKIP={'__pycache__','.DS_Store','Thumbs.db'}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True,type=Path,help='Production ZIP destination, outside the website root')
    parser.add_argument('--require-local-practitioner-photos',action='store_true',help='Prevent release until all 11 existing remote practitioner photo originals have been imported')
    parser.add_argument('--publishing-register',type=Path,help='Optional PRIVATE exported editorial register (must remain outside the public website root); validates approval and published article state')
    parser.add_argument('--governance-approvals',type=Path,help='PRIVATE signed governance approvals JSON outside webroot, required when any public review records are approved')
    args=parser.parse_args()
    target=args.output.expanduser().resolve()
    if target.suffix.lower()!='.zip':parser.error('--output must end with .zip')
    if target==ROOT or ROOT in target.parents:
        parser.error('Release ZIP must be OUTSIDE the website directory')
    if target.exists():parser.error('Refusing to overwrite an existing production ZIP')

    # Prevent releases with broken or misrouted imported practitioner imagery.
    # Existing untouched external originals remain allowed unless explicitly
    # enforcing the all-local cutover flag for final migration sign-off.
    photo_gate=[sys.executable,str(PRACTITIONER_IMAGES_SCRIPT),'--check']
    if args.require_local_practitioner_photos:
        photo_gate.append('--require-all-local')
    subprocess.run(photo_gate,cwd=ROOT,check=True)

    # Public seed must be valid. Optionally validate PRIVATE exported approvals, but
    # NEVER package the private register inside the public website release.
    private_register=args.publishing_register.expanduser().resolve() if args.publishing_register else None
    if private_register and (private_register==ROOT or ROOT in private_register.parents):
        parser.error('Private publishing register must be OUTSIDE the public website directory')
    publishing_gate=[sys.executable,str(PUBLISHING_CHECK)]
    if private_register:
        publishing_gate.extend(['--register',str(private_register),'--release'])
    subprocess.run(publishing_gate,cwd=ROOT,check=True)

    # Governance is a mandatory release gate, not a purely advisory CMS seed.
    # Scope is checked for every eligible page; approved labels must be backed by
    # the matching private sign-off evidence and unchanged reviewed content.
    private_approvals=args.governance_approvals.expanduser().resolve() if args.governance_approvals else None
    if private_approvals and (private_approvals==ROOT or ROOT in private_approvals.parents):
        parser.error('Private governance approvals must be OUTSIDE the public website directory')
    subprocess.run([sys.executable,str(GOVERNANCE_SCOPE_CHECK),'--check'],cwd=ROOT,check=True)
    evidence_gate=[sys.executable,str(GOVERNANCE_EVIDENCE_CHECK),'--check']
    if private_approvals:
        evidence_gate.extend(['--approvals',str(private_approvals)])
    subprocess.run(evidence_gate,cwd=ROOT,check=True)

    # Validate published search metadata before rebuilding the page index.
    subprocess.run([sys.executable,str(METADATA_SCRIPT)],cwd=ROOT,check=True)

    # Always regenerate on packaging; then check that page inventory and
    # all indexed content are in sync. Any failure stops the release.
    for mode in ('--build','--check'):
        subprocess.run([sys.executable,str(INDEX_SCRIPT),mode],cwd=ROOT,check=True)

    all_files=sorted(p for p in ROOT.rglob('*') if p.is_file() and not (set(p.relative_to(ROOT).parts)&SKIP))
    html=sum(p.suffix=='.html' for p in all_files)
    if not html:raise RuntimeError('Website has no HTML files; refusing to package')
    target.parent.mkdir(parents=True,exist_ok=True)
    try:
        with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=8) as archive:
            for file in all_files:
                name=Path(ROOT.name)/file.relative_to(ROOT)
                archive.write(file,name.as_posix())
        with zipfile.ZipFile(target) as archive:
            bad=archive.testzip()
            if bad:raise RuntimeError('ZIP CRC check failed: '+bad)
            if len(archive.namelist())!=len(all_files):raise RuntimeError('ZIP manifest is incomplete')
    except Exception:
        target.unlink(missing_ok=True)
        raise
    print(f'RELEASE PASS: {html} HTML pages, {len(all_files)} files, Digital Reception rebuilt and checked')
    print(f'ZIP: {target} ({target.stat().st_size} bytes)')

if __name__=='__main__':main()
