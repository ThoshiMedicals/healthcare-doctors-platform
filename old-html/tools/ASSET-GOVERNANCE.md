# Practitioner and brand asset governance — deployment instructions

**Approved website remains unchanged visually.** Brand, AGPAL and bulk-billing assets are copied byte-for-byte to `/assets/brand/`, with original filenames, byte hashes and legacy copies retained. All HTML and structured metadata references now use the approved locally hosted copies in that directory.

**Important current status:** The supplied production archive contained no original practitioner portraits, and source downloads could not be completed in the audit environment. The 11 actual clinician portraits still have their existing verified URLs as the visible source; **full local photo migration is NOT complete**. Do not report it as complete or disconnect WordPress media hosting until the files are imported and verified. The team manifest is an asset register, not an approval of missing files.

## Complete on an internet-enabled authorised workstation

1. Use original, unmodified JPEG files obtained from `gabbamedicalcentre.com.au` (the original WordPress media URLs are pinned in `assets/team/MANIFEST.json`), or have an authorised administrator supply the exact 11 verified original files under their mapped filenames. Never generate portraits or extract/crop them from rendered screenshots.
2. From this directory run `python tools/import_verified_practitioner_photos.py --download`, or `python tools/import_verified_practitioner_photos.py --source-dir /path/to/approved-originals`.
3. The script fails without changing HTML unless all 11 original files pass JPEG format, size and decoding checks. If successful, it copies their bytes unchanged, updates all practitioner image `src` references to `/assets/team/` using each page's correct relative path, updates practitioner schema/social preview URLs to the site-local absolute URLs, and records hashes and dimensions.
4. Obtain owner identity/photo-use approval for every portrait and compare each person with verified practice records. Matching filename and a valid JPEG alone are not identity verification.
5. Run `python tools/import_verified_practitioner_photos.py --status`. It must report `all_local: true` before WordPress image URLs can be decommissioned. Test production paths at desktop and mobile sizes, all team and clinician pages, and social preview image paths.
6. Dr Nirupa Sivathasan and Mr Samuel Stafford have no verified public portrait in the baseline and intentionally retain the existing professional no-photo state pending authorised photography.

Two non-practitioner media URLs (reception `2025/05/img2.png` and Wikimedia Commons Gabba precinct photo) remain external because the original image bytes were not available. Migrating them is a separate source/provenance task; retain CC0 attribution if moving the Gabba image.

**Never add approval/review claims without documentary evidence.** Any future media replacement requires visual inspection and asset manifest hash refresh.
