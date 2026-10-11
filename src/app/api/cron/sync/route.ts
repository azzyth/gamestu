import { NextResponse } from "next/server";
import { createServiceClient, serviceClientConfigured } from "@/lib/supabase/service";
import { syncSteam } from "@/lib/integrations/steam";
import { fetchStudyHoursByDate, refreshAccessToken } from "@/lib/integrations/google";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Daily integration sync: Steam playtime deltas and Google Calendar study
 * events for every user with a stored integration. Run daily.
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!serviceClientConfigured()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 501 });
  }

  const supabase = createServiceClient();
  const { data: integrations } = await supabase
    .from("integrations")
    .select("user_id, provider, data");
  if (!integrations) return NextResponse.json({ error: "Could not list integrations" }, { status: 500 });

  const results: Record<string, { ok: number; failed: number; errors: string[] }> = {
    steam: { ok: 0, failed: 0, errors: [] },
    google_calendar: { ok: 0, failed: 0, errors: [] },
  };

  for (const integration of integrations) {
    const userId = integration.user_id as string;
    const data = integration.data as Record<string, unknown>;
    try {
      if (integration.provider === "steam") {
        if (typeof data.steamId === "string") {
          await syncSteam(supabase, userId, data.steamId);
          results.steam.ok++;
        }
      } else if (integration.provider === "google_calendar") {
        const refreshToken = data.refresh_token;
        if (typeof refreshToken === "string") {
          const accessToken = await refreshAccessToken(refreshToken);
          const hoursByDate = await fetchStudyHoursByDate(accessToken, 14);
          const today = new Date().toISOString().slice(0, 10);
          for (const [date, hours] of hoursByDate) {
            if (date > today) continue;
            const { data: existing } = await supabase
              .from("daily_logs")
              .select("game_hours, study_hours, source, notes")
              .eq("user_id", userId)
              .eq("log_date", date)
              .maybeSingle();
            const calendarHours = Math.round(hours * 10) / 10;
            const existingHours = Number(existing?.study_hours) || 0;
            if (calendarHours > existingHours) {
              await supabase.from("daily_logs").upsert(
                {
                  user_id: userId,
                  log_date: date,
                  game_hours: Number(existing?.game_hours) || 0,
                  study_hours: calendarHours,
                  source: existing?.source === "manual" ? "manual" : "google_calendar",
                  notes: existing?.notes ?? null,
                },
                { onConflict: "user_id,log_date" }
              );
            }
          }
          await supabase
            .from("integrations")
            .update({ last_synced_at: new Date().toISOString() })
            .eq("user_id", userId)
            .eq("provider", "google_calendar");
          results.google_calendar.ok++;
        }
      }
    } catch (err) {
      const bucket = results[integration.provider as "steam" | "google_calendar"];
      bucket.failed++;
      bucket.errors.push(err instanceof Error ? err.message : "unknown error");
    }
  }

  return NextResponse.json({ ok: true, results });
}
