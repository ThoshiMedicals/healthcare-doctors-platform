# Attraction Analytics Instrumentation

Sources:

- `docs/proposals/gp-attraction-analytics/`
- `docs/proposals/gp-attraction-knowledge-graph/`
- `docs/proposals/gp-attraction-content-intelligence/`

## Tracked signals

| Signal | Events |
| --- | --- |
| FAQ usage | `faq_open`, `faq_helpful_vote` |
| Readiness completion | `tool_complete` (`doctor-readiness`) |
| EOI paths | `path_edge`, `eoi_start`, `eoi_submit` |
| Practice Experience engagement | `page_view` / `module_view` on `practice_experience` |
| Opportunity Pack downloads | `pack_download` / `cta_click=opportunity_pack_download` |

## Event schema

Canonical names + surfaces: `apps/web/src/attraction-analytics/event-schema.ts`  
Proposal base: `docs/proposals/gp-attraction-analytics/event-model.json`  
Extended surfaces: `practice_experience`, `opportunity_pack` (existing attraction products).

## Tracking architecture

```
attraction-track.js (public pages)
        │
        ▼
POST /api/attraction-analytics/events  (anonymous, PII rejected)
        │
        ▼
GpAttractionEvent
   ├── GET /api/admin/attraction-analytics/dashboard
   └── POST /api/admin/attraction-analytics/graph-ingest
            ├── AttractionKnowledgeGraphSnapshot
            ├── ContentIntelligenceSignalDaily
            └── ContentIntelligenceInsightRun (advisory)
```

Server emits:

- Readiness complete → `tool_complete`
- EOI submit → `eoi_submit` (+ `path_edge` when readiness linked)

## Dashboards

- Admin: `/admin/attraction-analytics`
- Architecture: `/admin/attraction-analytics/architecture`

## Graph ingestion plan

1. Aggregate 28d events  
2. Build nodes/edges (faq, readiness, eoi_path, intelligence)  
3. Snapshot graph  
4. Mirror signals for Content Intelligence  
5. Emit monthly recs as **proposed** — human editors decide  

## Guards

- No automated EOI / hire / publish decisions  
- No AHPRA / provider number / CV text in events  
- Persona is a hint label only  
