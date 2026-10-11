import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { googleAuthUrl } from "@/lib/integrations/google";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const origin = new URL(request.url).origin;
  try {
    return NextResponse.redirect(googleAuthUrl(`${origin}/api/integrations/google/callback`));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Google not configured" },
      { status: 500 }
    );
  }
}
