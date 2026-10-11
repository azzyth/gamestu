import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { viewer_email?: string | null };
  let viewerEmail: string | null = null;
  try {
    body = await request.json();
    viewerEmail = body.viewer_email?.trim().slice(0, 200) || null;
  } catch {
    viewerEmail = null;
  }

  const { data, error } = await supabase
    .from("shared_views")
    .insert({
      user_id: user.id,
      viewer_email: viewerEmail,
      token: randomUUID().replace(/-/g, ""),
    })
    .select("id, token")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id, token: data.token });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase
    .from("shared_views")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("user_id", user.id)
    .is("revoked_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
