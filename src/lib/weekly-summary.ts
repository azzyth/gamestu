import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyLog, WeeklySummary } from "./types";
import { formatRatio, weekRatio } from "./ratio";

/** ISO date of the Monday starting the week containing `d` (UTC). */
export function weekStartDate(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

export function shiftDays(iso: string, days: number): string {
  return new Date(new Date(iso + "T00:00:00Z").getTime() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function buildSummaryText(ratio: number | null, prevRatio: number | null): string {
  const r = formatRatio(ratio);
  if (ratio === null) return "You didn't log any hours this week — nothing to compute yet.";
  if (prevRatio === null) return `You averaged a ${r} game-to-study ratio this week. First full week of data — keep logging.`;
  const p = formatRatio(prevRatio);
  if (ratio > prevRatio * 1.1) return `You averaged a ${r} game-to-study ratio this week, trending up from ${p} last week.`;
  if (ratio < prevRatio * 0.9) return `You averaged a ${r} game-to-study ratio this week, trending down from ${p} last week. Nice work.`;
  return `You averaged a ${r} game-to-study ratio this week, in line with ${p} last week.`;
}

/** Compute the plain-language weekly recap for the week starting `weekStart` (a Monday). */
export function computeWeeklySummary(
  logs: DailyLog[],
  weekStart: string
): WeeklySummary | null {
  const week = weekRatio(logs, weekStart);
  const prev = weekRatio(logs, shiftDays(weekStart, -7));
  if (week.gameHours + week.studyHours <= 0 && prev.gameHours + prev.studyHours <= 0) {
    return null;
  }
  const ratio = week.studyHours > 0 ? week.gameHours / week.studyHours
    : week.gameHours > 0 ? Infinity : null;
  const prevRatio = prev.studyHours > 0 ? prev.gameHours / prev.studyHours
    : prev.gameHours > 0 ? Infinity : null;
  return {
    week_start: weekStart,
    avg_ratio: ratio !== null && Number.isFinite(ratio) ? Math.round(ratio * 100) / 100 : null,
    prev_avg_ratio: prevRatio !== null && Number.isFinite(prevRatio) ? Math.round(prevRatio * 100) / 100 : null,
    game_hours: Math.round(week.gameHours * 10) / 10,
    study_hours: Math.round(week.studyHours * 10) / 10,
    summary: buildSummaryText(ratio, prevRatio),
  };
}

/** Upsert a weekly summary row for one user. Used by the cron and dashboard. */
export async function storeWeeklySummary(
  supabase: SupabaseClient,
  userId: string,
  summary: WeeklySummary
): Promise<void> {
  await supabase.from("weekly_summaries").upsert(
    { user_id: userId, ...summary },
    { onConflict: "user_id,week_start" }
  );
}

/** Render the recap card email body. */
export function summaryEmailHtml(summary: WeeklySummary): string {
  return `<div style="font-family:sans-serif;max-width:480px">
    <h2>Your week in balance</h2>
    <p style="font-size:16px">${summary.summary}</p>
    <p style="color:#555">Game hours: ${summary.game_hours} &middot; Study hours: ${summary.study_hours}</p>
    <p style="color:#999;font-size:12px">You can turn these emails off in Settings.</p>
  </div>`;
}
