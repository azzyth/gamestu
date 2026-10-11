import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyLog, RiskAssessment } from "./types";
import { predictRisk } from "./predict";
import { isEscalation } from "./risk-model";
import { sendPushToUser } from "./notifications";

/**
 * The core alert loop: run after any log write.
 * 1. Predict risk (ML with rules fallback).
 * 2. Snapshot today's assessment.
 * 3. If risk escalated vs the last different-day snapshot, record + push one alert.
 */
export async function runRiskPipeline(
  supabase: SupabaseClient,
  userId: string,
  logs: DailyLog[]
): Promise<RiskAssessment> {
  const assessment = await predictRisk(logs);
  const today = new Date().toISOString().slice(0, 10);

  const { data: last } = await supabase
    .from("risk_snapshots")
    .select("risk_level, snapshot_date")
    .eq("user_id", userId)
    .lt("snapshot_date", today)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("risk_snapshots").upsert(
    {
      user_id: userId,
      snapshot_date: today,
      risk_level: assessment.level,
      ratio: assessment.ratio !== null && Number.isFinite(assessment.ratio) ? assessment.ratio : null,
      trend_slope: assessment.slope,
    },
    { onConflict: "user_id,snapshot_date" }
  );

  if (isEscalation(last?.risk_level ?? null, assessment.level)) {
    const message = assessment.reason;
    await supabase
      .from("alerts")
      .insert({ user_id: userId, type: "risk_escalation", message });
    await sendPushToUser(supabase, userId, {
      title: "Game to Study Ratio",
      body: message,
    });
  }

  return assessment;
}
