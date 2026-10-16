# WordPress migration toolkit

Crawl date: 13 October 2026. Source: the live WordPress site at `https://gabbamedicalcentre.com.au`. The site was not changed.

The current public site is WordPress on Hostinger, with Yoast SEO. That describes the site being replaced. It is not the deployment target. The new platform is deployed to a VPS with Cloudflare DNS, as written in `deployment/LAUNCH.md`. `robots.txt` points at `https://gabbamedicalcentre.com.au/sitemap_index.xml`. That index lists posts, pages, doctors, locations, services, categories, tags, portfolio categories, authors, and one Elementor template.

Approved destinations are the pages already stored for `https://gabbamedicalcentre.com.au/`. A match is recorded only when that approved file exists. This toolkit does not add redirect rules to the new site.

HTTP and `www` already redirect to `https://gabbamedicalcentre.com.au` in the Nginx configuration. Those host redirects are not repeated here.

## Files

| File | Use |
| --- | --- |
| `wordpress-urls.csv` | Every crawled page URL, with its type |
| `wordpress-media-urls.csv` | 89 WordPress upload URLs named in the sitemaps. Do not redirect these to pages |
| `redirect-map.csv` | Full proposed map, including rows that must not be imported yet |
| `redirect-import.csv` | 45 rows safe to load as 301 rules |
| `manual-review.csv` | Rows that need a person before any rule is added |
| `summary.json` | Counts from this crawl |

`redirect-import.csv` uses `source,target,regex,code`. `regex` is `0` and `code` is `301`. Paths keep the WordPress trailing slash. Targets are absolute `https://gabbamedicalcentre.com.au/...` addresses.

## Crawl result

218 page URLs. 207 came from the Yoast sitemaps. 11 more came from links on the homepage that the sitemap did not list, including the singular `/service/...` paths, `/bulk-billing/`, `/feed/`, and `xmlrpc.php`.

| Type | Exact | Proposed | Needs a person |
| --- | --- | --- | --- |
| Homepage | 1 | 0 | 0 |
| Practitioner | 12 | 1 | 0 |
| Service | 1 | 18 | 8 |
| Page | 3 | 11 | 7 |
| Post | 0 | 7 | 12 |
| Career | 0 | 1 | 2 |
| Location | 0 | 0 | 29 |
| Tag | 0 | 0 | 91 |
| Category, portfolio, author, template, system | 0 | 0 | 14 |

The homepage is an exact match and stays `https://gabbamedicalcentre.com.au/`. It is not in the import file because no redirect is required.

## Exact and proposed matches

Exact means the approved file uses the same slug, or the practitioner folder changes from `/doctor/` to `/doctors/`.

Examples:

- `/about-us/` to `/about-us.html`
- `/practice-information/` to `/practice-information.html`
- `/services/` to `/services.html`
- `/bulk-billing/` to `/bulk-billing.html`
- `/doctor/dr-anand-singh/` to `/doctors/dr-anand-singh.html`

Proposed means the slug differs, but the approved page is the clear equivalent. These are in `redirect-import.csv` when `import_ready` is `yes`. Examples: `/contact-us/` to `contact.html`, `/privacy-policy/` to `privacy-confidentiality.html`, `/doctors/` to `team.html`, `/appointments/` to `book-appointment.html`, `/patient-fee/` to `fees-billing.html`, and `/services/womens-health-doctors/` to `services/womens-health.html`. `/doctor/dr-steven-chang-chiropractor/` goes to `doctors/dr-steven-chang.html`.

Rows marked `review` have a suggested target in `redirect-map.csv` and are omitted from `redirect-import.csv`. They include the careers index, the flu-vaccine post, and the skin-check guide.

## Manual mapping

Do not import `manual-review.csv`.

Leave these unmatched so the new site returns the approved 404:

- 91 tag archives, 3 categories, and 5 portfolio categories left over from the theme
- 2 author archives
- the Elementor template URL
- `/feed/`, `/comments/feed/`, and `/xmlrpc.php`
- `/page-not-found/`

These content URLs have no approved equivalent. Pick a destination, or accept the 404, before cutover:

- 29 suburb landing pages under `/location/` and `/locations/`, including `/location/rtete/`
- services with no approved page: acupuncture, aviation medicals, chiropractic, exercise and sports medicine, kinesiology, sexual health, travel health, and accident and emergency
- clinic pages for cosmetic medicine, occupational health, and exercise and sports medicine
- marketing posts such as “GP near me”, “medical centre near me”, and the malformed slug `/https-gabbamedicalcentre-com-au-gp-near-me-woolloongabba/`
- two job adverts, `/thank-you/`, `/sitemap-html/`, and `/medical-centre/`

Suburb pages can later point at `contact.html` or the homepage, but only after the practice accepts that choice. A blanket redirect of tags or suburb pages to the homepage is not in the import file.

## What this toolkit does not do

The new site does not read these CSV files. Loading `redirect-import.csv` is a later cutover step in whatever redirect tool is used on the server. Review `manual-review.csv` first. Re-crawl `sitemap_index.xml` on the day of cutover, because WordPress can publish new URLs after this export.
