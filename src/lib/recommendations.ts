import type { DailyLog, Exam } from "./types";
import { dailyRatio, sortByDate } from "./ratio";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Phase 3 recommendations engine. Mines only the user's own history and
 * returns at most one actionable suggestion, or null when nothing is warranted.
 */
export function buildRecommendation(
  logs: DailyLog[],
  exams: Exam[],
  now: Date = new Date()
): string | null {
  const sorted = sortByDate(logs);

  // 1. Upcoming exam within 7 days while the ratio runs hot.
  const upcoming = exams
    .map((e) => ({
      ...e,
      days: Math.ceil((new Date(e.exam_date + "T00:00:00").getTime() - now.getTime()) / 86_400_000),
    }))
    .filter((e) => e.days >= 0 && e.days <= 7)
    .sort((a, b) => a.days - b.days)[0];

  const last7 = sorted.slice(-7);
  const game = last7.reduce((s, l) => s + (Number(l.game_hours) || 0), 0);
  const study = last7.reduce((s, l) => s + (Number(l.study_hours) || 0), 0);
  const ratio = study > 0 ? game / study : game > 0 ? Infinity : null;

  if (upcoming && ratio !== null && ratio >= 1.5) {
    return `You have ${upcoming.subject} in ${upcoming.days === 0 ? "less than a day" : `${upcoming.days} day${upcoming.days === 1 ? "" : "s"}`} and your 7-day ratio is ${ratio === Infinity ? "infinite (no studying logged)" : `${ratio.toFixed(1)}:1`}. Front-load study time this week.`;
  }

  // 2. Weekday pattern: the worst weekday over the last 4 weeks.
  const last28 = sorted.slice(-28);
  const byWeekday: number[][] = [[], [], [], [], [], [], []];
  for (const log of last28) {
    const r = dailyRatio(log);
    if (r !== null && Number.isFinite(r)) {
      byWeekday[new Date(log.log_date + "T00:00:00").getDay()].push(r);
    }
  }
  let worstDay = -1;
  let worstAvg = 0;
  byWeekday.forEach((vals, day) => {
    if (vals.length >= 3) {
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      if (avg > worstAvg) {
        worstAvg = avg;
        worstDay = day;
      }
    }
  });

  if (worstDay >= 0 && worstAvg >= 2.0) {
    return `Your ${WEEKDAYS[worstDay]}s consistently run the highest game-to-study ratio (avg ${worstAvg.toFixed(1)}:1 over the last 4 weeks). Consider shifting some of that gaming to the weekend.`;
  }

  return null;
}
