import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/integrations/google";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  if (error || !code) {
    return NextResponse.redirect(`${origin}/settings?error=google`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  try {
    const tokens = await exchangeCodeForTokens(code, `${origin}/api/integrations/google/callback`);
    await supabase.from("integrations").upsert(
      {
        user_id: user.id,
        provider: "google_calendar",
        data: { refresh_token: tokens.refresh_token },
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );
    return NextResponse.redirect(`${origin}/settings?connected=google`);
  } catch {
    return NextResponse.redirect(`${origin}/settings?error=google`);
  }
}
