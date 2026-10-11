import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchStudyHoursByDate, refreshAccessToken } from "@/lib/integrations/google";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: integration } = await supabase
    .from("integrations")
    .select("data")
    .eq("user_id", user.id)
    .eq("provider", "google_calendar")
    .maybeSingle();

  const refreshToken = (integration?.data as { refresh_token?: string } | null)?.refresh_token;
  if (!refreshToken) {
    return NextResponse.json({ error: "Google Calendar is not connected" }, { status: 400 });
  }

  try {
    const accessToken = await refreshAccessToken(refreshToken);
    const hoursByDate = await fetchStudyHoursByDate(accessToken, 14);

    let syncedDays = 0;
    for (const [date, hours] of hoursByDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (date > today) continue;
      const { data: existing } = await supabase
        .from("daily_logs")
        .select("game_hours, study_hours, source, notes")
        .eq("user_id", user.id)
        .eq("log_date", date)
        .maybeSingle();
      const calendarHours = Math.round(hours * 10) / 10;
      const existingHours = Number(existing?.study_hours) || 0;
      if (calendarHours > existingHours) {
        await supabase.from("daily_logs").upsert(
          {
            user_id: user.id,
            log_date: date,
            game_hours: Number(existing?.game_hours) || 0,
            study_hours: calendarHours,
            source: existing?.source === "manual" ? "manual" : "google_calendar",
            notes: existing?.notes ?? null,
          },
          { onConflict: "user_id,log_date" }
        );
        syncedDays++;
      }
    }

    await supabase
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("provider", "google_calendar");

    return NextResponse.json({ ok: true, synced_days: syncedDays });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Google sync failed" },
      { status: 502 }
    );
  }
}
