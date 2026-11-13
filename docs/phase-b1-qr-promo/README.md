# WMC Patient App — in-practice QR promotional pack (pre-cutover)

**Status:** **NOT FOR DISTRIBUTION** until production DNS cutover **and** live apex QR destination verification.

| Item | Value |
| --- | --- |
| Target install URL (production apex) | `https://gabbamedicalcentre.com.au/install-wmc-app.html` |
| Reception QR destination | `…?source=reception-qr` |
| Waiting-room QR destination | `…?source=waiting-room-qr` |
| Verified staging code tip | `f6bba5ca0deea4ef70ebed64c64f35a9ca8d78dd` |
| QR colour | WMC navy `#0B2545` on white; ECC **H** |

## Files

| File | Use |
| --- | --- |
| `wmc-install-qr-production-reception.png` / `.svg` | Reception counter card QR |
| `wmc-install-qr-production-waiting-room.png` / `.svg` | Waiting-room poster QR |
| `reception-counter-card.html` | A6/A5 printable counter card |
| `waiting-room-poster.html` | A3/A4 printable poster |
| `staff-briefing-install-script.md` | Reception script (print or laminate) |

## Print guidance

1. Open the HTML files in Chrome → Print → **Save as PDF** or print colour.
2. Prefer matte stock; keep QR ≥ 40 mm wide on counter cards and ≥ 80 mm on posters.
3. Do **not** laminate over a glossy film that causes camera glare on the QR.
4. Before any public display: scan each printed QR on iPhone and Android and confirm the opened URL is the **production** install page (not WordPress homepage, not staging).

## Why blocked today

Live apex `gabbamedicalcentre.com.au` remains WordPress until signed Hostinger cutover. Staging hosts correctly resolve host-aware QR; production destination is **preserved in code** but not yet the live patient origin.
