import { describe, expect, it } from "vitest";
import { assessRisk, isEscalation, isRecentLog } from "../risk-model";
import type { DailyLog } from "../types";

function log(date: string, game: number, study: number): DailyLog {
  return {
    id: date,
    user_id: "u",
    log_date: date,
    game_hours: game,
    study_hours: study,
    source: "manual",
    notes: null,
  };
}

const NOW = new Date("2026-09-25T12:00:00");
const D = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString().slice(0, 10);

describe("assessRisk", () => {
  it("reports low with a not-enough-data reason before 3 logs", () => {
    const a = assessRisk([log(D(1), 2, 1)], NOW);
    expect(a.level).toBe("low");
    expect(a.reason).toMatch(/Not enough data/i);
  });

  it("flags high when study stopped for 3+ days while gaming continues", () => {
    const logs = [
      log(D(5), 1, 2),
      log(D(4), 1, 2),
      log(D(3), 2, 0),
      log(D(2), 2, 0),
      log(D(1), 2, 0),
    ];
    const a = assessRisk(logs, NOW);
    expect(a.level).toBe("high");
    expect(a.reason).toMatch(/haven't logged any studying/i);
  });

  it("flags high for zero study time across the window", () => {
    const a = assessRisk([log(D(1), 2, 0), log(D(2), 3, 0), log(D(3), 1, 0)], NOW);
    expect(a.level).toBe("high");
    expect(a.reason).toMatch(/zero study time/i);
  });

  it("flags high when the ratio is above 2:1 and rising 5+ days", () => {
    const logs = [0, 1, 2, 3, 4, 5, 6].map((i) =>
      log(D(6 - i), 2 + i * 0.5, 1)
    );
    const a = assessRisk(logs, NOW);
    expect(a.level).toBe("high");
    expect(a.reason).toMatch(/risen \d+ days straight/);
  });

  it("flags moderate when above 2:1 but flat", () => {
    const logs = [0, 1, 2, 3, 4].map((i) => log(D(5 - i), 3, 1));
    const a = assessRisk(logs, NOW);
    expect(a.level).toBe("moderate");
    expect(a.reason).toMatch(/above the 2:1 high-risk line/i);
  });

  it("flags moderate at 1.5:1+ with a rising trend", () => {
    const logs = [1.2, 1.5, 1.8, 2.1].map((ratio, i) => log(D(4 - i), ratio, 1));
    const a = assessRisk(logs, NOW);
    expect(a.level).toBe("moderate");
    expect(a.reason).toMatch(/trending up/i);
  });

  it("stays low for a balanced ratio", () => {
    const logs = [0, 1, 2, 3].map((i) => log(D(4 - i), 1, 1));
    const a = assessRisk(logs, NOW);
    expect(a.level).toBe("low");
    expect(a.reason).toMatch(/balanced/i);
  });

  it("reports low when nothing was logged recently", () => {
    const a = assessRisk([log(D(1), 0, 0), log(D(2), 0, 0), log(D(3), 0, 0)], NOW);
    expect(a.level).toBe("low");
  });
});

describe("isEscalation", () => {
  it("only fires when the level order increases", () => {
    expect(isEscalation("low", "moderate")).toBe(true);
    expect(isEscalation("moderate", "high")).toBe(true);
    expect(isEscalation("high", "moderate")).toBe(false);
    expect(isEscalation("low", "low")).toBe(false);
    expect(isEscalation(null, "low")).toBe(false);
    expect(isEscalation(null, "high")).toBe(true);
  });
});

describe("isRecentLog", () => {
  it("treats logs within 14 days as recent", () => {
    expect(isRecentLog({ log_date: D(5) } as DailyLog, NOW)).toBe(true);
    expect(isRecentLog({ log_date: D(30) } as DailyLog, NOW)).toBe(false);
  });
});
