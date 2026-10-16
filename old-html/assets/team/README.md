# Practitioner photography — locally hosted owner-supplied portraits

The website owner supplied 11 named PNG portraits. All eleven have been mapped to the existing 11 photo-enabled doctor profiles and are stored here as **lossless WebP full-resolution images**. Each full image (1122 x 1402 pixels) was decoded and verified pixel-for-pixel against the supplied PNG. The portrait's 4:5 presentation is controlled by existing CSS, without face modification. Responsive 640 x 800 WebP thumbnails are also provided to avoid downloading full-resolution files in card views.

Homepage, Team, General Practitioners and individual practitioner profile photos use these local assets, and associated metadata points to the matching on-site image. The prior external portrait URLs are retained only as historical evidence in the manifests, not used by public HTML.

Source filenames and SHA-256 values are recorded in `MANIFEST.json` and `qa/PRACTITIONER-PHOTO-INTEGRATION.json`. The uploader supplied photos named after practitioners; independent clinical/practice verification of those matches should be completed before public publication. No signed approvals, identities or permissions have been invented.

**No portrait supplied:** Dr Nirupa Sivathasan and Mr Samuel Stafford have no supplied image, and their profile presentation remains unchanged. Do not substitute another person's photo or invent an image.

For release integrity run from the website root:

```sh
python tools/import_verified_practitioner_photos.py --check --require-all-local
python tools/check_institutional_image_library.py
python tools/check_production_regression.py
```

To update portraits in the future, preserve the uploaded original privately, confirm the practitioner/filename mapping, prepare lossless full-resolution local imagery and responsive derivatives, and update all three photo manifests. Never generate, swap or alter faces.
