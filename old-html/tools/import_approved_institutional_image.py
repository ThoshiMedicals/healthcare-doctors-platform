#!/usr/bin/env python3
"""Evidence-gated import. Never edits HTML or invents a photograph.

Usage: python tools/import_approved_institutional_image.py --approval /secure/image-approval.json
       python tools/import_approved_institutional_image.py --approval /secure/image-approval.json --commit
Approval file & evidence must be outside the public web root.
"""
import argparse,datetime,hashlib,json,re,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
CATEGORIES={'hero','community','clinic-exterior','team','services','governance'}
SUFFIX={'.jpg','.jpeg','.png','.webp'}
RATIOS={'hero':[16/9,3/2,7/8],'community':[16/9,3/2],'clinic-exterior':[3/2,16/9],
 'team':[4/5,3/2],'services':[4/3,3/2,16/9],'governance':[4/3,3/2]}
def sha(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def required(d,k):
 v=d.get(k)
 if not (isinstance(v,str) and v.strip()):raise ValueError(f'Approval field required: {k}')
 return v.strip()
def approve(a):
 if a.get('template_only'):raise ValueError('Template has not been signed; cannot import')
 if a.get('publish_authorised') is not True:raise ValueError('publish_authorised must be explicitly true')
 for key in ('personal_information_protected','no_ai_generation_or_synthetic_reconstruction_confirmed','source_master_preserved_unmodified','crop_reviewed','colour_grading_reviewed'):
  if a.get(key) is not True:raise ValueError(f'Cannot publish until {key}=true')
 c=required(a,'category')
 if c not in CATEGORIES:raise ValueError('Category must be one of six governed folders')
 asset_id=required(a,'asset_id')
 if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',asset_id):raise ValueError('Asset ID requires lowercase hyphenated slug')
 for field in ('clinic','capture_date_or_source_attestation','photographer_or_rights_owner','capture_location',
               'authenticity_review_reference','rights_approval_reference','permitted_publication_scope',
               'consent_status','consent_reference_or_not_applicable_reason','crop_ratio_and_focal_point',
               'brand_approver','approval_reference','alt_text'):
  required(a,field)
 if c=='team':required(a,'named_practitioner_identity_reference_if_applicable')
 if a['consent_status'] not in ('obtained','not_applicable'):
  raise ValueError('Consent status must be obtained or not_applicable with valid explanation')
 d=datetime.date.fromisoformat(required(a,'approved_at_yyyy_mm_dd'))
 if d>datetime.date.today():raise ValueError('Approval date cannot be in future')
 master=Path(required(a,'source_master_file')).resolve(strict=True)
 asset=Path(required(a,'approved_asset_file')).resolve(strict=True)
 if ROOT==master or ROOT in master.parents or ROOT==asset or ROOT in asset.parents:
  raise ValueError('Private/source approval files must be outside public website root')
 if asset.suffix.lower() not in SUFFIX:raise ValueError('Web file must be jpg, png or webp')
 if sha(master)!=required(a,'original_file_sha256').lower():raise ValueError('Original master SHA mismatch')
 if sha(asset)!=required(a,'approved_asset_sha256').lower():raise ValueError('Approved derivative SHA mismatch')
 with Image.open(asset) as im:
  im.verify()
 with Image.open(asset) as im:w,h=im.size
 if w<600 or h<600:raise ValueError('Publication image must be >=600px in both axes')
 ratio=w/h
 if not any(abs(ratio-x)<.07 for x in RATIOS[c]):
  raise ValueError(f'{c} image crop ratio {ratio:.3f} does not match category standards')
 if len(a['alt_text'].strip())<8:raise ValueError('Provide meaningful approved alt text')
 target=ROOT/'assets'/c/(asset_id+asset.suffix.lower())
 if target.exists():raise ValueError(f'Refusing to overwrite existing photo: {target}')
 manifest=ROOT/'assets'/c/('INSTITUTIONAL-CATEGORY.json' if c=='team' else 'MANIFEST.json')
 m=json.loads(manifest.read_text(encoding='utf8'))
 libfile=ROOT/'assets/IMAGE_LIBRARY.json';lib=json.loads(libfile.read_text(encoding='utf8'))
 if any(r['id']==asset_id or r.get('path')==str(target.relative_to(ROOT)) for r in lib['records']):raise ValueError('Already registered asset id/path')
 entry={'id':asset_id,'path':str(target.relative_to(ROOT)),'categories':[c],'kind':'human_approved_authentic_photography',
 'format':asset.suffix.lower()[1:],'width':w,'height':h,'sha256':sha(asset),'sourceOriginal':master==asset,
 'provenance':{'sourceMasterSha256':sha(master),'captureLocation':a['capture_location'],'authenticityAttestation':True,'licenceScope':a['permitted_publication_scope'],'consentStatus':a['consent_status']},
 'approval':{'approvalReference':a['approval_reference'],'approvedAt':a['approved_at_yyyy_mm_dd'],'approvedBy':a['brand_approver'],
  'authenticityReviewReference':a['authenticity_review_reference'],'rightsApprovalReference':a['rights_approval_reference'],'sourceMasterSha256':sha(master)},
 'altText':a['alt_text'],'publicationStatus':'approved_for_future_placement','newLibraryEligible':True,'existingUsage':[]}
 return asset,target,entry,libfile,lib,manifest,m
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--approval',required=True);parser.add_argument('--commit',action='store_true');args=parser.parse_args()
 try:
  approvalpath=Path(args.approval).resolve(strict=True)
  if ROOT==approvalpath or ROOT in approvalpath.parents:raise ValueError('Signed approval file cannot be inside website')
  data=json.loads(approvalpath.read_text(encoding='utf8'))
  source,target,entry,lf,lib,mf,manifest=approve(data)
  if args.commit:
   target.write_bytes(source.read_bytes())
   lib['records'].append(entry);lf.write_text(json.dumps(lib,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
   manifest['approvedNewLibraryFiles'].append(entry['path']);mf.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
  print(json.dumps({'status':'IMPORTED' if args.commit else 'APPROVAL_VALID_DRY_RUN','assetId':entry['id'],'target':entry['path'],'sha256':entry['sha256'],
    'warning':'Does not edit HTML or automatically replace existing images. CMS needs separate approval and release.'},indent=2))
 except (ValueError,OSError,KeyError,TypeError) as e:print('BLOCKED:',str(e),file=sys.stderr);sys.exit(2)
