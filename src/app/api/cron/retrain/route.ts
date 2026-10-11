import { NextResponse } from "next/server";
import { createServiceClient, serviceClientConfigured } from "@/lib/supabase/service";
import { sortByDate, rollingRatio, ratioSlope, consecutiveDaysRising } from "@/lib/ratio";
import type { DailyLog } from "@/lib/types";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

interface TrainingRow {
  features: {
    ratio_7d: number;
    slope: number;
    days_rising: number;
    study_hours_per_day: number;
    game_hours_per_day: number;
    days_since_study: number;
  };
  outcome: number;
}

/**
 * Retraining job: build one training row per user from their 28-day log
 * features and self-reported grade outcomes (declined = 1), then POST them to
 * the ML service's /train endpoint. The service only promotes a model when its
 * held-out AUC beats the current registry. Run weekly.
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!serviceClientConfigured()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 501 });
  }

  const mlUrl = process.env.ML_SERVICE_URL;
  if (!mlUrl) {
    return NextResponse.json({ error: "ML_SERVICE_URL not configured" }, { status: 501 });
  }

  const supabase = createServiceClient();
  const since = new Date(Date.now() - 28 * 86_400_000).toISOString().slice(0, 10);

  const { data: outcomes } = await supabase
    .from("grade_outcomes")
    .select("user_id, grade_trend");
  if (!outcomes || outcomes.length === 0) {
    return NextResponse.json({ ok: true, rows: 0, note: "No outcome data yet." });
  }

  const rows: TrainingRow[] = [];
  for (const outcome of outcomes) {
    const userId = outcome.user_id as string;
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("log_date, game_hours, study_hours")
      .eq("user_id", userId)
      .gte("log_date", since);
    const dailyLogs = (logs ?? []) as unknown as DailyLog[];
    if (dailyLogs.length < 7) continue;

    const sorted = sortByDate(dailyLogs);
    const last7 = sorted.slice(-7);
    const game = last7.reduce((s, l) => s + (Number(l.game_hours) || 0), 0);
    const study = last7.reduce((s, l) => s + (Number(l.study_hours) || 0), 0);
    const { ratio } = rollingRatio(sorted);
    let daysSinceStudy = 30;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if ((Number(sorted[i].study_hours) || 0) > 0) {
        daysSinceStudy = Math.floor(
          (Date.now() - new Date(sorted[i].log_date + "T00:00:00").getTime()) / 86_400_000
        );
        break;
      }
    }

    rows.push({
      features: {
        ratio_7d: ratio !== null && Number.isFinite(ratio) ? Math.min(ratio, 20) : 20,
        slope: ratioSlope(sorted) ?? 0,
        days_rising: consecutiveDaysRising(sorted),
        study_hours_per_day: study / 7,
        game_hours_per_day: game / 7,
        days_since_study: daysSinceStudy,
      },
      outcome: outcome.grade_trend === "declined" ? 1 : 0,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, rows: 0, note: "Not enough logs paired with outcomes." });
  }

  try {
    const res = await fetch(`${mlUrl.replace(/\/$/, "")}/train`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rows }),
      signal: AbortSignal.timeout(60_000),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.detail ?? "Training rejected", rows: rows.length }, { status: 502 });
    }
    return NextResponse.json({ ok: true, rows: rows.length, ml: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ML service unreachable" },
      { status: 502 }
    );
  }
}
