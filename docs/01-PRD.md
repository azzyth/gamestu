# Product Requirements Document — Game to Study Ratio

## 1. Overview

**Game to Study Ratio** is a personal academic assistant that helps students understand how their gaming time affects their academic performance. It combines a full-stack tracking app with a machine learning pipeline that analyzes the relationship between hours spent gaming and hours spent studying, then surfaces predictions and insights the student can act on.

**Problem it solves:** Students who game regularly often can't tell, in concrete terms, whether their gaming is hurting their grades or whether their study routine can comfortably absorb it. The trade-off is usually managed by guesswork or guilt, not data.

**Core benefit:** Turns two numbers most students already track loosely in their heads (game hours, study hours) into a predictive, personalized signal about academic risk — before a bad grade confirms it.

## 2. Target Audience

- **Primary:** High school and university students who play video games regularly and want to keep doing so without quietly tanking their GPA.
- **Secondary:** Students on academic probation or parental/advisor oversight who need an objective way to demonstrate balance.
- **Tertiary:** Parents, tutors, or academic advisors who want a shared, non-confrontational way to discuss screen time with a student.

Common trait across all three: they don't want to quit gaming, they want to know where the line is.

## 3. Goals & Objectives

- Give students an accurate, personalized prediction of how their current game-to-study ratio is likely to affect their grades.
- Replace anxiety-driven guessing with a concrete, data-backed number they can check regularly.
- Make the feedback loop fast enough (near real-time) that it can influence decisions in the moment, not just after a semester ends.
- Keep the tool lightweight enough that logging hours doesn't itself become a chore that gets abandoned.

## 4. Features

| Feature | Description | User need it addresses |
|---|---|---|
| Time logging | Manual and/or automatic capture of daily gaming hours and study hours | Foundation data — nothing works without accurate input |
| Ratio calculation & dashboard | Computes and visualizes the game:study ratio over time | "Am I balanced right now?" |
| ML-based grade impact prediction | Model trained on historical ratio + outcome data predicts likely academic impact of current habits | The core value prop — moving from tracking to prediction |
| Real-time feedback / alerts | Notifies the student when their ratio trend crosses a risk threshold | Catch the problem before it becomes a bad grade |
| Analytics & trends view | Breaks down patterns by day of week, game genre, subject, exam proximity, etc. | Understand *why*, not just *that* |
| Personalized recommendations | Suggests adjustments (e.g., "your ratio on weekdays before exams is your biggest risk window") | Turns insight into action |
| Goal setting | Lets students set a target ratio or study-hour goal and track progress against it | Motivation and accountability |
| Optional integrations | Pull study hours from calendar/LMS; pull game hours from platform APIs (Steam, console, etc.) where available | Reduce manual logging friction |

## 5. User Personas

**"Balancing Ben" — University sophomore, CS major**
Plays 10–15 hrs/week competitively, worried it's creeping up during midterms but has no evidence either way. Wants a number, not a lecture.

**"Probation Priya" — High schooler on academic watch**
Parents and school want proof of behavior change. Wants a neutral, non-nagging tool she controls herself, not surveillance software.

**"Casual Carlos" — Grad student, occasional gamer**
Only checks in occasionally; wants low-friction logging and a simple weekly summary rather than a dashboard he has to actively manage.

## 6. Success Metrics

- **Prediction usefulness:** % of users who report the prediction matched their actual grade trend within one letter-grade band (self-reported survey).
- **Engagement:** Weekly active logging rate among registered users (target: majority of users log at least 4 of 7 days).
- **Retention:** % of users still logging after 30 and 90 days.
- **Behavior change:** % of users whose ratio moves toward their stated goal within 4 weeks of receiving their first risk alert.
- **Model quality:** Prediction model accuracy/AUC on held-out historical cohort data, tracked per release.

## 7. Requirements

### Functional
- User account + secure login
- Daily/weekly time entry (manual) with reminders
- Optional API/integration hooks for automatic time capture
- ML inference pipeline that returns a prediction + confidence indicator, not just a raw number
- Dashboard with historical trend charts
- Notification system for threshold-based alerts
- Exportable summary (for students who need to show a parent/advisor)

### Non-functional
- Predictions and dashboard updates should feel "real-time" — under a few seconds after new data is logged
- Data is personal and sensitive (academic performance); needs strong privacy controls and clear data-use disclosure
- Must work reliably on mobile, since logging happens on the go
- Model should be retrainable/updatable as more usage data accumulates, without breaking the live product

## 8. Timeline (high-level)

See `02-MVP-Plan.md` and `03-Product-Roadmap.md` for phased scope and sequencing.

## 9. Open Questions

- Where does initial training data for the prediction model come from before the product has its own users (cold-start problem)?
- How is "grade impact" actually measured/validated — self-reported grades, LMS integration, or proxy signals (study session completion, quiz scores)?
- What's the accuracy bar below which a prediction shouldn't be shown to avoid misleading students?
- Privacy/compliance requirements if used by minors (FERPA-equivalent considerations, parental visibility features for the probation persona).
