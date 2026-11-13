# WMC — Phase C0 infrastructure and ongoing cost estimates

**Indicative only (AUD, 2026).** Refine with actual Hostinger plan, Supabase tier and SMS vendor invoices before claiming savings.

---

## 1. Fit with current Hostinger architecture

| Component | MVP approach | Fit |
| --- | --- | --- |
| App runtime | Existing Hostinger Node Web App (Next.js 22) | Compatible |
| Database | Existing Supabase Postgres staging; future prod project | Compatible — additive tables |
| Push transport | Standard Web Push (VAPID) to browser push services | No always-on socket server needed |
| Job processing | Secured cron → `/api/engagement/worker` every 1–5 min | Compatible if Hostinger cron or external scheduler available |
| Media/CDN | Cloudflare in front (existing) | Compatible; do not cache authenticated admin APIs |

**Risks:** cold starts / single Node process — use DB leases for jobs; keep push payloads small; monitor worker duration vs Hostinger request limits.

---

## 2. One-time build / governance cost (effort)

| Workstream | Estimate |
| --- | --- |
| C1–C4 foundations + consent + subscribe | 2–4 engineer-weeks |
| C5–C7 inbox + admin + queue | 3–5 engineer-weeks |
| C8 iOS device hardening | 1 engineer-week + device time |
| C9 reporting / SMS economics | 1 engineer-week |
| C10 pilot + docs | 1 week calendar |
| Privacy PIA + legal review | External adviser fee (practice-specific) |
| Security review | 0.5–1 week |

---

## 3. Ongoing platform cost (monthly, order-of-magnitude)

| Item | Low | High | Notes |
| --- | --- | --- | --- |
| Hostinger Web App (already paid) | $0 incremental | plan upgrade if CPU | Worker adds load |
| Supabase Postgres storage/egress | ~$0–25 | ~$50+ | Event retention drives size |
| Web Push | ~$0 | ~$0 | Vendor push free at this scale typically |
| External cron (if needed) | $0–10 | $20 | |
| Monitoring / error tracking (optional) | $0–30 | $50 | |
| Staff time to author notices | ops | ops | Dominates “cost” |

---

## 4. SMS savings methodology (honest)

**Eligible avoidable SMS** = general operational/promotional messages the practice **would have sent by SMS** to a comparable consented list, **excluding**:

- Appointment reminders  
- Clinical recalls  
- Two-factor / transactional auth  
- Urgent individual clinical contact  

```
estimated_avoided_sms = min(
  consented_push_audience_reached_with_inbox_or_accept,
  documented_avoidable_sms_volume_for_same_campaign_type
)

estimated_gross_savings_aud =
  estimated_avoided_sms × documented_cost_per_sms_aud

estimated_net_savings_aud =
  estimated_gross_savings_aud − incremental_engagement_ops_cost_aud
```

Do **not** count push-service acceptance alone as avoided SMS without campaign policy evidence.

Example (illustrative, not a forecast): 200 avoidable SMS/month × $0.08 = $16 gross — meaningful only when volume and staff time scale.

---

## 5. Capacity assumptions (MVP)

| Metric | Comfortable MVP |
| --- | --- |
| Active subscriptions | up to ~5,000 devices |
| Announcements | ≤ 30 published / month |
| Fan-out | < 5,000 jobs / announcement |
| Event retention raw | 24 months |

Above that: add rollups, archival, or queue sharding.

---

## 6. Go-live cost checklist

- [ ] Confirm Hostinger cron or alternative scheduler  
- [ ] Confirm Supabase backup retention meets consent history needs  
- [ ] Budget legal/privacy review  
- [ ] Print/laminate costs for QR only after cutover (B1 pack)  
- [ ] Staff training time for Engagement Admin  

**No production spend authorised by this document alone.**
