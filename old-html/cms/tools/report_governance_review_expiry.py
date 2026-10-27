#!/usr/bin/env python3
"""Report pages approaching or past Next Review Due without changing public pages.

Reads either:
  - private approvals JSON passed with --approvals (preferred for operations), or
  - the generated public governance-published.js bundle (approved subset only).

Eligibility remains cms/governance-records.json. Unapproved pages stay off the report.
"""
from __future__ import annotations
import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / 'cms' / 'governance-records.json'
PUBLIC = ROOT / 'governance-published.js'
TZ = ZoneInfo('Australia/Brisbane')


def brisbane_today() -> date:
    return date.now(TZ).date()


def load_approvals(path: Path | None) -> dict[str, dict]:
    if path:
        payload = json.loads(path.read_text(encoding='utf-8'))
        rows = payload.get('records', payload if isinstance(payload, list) else [])
        return {row['path']: row for row in rows if isinstance(row, dict) and row.get('path')}
    if not PUBLIC.is_file():
        return {}
    js = PUBLIC.read_text(encoding='utf-8')
    marker = 'window.WMC_APPROVED_GOVERNANCE = Object.freeze('
    if marker not in js:
        return {}
    data = json.loads(js.split(marker, 1)[1].split(');', 1)[0])
    return data if isinstance(data, dict) else {}


def parse_iso(value: object) -> date | None:
    if not isinstance(value, str):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def report(horizon_days: int, approvals_path: Path | None) -> int:
    registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
    eligible = {row['path']: row for row in registry.get('records', [])}
    approvals = load_approvals(approvals_path)
    today = brisbane_today()
    horizon = today + timedelta(days=horizon_days)

    overdue = []
    due_soon = []
    current = []
    incomplete = []

    for path, entry in sorted(approvals.items()):
        if path not in eligible:
            incomplete.append({'path': path, 'reason': 'not_in_eligibility_register'})
            continue
        status = entry.get('status')
        if status not in ('approved', 'published'):
            incomplete.append({'path': path, 'reason': f'status_{status}'})
            continue
        next_review = parse_iso(entry.get('nextReview') or entry.get('nextReviewDue'))
        last_reviewed = parse_iso(entry.get('lastReviewed'))
        owner = entry.get('contentOwner')
        reviewer = entry.get('reviewedBy')
        if not next_review or not last_reviewed or not owner or not reviewer:
            incomplete.append({'path': path, 'reason': 'missing_public_fields'})
            continue
        row = {
            'path': path,
            'collection': eligible[path].get('collection'),
            'reviewType': eligible[path].get('reviewType'),
            'reviewedBy': reviewer,
            'contentOwner': owner,
            'lastReviewed': last_reviewed.isoformat(),
            'nextReviewDue': next_review.isoformat(),
            'daysRemaining': (next_review - today).days
        }
        if next_review < today:
            overdue.append(row)
        elif next_review <= horizon:
            due_soon.append(row)
        else:
            current.append(row)

    awaiting = [
        {
            'path': path,
            'collection': row.get('collection'),
            'reviewType': row.get('reviewType'),
            'status': row.get('status')
        }
        for path, row in sorted(eligible.items())
        if path not in approvals or approvals[path].get('status') not in ('approved', 'published')
    ]

    payload = {
        'generatedOn': today.isoformat(),
        'timezone': 'Australia/Brisbane',
        'horizonDays': horizon_days,
        'counts': {
            'eligible': len(eligible),
            'approvedWithDates': len(overdue) + len(due_soon) + len(current),
            'overdue': len(overdue),
            'dueWithinHorizon': len(due_soon),
            'current': len(current),
            'awaitingReview': len(awaiting),
            'incompleteApprovals': len(incomplete)
        },
        'overdue': overdue,
        'dueWithinHorizon': due_soon,
        'current': current,
        'awaitingReviewSample': awaiting[:25],
        'incompleteApprovals': incomplete
    }

    out = ROOT / 'cms' / 'governance-expiry-report.json'
    out.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print(f'GOVERNANCE EXPIRY REPORT: eligible={payload["counts"]["eligible"]} approved={payload["counts"]["approvedWithDates"]} overdue={payload["counts"]["overdue"]} due_within_{horizon_days}d={payload["counts"]["dueWithinHorizon"]} awaiting={payload["counts"]["awaitingReview"]}')
    print(f'Wrote {out.relative_to(ROOT).as_posix()}')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--approvals', type=Path, help='Private approvals JSON outside the public web root')
    parser.add_argument('--horizon-days', type=int, default=60, help='Warn when Next Review Due is within this many days')
    args = parser.parse_args()
    try:
        sys.exit(report(args.horizon_days, args.approvals))
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f'GOVERNANCE EXPIRY REPORT ERROR: {error}', file=sys.stderr)
        sys.exit(1)
