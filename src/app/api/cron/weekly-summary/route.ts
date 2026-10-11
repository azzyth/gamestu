import { NextResponse } from "next/server";
import { createServiceClient, serviceClientConfigured } from "@/lib/supabase/service";
import {
  computeWeeklySummary,
  storeWeeklySummary,
  summaryEmailHtml,
  shiftDays,
  weekStartDate,
} from "@/lib/weekly-summary";
import { sendEmail } from "@/lib/notifications";
import type { DailyLog, WeeklySummary } from "@/lib/types";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Weekly summary job: compute the recap for the last completed week for every
 * profile, store it, and email users who opted in. Run Sundays.
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!serviceClientConfigured()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 501 });
  }

  const supabase = createServiceClient();
  const lastWeek = shiftDays(weekStartDate(), -7);
  const since = shiftDays(lastWeek, -14);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, weekly_summary_email");
  if (!profiles) return NextResponse.json({ error: "Could not list profiles" }, { status: 500 });

  const { data: emails } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map((emails?.users ?? []).map((u) => [u.id, u.email]));

  let summaries = 0;
  let emailsSent = 0;

  for (const profile of profiles) {
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("log_date, game_hours, study_hours")
      .eq("user_id", profile.id)
      .gte("log_date", since);
    const summary: WeeklySummary | null = computeWeeklySummary(
      (logs ?? []) as unknown as DailyLog[],
      lastWeek
    );
    if (!summary) continue;
    await storeWeeklySummary(supabase, profile.id, summary);
    summaries++;

    const email = emailById.get(profile.id);
    if (profile.weekly_summary_email && email) {
      const sent = await sendEmail(
        email,
        "Your weekly game-to-study recap",
        summaryEmailHtml(summary)
      );
      if (sent) emailsSent++;
    }
  }

  return NextResponse.json({ ok: true, week: lastWeek, summaries, emails_sent: emailsSent });
}
