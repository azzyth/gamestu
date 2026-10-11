import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSteam } from "@/lib/integrations/steam";

const STEAM_ID64 = /^\d{17}$/;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { steam_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const steamId = body.steam_id?.trim() ?? "";
  if (!STEAM_ID64.test(steamId)) {
    return NextResponse.json(
      { error: "Enter your 17-digit SteamID64 (find it via steamid.io)." },
      { status: 400 }
    );
  }

  try {
    const result = await syncSteam(supabase, user.id, steamId);
    return NextResponse.json({ ok: true, synced_hours: result.synced_hours });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Steam sync failed" },
      { status: 502 }
    );
  }
}
