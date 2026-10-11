"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyLog } from "@/lib/types";

const QUEUE_KEY = "gamestu_offline_queue";

interface Entry {
  log_date: string;
  game_hours: number;
  study_hours: number;
  notes?: string | null;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function readQueue(): Entry[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as Entry[];
  } catch {
    return [];
  }
}

function writeQueue(entries: Entry[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(entries));
}

/**
 * Quick entry for the last 7 days. Failed saves are queued in localStorage and
 * flushed when the browser comes back online.
 */
export default function LogForm({ existingLogs }: { existingLogs: DailyLog[] }) {
  const router = useRouter();
  const days = Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i));

  const initial = new Map<string, Entry>(
    days.map((date) => {
      const log = existingLogs.find((l) => l.log_date === date);
      return [
        date,
        {
          log_date: date,
          game_hours: Number(log?.game_hours) || 0,
          study_hours: Number(log?.study_hours) || 0,
          notes: log?.notes ?? "",
        },
      ];
    })
  );

  const [values, setValues] = useState<Map<string, Entry>>(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const flushQueue = useCallback(async () => {
    const queued = readQueue();
    if (queued.length === 0) return;
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entries: queued }),
      });
      if (res.ok) {
        writeQueue([]);
        setStatus(`Synced ${queued.length} offline entr${queued.length === 1 ? "y" : "ies"}.`);
        router.refresh();
      }
    } catch {
      // Still offline; keep the queue.
    }
  }, [router]);

  useEffect(() => {
    flushQueue();
    const onOnline = () => flushQueue();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushQueue]);

  function update(date: string, field: "game_hours" | "study_hours", value: string) {
    const num = value === "" ? 0 : Math.min(24, Math.max(0, Number(value)));
    setValues((prev) => {
      const next = new Map(prev);
      const entry = next.get(date)!;
      next.set(date, { ...entry, [field]: Number.isNaN(num) ? 0 : num });
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    const entries = [...values.values()].filter(
      (e) => e.game_hours > 0 || e.study_hours > 0 || (e.notes ?? "").trim() !== ""
    );
    if (entries.length === 0) {
      setStatus("Nothing to save — enter some hours first.");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      writeQueue(readQueue().filter((q) => !entries.some((e) => e.log_date === q.log_date)));
      setStatus(`Saved ${entries.length} day${entries.length === 1 ? "" : "s"}.`);
      router.refresh();
    } catch {
      const merged = [...readQueue().filter((q) => !entries.some((e) => e.log_date === q.log_date)), ...entries];
      writeQueue(merged);
      setStatus("You seem to be offline — saved locally, will sync automatically.");
    }
    setSaving(false);
  }

  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[1fr_80px_80px] gap-2 border-b border-border px-4 py-2 text-xs font-semibold text-muted">
          <span>Day</span>
          <span className="text-center">Game h</span>
          <span className="text-center">Study h</span>
        </div>
        {days.map((date, idx) => {
          const v = values.get(date)!;
          const isToday = idx === days.length - 1;
          return (
            <div
              key={date}
              className={`grid grid-cols-[1fr_80px_80px] items-center gap-2 px-4 py-2 ${
                idx > 0 ? "border-t border-border" : ""
              } ${isToday ? "bg-accent/5" : ""}`}
            >
              <span className="text-sm">
                {isToday ? "Today" : new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                max="24"
                value={v.game_hours || ""}
                onChange={(e) => update(date, "game_hours", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm outline-none focus:border-accent"
              />
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                max="24"
                value={v.study_hours || ""}
                onChange={(e) => update(date, "study_hours", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm outline-none focus:border-accent"
              />
            </div>
          );
        })}
      </div>

      {status && <p className="text-sm text-muted">{status}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="rounded-xl bg-accent py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save days"}
      </button>
    </div>
  );
}
