"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Goal } from "@/lib/types";

export default function GoalForm({ current }: { current: Goal | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"ratio" | "study">(current?.target_ratio ? "ratio" : "study");
  const [ratio, setRatio] = useState(current?.target_ratio ? String(current.target_ratio) : "1.0");
  const [studyHours, setStudyHours] = useState(
    current?.target_study_hours ? String(current.target_study_hours) : "2"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const body =
      mode === "ratio"
        ? { target_ratio: Number(ratio), target_study_hours: null }
        : { target_ratio: null, target_study_hours: Number(studyHours) };
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Couldn't save the goal — try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Set a target</p>
      <div className="flex gap-2">
        <button
          onClick={() => setMode("ratio")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "ratio" ? "bg-accent text-white" : "border border-border text-muted"
          }`}
        >
          Target ratio
        </button>
        <button
          onClick={() => setMode("study")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "study" ? "bg-accent text-white" : "border border-border text-muted"
          }`}
        >
          Daily study hours
        </button>
      </div>
      {mode === "ratio" ? (
        <label className="grid gap-1 text-sm">
          Keep your game:study ratio at or below
          <span className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-center outline-none focus:border-accent"
            />
            :1
          </span>
        </label>
      ) : (
        <label className="grid gap-1 text-sm">
          Study at least this many hours per day
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="16"
            value={studyHours}
            onChange={(e) => setStudyHours(e.target.value)}
            className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-center outline-none focus:border-accent"
          />
        </label>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-accent py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save goal"}
      </button>
    </div>
  );
}
