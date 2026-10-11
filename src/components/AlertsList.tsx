"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Alert } from "@/lib/types";

export default function AlertsList({ alerts }: { alerts: Alert[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function dismiss(id: string) {
    setBusy(id);
    const supabase = createClient();
    await supabase
      .from("alerts")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", id);
    setBusy(null);
    router.refresh();
  }

  if (alerts.length === 0) return null;

  return (
    <div className="grid gap-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 p-3"
        >
          <div>
            <p className="text-sm">{alert.message}</p>
            <p className="mt-1 text-xs text-muted">
              {new Date(alert.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => dismiss(alert.id)}
            disabled={busy === alert.id}
            className="shrink-0 rounded-lg border border-border px-3 py-1 text-xs font-medium transition hover:bg-card disabled:opacity-50"
          >
            {busy === alert.id ? "…" : "Dismiss"}
          </button>
        </div>
      ))}
    </div>
  );
}
