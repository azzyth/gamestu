# Feature Prioritization — Game to Study Ratio

Scored using **RICE** (Reach, Impact, Confidence, Effort). Scale: Reach = estimated % of active users who'd touch this monthly; Impact = 0.25 (minimal) to 3 (massive); Confidence = 0.5–1.0; Effort = person-weeks. RICE score = (Reach × Impact × Confidence) / Effort — higher = higher priority.

| Feature | Reach | Impact | Confidence | Effort (wks) | RICE Score | Priority |
|---|---|---|---|---|---|---|
| Manual time logging | 100% | 3 | 1.0 | 2 | 150 | P0 — Must |
| Ratio dashboard | 100% | 2.5 | 1.0 | 2 | 125 | P0 — Must |
| Baseline risk prediction | 90% | 3 | 0.8 | 3 | 72 | P0 — Must |
| Threshold alert | 80% | 2 | 0.9 | 1 | 144 | P0 — Must |
| Weekly summary | 80% | 1.5 | 0.9 | 1 | 108 | P1 — Should |
| Real ML prediction model | 90% | 3 | 0.6 | 5 | 32.4 | P1 — Should |
| Calendar/LMS integration (auto study time) | 60% | 2 | 0.7 | 4 | 21 | P1 — Should |
| Game platform API integration | 50% | 2 | 0.6 | 4 | 15 | P2 — Could |
| Day-of-week / exam-proximity analytics | 50% | 1.5 | 0.8 | 3 | 20 | P2 — Could |
| Goal setting & progress tracking | 40% | 1.5 | 0.8 | 2 | 24 | P1 — Should |
| Personalized recommendations engine | 60% | 2.5 | 0.5 | 6 | 12.5 | P2 — Could |
| Genre/subject-level analytics | 30% | 1 | 0.7 | 3 | 7 | P3 — Won't (yet) |
| Parent/advisor sharing view | 25% | 2 | 0.6 | 4 | 7.5 | P3 — Won't (yet) |
| Cross-student benchmarking | 20% | 1 | 0.4 | 5 | 1.6 | P3 — Won't (yet) |

## MoSCoW summary

- **Must have (P0):** Manual logging, ratio dashboard, baseline risk prediction, threshold alert — this is the entire MVP loop from `02-MVP-Plan.md`.
- **Should have (P1):** Weekly summary, real ML model, calendar/LMS integration, goal setting — these convert the MVP loop into a durable, trustworthy product.
- **Could have (P2):** Game platform API integration, exam-proximity analytics, recommendations engine — valuable but not blocking core value delivery.
- **Won't have (yet) (P3):** Genre/subject analytics, parent/advisor sharing, cross-student benchmarking — deferred pending either more usage data, a privacy review (sharing features), or clearer demand signal.

## Notes on scoring judgment calls

- **Confidence is capped low on anything ML-related** (real prediction model, recommendations engine) until real outcome data exists to validate against — this is the same cold-start risk flagged as an open question in the PRD and MVP Plan.
- **Parent/advisor sharing scores lower on Reach** deliberately — it serves one persona (Probation Priya), not the general user base, even though its Impact for that segment is high.
- **Effort estimates assume a small team** (2–4 people); rescale if team size differs.

## Open Questions

- Should P1 items be re-ordered once real beta data comes in from the MVP (i.e., does "goal setting" actually matter to users, or was that an assumption)?
- Is there a compliance/legal review needed before starting any P2/P3 work involving minors' data (parent sharing) — this may need to move earlier regardless of RICE score.
