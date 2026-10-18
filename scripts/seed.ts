/**
 * Closed-beta seed: creates a demo account with 28 days of logs, including a
 * final week where the ratio rises steadily past the high-risk line — so the
 * escalation alert path can be verified end to end.
 *
 * Usage: npm run seed
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (tsx doesn't auto-load it)
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
const DEMO_EMAIL = "demo@gamestu.app";
const DEMO_PASSWORD = "Demo1234!";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

async function getDemoUserId(): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (!error && data.user) {
    return data.user.id;
  }
  // Already exists — look it up.
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = (list?.users ?? []).find((u) => u.email === DEMO_EMAIL);
  if (!existing) throw new Error("Could not create or find the demo user");
  return existing.id;
}

async function main() {
  const userId = await getDemoUserId();
  console.log(`Demo user ready (${DEMO_EMAIL}) — id ${userId}`);

  // Clear old demo logs, then insert a fresh 28-day history.
  await supabase.from("daily_logs").delete().eq("user_id", userId);

  const rows: {
    user_id: string;
    log_date: string;
    game_hours: number;
    study_hours: number;
    source: "manual";
  }[] = [];

  // Days 27..7: a healthy, slightly noisy 1:2 pattern.
  for (let i = 27; i >= 7; i--) {
    rows.push({
      user_id: userId,
      log_date: isoDaysAgo(i),
      game_hours: 1 + (i % 3 === 0 ? 0.5 : 0),
      study_hours: 2 + (i % 2 === 0 ? 0.5 : 0),
      source: "manual",
    });
  }

  // Days 6..0: ratio climbs steadily 1.5:1 -> 4:1, crossing the high-risk line
  // and rising 5+ consecutive days.
  const climb = [1.5, 1.8, 2.1, 2.5, 3.0, 3.5, 4.0];
  climb.forEach((ratio, i) => {
    rows.push({
      user_id: userId,
      log_date: isoDaysAgo(6 - i),
      game_hours: ratio,
      study_hours: 1,
      source: "manual",
    });
  });

  const { error } = await supabase.from("daily_logs").insert(rows);
  if (error) throw error;

  const last = rows[rows.length - 1];
  console.log(`Inserted ${rows.length} daily logs.`);
  console.log(
    `Final day: ${last.log_date} — ${last.game_hours}h game vs ${last.study_hours}h study (${last.game_hours}:1).`
  );
  console.log("\nLog in as:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log("\nNext: log one more day on the Log tab to trigger the risk pipeline —");
  console.log("it should escalate to HIGH and fire the escalation alert.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
