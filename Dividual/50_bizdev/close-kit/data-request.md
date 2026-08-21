# Data request — what the diagnostic needs

*Dividual · dividual.studio · [hello@dividual.studio]*

What we need from you to run the diagnostic, and — as important — what we don't. Share this with your data team to check feasibility before we start; the exact field list comes with the scope agreement, after the NDA.

## What we need — a per-player event slice

- **A pseudonymous player id** — a hashed key, no real names.
- **Event timestamps** — per match or session.
- **Session / match markers** — enough to group events into sessions.
- **A few state signals per event** — for example an activity or vitality measure, a social signal, and a performance signal. We map these to whatever your telemetry already carries.
- **An outcome marker** — last-active date, or whether the player has churned by a chosen horizon.

## Size

A sample cohort is enough — roughly **[N]** players over **[M]** weeks. A full population isn't required for the diagnostic.

## Format

CSV or Parquet, exported against a defined schema we provide after the NDA. About an hour of your data team's time.

## What we do NOT need

- No real names, emails, or account handles — pseudonymous keys only.
- No payment or financial information.
- No PII beyond the fields above.

## How it's handled

NDA-first; least-privilege access; held only for the engagement; returned or deleted at the end; no third parties.

---

*This is the shape, so you can confirm feasibility now. The precise schema (the `TelemetryBundle` contract) is handed over with the scope agreement.*
