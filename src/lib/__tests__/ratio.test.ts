import { describe, expect, it } from "vitest";
import {
  consecutiveDaysRising,
  dailyRatio,
  daysSinceLastStudy,
  formatRatio,
  rollingRatio,
  sortByDate,
  weekRatio,
} from "../ratio";
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

describe("dailyRatio", () => {
  it("computes game:study ratio", () => {
    expect(dailyRatio({ game_hours: 2, study_hours: 1 })).toBe(2);
  });

  it("returns null when nothing logged", () => {
    expect(dailyRatio({ game_hours: 0, study_hours: 0 })).toBeNull();
  });

  it("returns Infinity for gaming with zero study", () => {
    expect(dailyRatio({ game_hours: 3, study_hours: 0 })).toBe(Infinity);
  });
});

describe("rollingRatio", () => {
  it("aggregates over the most recent 7 entries", () => {
    const logs = [
      log("2025-12-31", 10, 10), // 8th entry — outside the window
      log("2026-01-01", 2, 2),
      log("2026-01-02", 2, 2),
      log("2026-01-03", 2, 2),
      log("2026-01-04", 3, 1),
      log("2026-01-05", 1, 1),
      log("2026-01-06", 2, 2),
      log("2026-01-07", 2, 2),
    ];
    const result = rollingRatio(logs);
    expect(result.gameHours).toBe(14);
    expect(result.studyHours).toBe(12);
    expect(result.ratio).toBeCloseTo(14 / 12, 5);
  });

  it("is Infinity when no study happened in the window", () => {
    const logs = [log("2026-01-01", 4, 0), log("2026-01-02", 4, 0), log("2026-01-03", 4, 0)];
    expect(rollingRatio(logs).ratio).toBe(Infinity);
  });
});

describe("consecutiveDaysRising", () => {
  it("counts the trailing streak of increases", () => {
    const logs = [
      log("2026-01-01", 1, 2),
      log("2026-01-02", 2, 2),
      log("2026-01-03", 3, 2),
      log("2026-01-04", 4, 2),
    ];
    expect(consecutiveDaysRising(logs)).toBe(3);
  });

  it("stops at a drop", () => {
    const logs = [
      log("2026-01-01", 3, 2),
      log("2026-01-02", 1, 2),
      log("2026-01-03", 2, 2),
    ];
    expect(consecutiveDaysRising(logs)).toBe(1);
  });
});

describe("daysSinceLastStudy", () => {
  it("measures from the most recent study day", () => {
    const logs = [log("2026-01-01", 2, 2), log("2026-01-03", 2, 0)];
    const now = new Date("2026-01-06T00:00:00");
    expect(daysSinceLastStudy(logs, now)).toBe(5);
  });

  it("returns null when study never happened", () => {
    const logs = [log("2026-01-01", 2, 0)];
    expect(daysSinceLastStudy(logs, new Date("2026-01-02T00:00:00"))).toBeNull();
  });
});

describe("weekRatio", () => {
  it("aggregates only the 7-day window starting at weekStart", () => {
    const logs = [
      log("2025-12-31", 10, 10), // outside the week
      log("2026-01-01", 2, 1),
      log("2026-01-05", 2, 1),
      log("2026-01-09", 10, 10), // outside the week
    ];
    const week = weekRatio(logs, "2026-01-01");
    expect(week.gameHours).toBe(4);
    expect(week.studyHours).toBe(2);
    expect(week.ratio).toBe(2);
  });
});

describe("formatRatio", () => {
  it("formats finite ratios, infinities and nulls", () => {
    expect(formatRatio(2.44)).toBe("2.4:1");
    expect(formatRatio(Infinity)).toBe("∞:1");
    expect(formatRatio(null)).toBe("n/a");
  });
});

describe("sortByDate", () => {
  it("sorts ascending by date", () => {
    const logs = [log("2026-01-03", 1, 1), log("2026-01-01", 1, 1)];
    expect(sortByDate(logs).map((l) => l.log_date)).toEqual(["2026-01-01", "2026-01-03"]);
  });
});
