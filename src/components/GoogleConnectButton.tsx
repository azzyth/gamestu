"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GoogleConnectButton({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setSyncing(true);
    setMessage(null);
    const res = await fetch("/api/integrations/google/sync", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSyncing(false);
    if (!res.ok) {
      setMessage(data.error || "Sync failed.");
      return;
    }
    setMessage(data.synced_days > 0 ? `Imported study hours for ${data.synced_days} day(s).` : "No new study events found.");
    router.refresh();
  }

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">Google Calendar (auto study hours)</p>
        <p className="mt-1 text-xs text-muted">
          Read-only. Events whose title or description looks like study, class, lecture,
          homework, revision or reading count toward your study hours.
        </p>
      </div>
      {connected ? (
        <div className="flex items-center gap-3">
          <button
            onClick={sync}
            disabled={syncing}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
          <span className="text-xs text-success">Connected</span>
        </div>
      ) : (
        <a
          href="/api/integrations/google"
          className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Connect Google Calendar
        </a>
      )}
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
