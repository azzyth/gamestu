import type { SupabaseClient } from "@supabase/supabase-js";

const STEAM_API = "https://api.steampowered.com";

interface OwnedGamesResponse {
  response?: { games?: { playtime_forever?: number }[] };
}

/** Total lifetime playtime in minutes across all owned games. */
export async function fetchTotalPlaytime(steamId: string): Promise<number> {
  const key = process.env.STEAM_API_KEY;
  if (!key) throw new Error("STEAM_API_KEY is not configured");
  const res = await fetch(
    `${STEAM_API}/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_played_free_games=1&format=json`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Steam API error ${res.status} — check the Steam ID and API key`);
  const data = (await res.json()) as OwnedGamesResponse;
  return (data.response?.games ?? []).reduce((sum, g) => sum + (g.playtime_forever || 0), 0);
}

export interface SteamSyncResult {
  synced_hours: number;
}

/**
 * Sync Steam playtime: diff the user's lifetime total against the stored
 * snapshot and attribute the delta to today's log (merged, never overwriting
 * larger manual entries). Stores a new snapshot afterwards.
 */
export async function syncSteam(
  supabase: SupabaseClient,
  userId: string,
  steamId: string
): Promise<SteamSyncResult> {
  const totalMinutes = await fetchTotalPlaytime(steamId);

  const { data: integration } = await supabase
    .from("integrations")
    .select("data")
    .eq("user_id", userId)
    .eq("provider", "steam")
    .maybeSingle();

  const prevTotal = (integration?.data as { totalMinutes?: number } | null)?.totalMinutes;
  const today = new Date().toISOString().slice(0, 10);
  let syncedHours = 0;

  if (typeof prevTotal === "number") {
    const deltaMinutes = totalMinutes - prevTotal;
    if (deltaMinutes > 0) {
      syncedHours = Math.round((deltaMinutes / 60) * 10) / 10;
      const { data: existing } = await supabase
        .from("daily_logs")
        .select("game_hours, study_hours, source, notes")
        .eq("user_id", userId)
        .eq("log_date", today)
        .maybeSingle();
      await supabase.from("daily_logs").upsert(
        {
          user_id: userId,
          log_date: today,
          game_hours: Math.max(Number(existing?.game_hours) || 0, syncedHours),
          study_hours: Number(existing?.study_hours) || 0,
          source: existing?.source === "manual" ? "manual" : "steam",
          notes: existing?.notes ?? null,
        },
        { onConflict: "user_id,log_date" }
      );
    }
  }

  await supabase.from("integrations").upsert(
    {
      user_id: userId,
      provider: "steam",
      data: { steamId, totalMinutes },
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return { synced_hours: syncedHours };
}
