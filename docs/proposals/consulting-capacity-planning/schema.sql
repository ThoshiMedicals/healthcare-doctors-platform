-- Consulting Capacity Planning — SQL sketch (Postgres)
-- Companion to schema.prisma; clinic_id FK → clinics(id)

CREATE TYPE session_period AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE nursing_coverage_level AS ENUM ('none', 'limited', 'full');
CREATE TYPE capacity_plan_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE consulting_rooms (
  id          TEXT PRIMARY KEY,
  clinic_id   TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  notes       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, name)
);

CREATE TABLE consulting_session_windows (
  id          TEXT PRIMARY KEY,
  clinic_id   TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL, -- align with existing day_of_week enum
  period      session_period NOT NULL,
  starts_at   TEXT NOT NULL,
  ends_at     TEXT NOT NULL,
  is_offered  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, day_of_week, period)
);

CREATE TABLE nursing_session_coverages (
  id                   TEXT PRIMARY KEY,
  clinic_id            TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  session_window_id    TEXT NOT NULL UNIQUE REFERENCES consulting_session_windows(id) ON DELETE CASCADE,
  coverage_level       nursing_coverage_level NOT NULL DEFAULT 'full',
  max_supported_rooms  INT,
  nurse_count          INT NOT NULL DEFAULT 0,
  notes                TEXT NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gp_session_assignments (
  id                TEXT PRIMARY KEY,
  clinic_id         TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  practitioner_id   TEXT REFERENCES practitioners(id) ON DELETE SET NULL,
  doctor_name       TEXT NOT NULL,
  room_id           TEXT NOT NULL REFERENCES consulting_rooms(id) ON DELETE RESTRICT,
  session_window_id TEXT NOT NULL REFERENCES consulting_session_windows(id) ON DELETE CASCADE,
  effective_from    TIMESTAMPTZ,
  effective_to      TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  notes             TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX gp_session_assignments_active_room_window
  ON gp_session_assignments (room_id, session_window_id)
  WHERE is_active = TRUE;

CREATE TABLE capacity_plans (
  id                           TEXT PRIMARY KEY,
  clinic_id                    TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name                         TEXT NOT NULL,
  status                       capacity_plan_status NOT NULL DEFAULT 'draft',
  target_sessions_per_gp       INT NOT NULL DEFAULT 4,
  reserve_free_sessions        INT NOT NULL DEFAULT 0,
  notes                        TEXT NOT NULL DEFAULT '',
  last_computed_at             TIMESTAMPTZ,
  available_consulting_sessions INT,
  total_offered_sessions       INT,
  used_sessions                INT,
  capacity_percentage          NUMERIC(5,2),
  recommended_gp_targets       INT,
  computation_json             JSONB,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
