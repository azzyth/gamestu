# MVP Plan — Game to Study Ratio

## 1. MVP Goal

Prove that a simple game-vs-study ratio, tracked over a few weeks, can produce a prediction students find credible and useful enough to keep logging for. The MVP is not about full ML sophistication — it's about validating that the core loop (log → see ratio → get a signal → act) is something students actually use.

## 2. Core MVP Features (in scope)

1. **Manual time logging** — simple daily entry for game hours and study hours. No integrations yet.
2. **Ratio dashboard** — a single, clear view of the current ratio and a trend line over the last 2–4 weeks.
3. **Baseline prediction model** — a lightweight model (can start as a rules-based or regression baseline, not deep ML) that flags risk level: low / moderate / high, based on ratio trend.
4. **Threshold alert** — one notification type: "your ratio has crossed into higher-risk territory."
5. **Weekly summary** — a plain-language recap ("You averaged a 2:1 game-to-study ratio this week, trending up from last week.")

## 3. Explicitly Out of Scope for MVP

- Automatic time capture (Steam/console/calendar/LMS integrations)
- Genre-level or subject-level analytics breakdowns
- Personalized recommendation engine beyond the single threshold alert
- Goal-setting and progress tracking against custom targets
- Parent/advisor export or sharing features
- Any deep learning model — start with the simplest model that produces a directionally correct signal

Cutting these keeps the MVP buildable by a small team in weeks, not months, and keeps the first thing users see focused on one question: *is my ratio a problem or not?*

## 4. Why This Scope

Every MVP feature maps directly to the core loop from the PRD (log → see → predict → act). Everything cut is either a friction-reducer (integrations) or a depth-adder (analytics, recommendations) — valuable, but not needed to test whether the core prediction loop is worth building further.

## 5. Success Criteria to Move Past MVP

- Users voluntarily log data for at least 3 consecutive weeks without heavy reminder nudging.
- A majority of surveyed users say the risk flag ("low/moderate/high") felt accurate in hindsight.
- At least one clear behavior change signal: users who got a "high" alert show a measurable ratio shift within 2 weeks afterward.

If these hold, the roadmap moves to real ML modeling, integrations, and personalization. If they don't, revisit whether the core prediction concept — not just the feature set — needs rethinking.

## 6. Build Plan (rough sequencing)

1. Data model + manual logging (frontend + backend)
2. Ratio calculation + dashboard chart
3. Baseline risk model (rules-based or simple regression on early cohort/proxy data)
4. Threshold alert + weekly summary notification
5. Closed beta with a small student cohort to collect real logging data and feedback

## 7. Open Questions

- What proxy do we use for "risk" before we have real grade outcome data to validate against?
- Closed beta size and recruitment — existing student network, campus partnership, or open signup?
