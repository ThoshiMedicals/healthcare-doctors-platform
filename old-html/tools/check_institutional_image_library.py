#!/usr/bin/env python3
"""Read-only hash/provenance checks for the Woolloongabba institutional image inventory."""
import json,hashlib,sys
from pathlib import Path
try:
 from PIL import Image
except ImportError:
 raise SystemExit('Pillow required: python -m pip install pillow')
ROOT=Path(__file__).resolve().parents[1]
CAT=('hero','community','clinic-exterior','team','services','governance')
def digest(path):
 with open(path,'rb') as fp:return hashlib.file_digest(fp,'sha256').hexdigest()
def validate():
 errors=[];warnings=[];lib=json.loads((ROOT/'assets/IMAGE_LIBRARY.json').read_text(encoding='utf8'))
 if len(lib['categories'])!=6 or set(lib['categories'])!=set(CAT):errors.append('Exactly six governed categories are required')
 for c in CAT:
  p=ROOT/'assets'/c/('INSTITUTIONAL-CATEGORY.json' if c=='team' else 'MANIFEST.json')
  if not p.is_file():errors.append(f'Missing category manifest {p.relative_to(ROOT)}');continue
  manifest=json.loads(p.read_text(encoding='utf8'))
  if manifest['category']!=c:errors.append(f'Incorrect category in {p}')
  for new in manifest.get('approvedNewLibraryFiles',[]):
   if not any(r.get('path')==new and r.get('newLibraryEligible') for r in lib['records']):errors.append(f'Unregistered approved category asset: {new}')
 for r in lib['records']:
  pth=r.get('path')
  if pth:
   p=ROOT/pth
   if not p.is_file():errors.append(f'Missing image: {pth}');continue
   if digest(p)!=r.get('sha256'):errors.append(f'Changed image bytes: {pth}')
   with Image.open(p) as im:
    if (im.width,im.height)!=(r['width'],r['height']):errors.append(f'Unexpected image dimensions: {pth}')
  elif r.get('newLibraryEligible'):
   errors.append(f'Approved photo has no local file: {r["id"]}')
  if r.get('newLibraryEligible'):
   ev=r.get('approval',{})
   required=('approvalReference','approvedAt','approvedBy','authenticityReviewReference','rightsApprovalReference','sourceMasterSha256')
   if not all(ev.get(k) for k in required):errors.append(f'Image approved without evidence: {r["id"]}')
   if not any(c in CAT for c in r.get('categories',[])):errors.append(f'Approved photograph without category: {r["id"]}')
  elif r.get('kind','').endswith('_unverified') or r.get('publicationStatus','').startswith('legacy_frozen'):
   warnings.append(f'Provenance pending: {r["id"]}')
 for b in lib.get('nonPhotographicBrandAssets',[]):
  p=ROOT/b['path']
  if not p.is_file() or digest(p)!=b['sha256']:errors.append(f'Changed/missing brand artwork: {b["path"]}')
 result={'schema':lib['schema'],'htmlPages':len(list(ROOT.rglob('*.html'))),
  'categories':list(CAT),'inventoryRecords':len(lib['records']),
  'localRecords':sum(bool(r['path']) for r in lib['records']),
  'externalRecords':sum(not r['path'] for r in lib['records']),
  'approvedNewLibraryPhotos':sum(r['newLibraryEligible'] for r in lib['records']),
  'brandAssetsChecked':len(lib.get('nonPhotographicBrandAssets',[])),
  'missingAuthenticPhotoSubjects':lib.get('unfilledAuthenticPhotographyNeeds',[]),
  'errors':errors,'provenancePendingCount':len(warnings),'status':'PASS' if not errors else 'FAIL'}
 return result
if __name__=='__main__':
 report=validate();print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(0 if report['status']=='PASS' else 1)
