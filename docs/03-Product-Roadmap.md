# Product Roadmap — Game to Study Ratio

Phased as **Now / Next / Later** rather than fixed dates, since timing depends on MVP validation results.

## Now (0–2 months) — Validate the core loop

Goal: prove the log → ratio → prediction → alert loop is worth building on.

- Manual time logging (game + study)
- Ratio dashboard with trend line
- Baseline rules-based/regression risk model
- Single threshold alert
- Weekly plain-language summary
- Closed beta with a small student cohort

*Exit condition: MVP success criteria met (see `02-MVP-Plan.md`).*

## Next (2–5 months) — Make the prediction real and reduce friction

Goal: move from a proxy risk signal to an actual ML model trained on real outcome data, and remove the biggest usage friction (manual logging).

- Real ML prediction model trained on beta cohort's logged ratios + reported grade outcomes
- Confidence indicator alongside predictions (not just a flat risk label)
- Automatic study-hour capture via calendar/LMS integration
- Automatic game-hour capture via platform APIs (start with Steam; expand later)
- Analytics breakdown by day-of-week and exam proximity (the highest-value cut, per PRD personas)
- Goal setting (target ratio / study-hour goal) with progress tracking

## Later (5+ months) — Personalize and extend reach

Goal: turn insight into action, and extend the tool beyond the individual student.

- Personalized recommendations engine (e.g., flagging specific risk windows, not just an overall trend)
- Genre-level and subject-level analytics
- Parent/advisor export or shared-view mode (for the "Probation Priya" persona) — opt-in, student-controlled
- Expanded platform integrations (console platforms beyond initial API coverage)
- Model retraining pipeline that improves automatically as the user base and outcome data grow
- Exploration: cross-student/anonymized benchmarking ("how does my ratio compare to similar students") — pending privacy review

## Sequencing logic

- Real ML prediction is gated behind having enough real outcome data — which only exists after the MVP beta runs, hence it's in "Next," not "Now."
- Integrations are deliberately deferred past the MVP: they reduce friction but don't test the core value proposition, and building them before knowing the loop works risks wasted effort.
- Personalization and sharing features come last because they compound on top of a model that already needs to be trustworthy — recommending action off an unproven prediction is riskier than just flagging risk.

## Open Questions

- What outcome data source (self-reported grades vs. LMS integration) determines when "Next" can start?
- Does the parent/advisor sharing feature require a different privacy/consent framework given younger users? Needs review before scheduling.
