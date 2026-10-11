"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SteamForm({ connectedSteamId }: { connectedSteamId: string | null }) {
  const router = useRouter();
  const [steamId, setSteamId] = useState(connectedSteamId ?? "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setSaving(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/integrations/steam", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ steam_id: steamId.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Couldn't connect Steam.");
      return;
    }
    setResult(
      data.synced_hours
        ? `Connected. Imported ${data.synced_hours}h of playtime logged today. Daily sync runs automatically.`
        : "Connected. Your playtime baseline is stored — tomorrow's sync starts importing hours."
    );
    router.refresh();
  }

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">Steam (auto game hours)</p>
        <p className="mt-1 text-xs text-muted">
          Enter your 17-digit SteamID64. Playtime deltas are imported daily into your logs
          (auto entries never overwrite larger manual ones).
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          placeholder="76561198…"
          className="flex-1 min-w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={connect}
          disabled={saving || steamId.trim().length < 8}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Connecting…" : connectedSteamId ? "Re-sync" : "Connect"}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {result && <p className="text-sm text-success">{result}</p>}
    </div>
  );
}
