import type { DailyLog } from "./types";

export interface AggregateRatio {
  gameHours: number;
  studyHours: number;
  ratio: number | null; // null = no hours logged; Infinity = gaming with zero study
}

export function sortByDate(logs: DailyLog[]): DailyLog[] {
  return [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
}

export function dailyRatio(log: Pick<DailyLog, "game_hours" | "study_hours">): number | null {
  const game = Number(log.game_hours) || 0;
  const study = Number(log.study_hours) || 0;
  if (game + study <= 0) return null;
  if (study <= 0) return Infinity;
  return game / study;
}

/** Aggregate game:study ratio over the most recent `windowDays` of logs. */
export function rollingRatio(logs: DailyLog[], windowDays = 7): AggregateRatio {
  const sorted = sortByDate(logs);
  const window = sorted.slice(-windowDays);
  const gameHours = window.reduce((sum, l) => sum + (Number(l.game_hours) || 0), 0);
  const studyHours = window.reduce((sum, l) => sum + (Number(l.study_hours) || 0), 0);
  if (gameHours + studyHours <= 0) return { gameHours, studyHours, ratio: null };
  if (studyHours <= 0) return { gameHours, studyHours, ratio: Infinity };
  return { gameHours, studyHours, ratio: gameHours / studyHours };
}

/** OLS slope of the daily-ratio series over the most recent `windowDays` of logs. */
export function ratioSlope(logs: DailyLog[], windowDays = 7): number | null {
  const sorted = sortByDate(logs);
  const points = sorted
    .slice(-windowDays)
    .map((l) => dailyRatio(l))
    .filter((r): r is number => r !== null && Number.isFinite(r));
  if (points.length < 2) return null;
  const n = points.length;
  const xMean = (n - 1) / 2;
  const yMean = points.reduce((s, y) => s + y, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (points[i] - yMean);
    den += (i - xMean) ** 2;
  }
  if (den === 0) return null;
  return num / den;
}

/** Count of consecutive most-recent days where the daily ratio strictly increased vs the prior logged day. */
export function consecutiveDaysRising(logs: DailyLog[]): number {
  const sorted = sortByDate(logs);
  const ratios = sorted
    .map((l) => dailyRatio(l))
    .filter((r): r is number => r !== null && Number.isFinite(r));
  let rising = 0;
  for (let i = ratios.length - 1; i > 0; i--) {
    if (ratios[i] > ratios[i - 1]) rising++;
    else break;
  }
  return rising;
}

/** Days elapsed since the most recent log with study hours, relative to `now`. */
export function daysSinceLastStudy(logs: DailyLog[], now = new Date()): number | null {
  const sorted = sortByDate(logs);
  for (let i = sorted.length - 1; i >= 0; i--) {
    if ((Number(sorted[i].study_hours) || 0) > 0) {
      const last = new Date(sorted[i].log_date + "T00:00:00");
      return Math.max(0, Math.floor((now.getTime() - last.getTime()) / 86_400_000));
    }
  }
  return null;
}

/** Aggregate ratio over logs falling inside [startDate, startDate + 6 days] (ISO dates). */
export function weekRatio(logs: DailyLog[], weekStart: string): AggregateRatio {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start.getTime() + 7 * 86_400_000);
  const inWeek = logs.filter((l) => {
    const d = new Date(l.log_date + "T00:00:00");
    return d >= start && d < end;
  });
  return rollingRatio(inWeek, inWeek.length || 1);
}

export function formatRatio(ratio: number | null): string {
  if (ratio === null) return "n/a";
  if (!Number.isFinite(ratio)) return "∞:1";
  return `${ratio.toFixed(1)}:1`;
}
