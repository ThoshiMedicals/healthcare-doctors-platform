# WMC — Phase C0 Patient notification UI specification

**Design only.** Preserve existing Patient Hub visual language (navy/teal, Libre Baskerville + Inter, mobile dashboard patterns). Do not invent a second product brand.

---

## 1. Surfaces

| Surface | Route (indicative) | Audience |
| --- | --- | --- |
| Preference / opt-in card | Injected on `patient-hub.html` + install landing | All patients |
| Notification Inbox | `patient-notifications.html` (Class B page + refinements) | Installed / web |
| Announcement detail | same page `?id=` or hash | |
| Public announcements | `practice-announcements.html` or Hub section | No install required |
| OS notification | System UI | Subscribed devices only |

---

## 2. Opt-in card (Hub)

**Placement:** Below install card / practice strip — never blocking Book / Call / Digital Reception.

**Content**

- Title: “Practice updates on this phone”
- Body: short explanation — hours, closures, access notices; optional educational tips if opted in.
- Clear statement: HotDoc still handles appointment reminders.
- Primary CTA: “Choose update preferences”
- Secondary: “Not now” (cooldown, non-blocking)

**Preferences sheet (modal or page)**

- Toggles: Operational hours · Access disruptions · Practice news · Promotional · Educational  
- Master: “Allow browser notifications” (only enables after L2+)  
- Links: Privacy notice, “How to turn off”, Inbox  
- Primary: Save → then permission prompt if needed  
- Never call `Notification.requestPermission()` before Save on an informed screen

**Accessibility**

- Focus trap in sheet; Escape closes; `role="dialog"` + labelled title  
- Toggles are real `switch`/`checkbox` with visible labels  
- ≥44px targets; honour `prefers-reduced-motion`  
- Do not use colour alone for on/off

---

## 3. Notification Inbox

**Layout (mobile-first)**

1. Header: “Practice notices”
2. Filter chips: All · Unread · Operational · News (optional)
3. List rows: title, summary (2 lines), relative time, unread marker
4. Empty state: “No notices yet. You can still view practice information on our website.”
5. Footer link: Manage preferences · Turn off notifications

**Detail view**

- Title, published time, expiry if any  
- Body (sanitised markdown → HTML)  
- Optional single action button (Contact, Directions)  
- “Got it” acknowledgement control  
- “Share” only if content is public (reuse existing share patterns carefully)

**Unread badge**

- Device-local count on Hub nav / PWA quicknav when standalone  
- Do not sync unread to named patient identity

**Accessibility**

- List as links/buttons with accessible names including unread state  
- Detail as article landmark  
- Live region for “Marked as read” confirmation

---

## 4. OS notification content rules

| Allowed | Forbidden |
| --- | --- |
| “Easter Saturday hours” | Patient name |
| “Temporary entry via …” | Test results / symptoms |
| “New GP joining our team” | Appointment time for a person |
| Link into Inbox | Medicare / phone / address of patient |

Title ≤ ~40 chars practical; body ≤ ~80 chars preview.

---

## 5. iPhone / Android behaviour copy

| Platform | UI note |
| --- | --- |
| Android | After consent, browser may show install + notification permission separately — explain both |
| iPhone | Push only when added to Home Screen on supported iOS; otherwise Inbox + public page |
| Permission denied | “You can still read notices in the Patient App inbox.” |

---

## 6. Fallback procedures (patient-visible)

1. Inbox unavailable → public announcements page + Contact  
2. Push failed → inbox still lists published items  
3. Urgent concern → “Call reception (07) 3217 3344” always visible  
4. Uninstall / clear site data → treat as new installation; do not recover named history

---

## 7. What not to build in C0 UI

- Chat with reception via push  
- Per-patient message threads  
- HotDoc appointment cards inside Inbox  
- Hard paywall / forced opt-in before booking
