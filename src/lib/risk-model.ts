import type { DailyLog, RiskAssessment, RiskLevel } from "./types";
import {
  consecutiveDaysRising,
  daysSinceLastStudy,
  formatRatio,
  ratioSlope,
  rollingRatio,
  sortByDate,
} from "./ratio";

export const HIGH_RISK_RATIO = 2.0;
export const MODERATE_RISK_RATIO = 1.5;
export const MIN_DAYS_RISING = 5;
export const MIN_LOGS_FOR_ASSESSMENT = 3;
export const NO_STUDY_DAYS_FOR_HIGH = 3;

const LEVEL_ORDER: Record<RiskLevel, number> = { low: 0, moderate: 1, high: 2 };

export function isEscalation(prev: RiskLevel | null | undefined, next: RiskLevel): boolean {
  if (!prev) return next === "high";
  return LEVEL_ORDER[next] > LEVEL_ORDER[prev];
}

export function isRecentLog(log: DailyLog, now: Date, withinDays = 14): boolean {
  const d = new Date(log.log_date + "T00:00:00");
  return now.getTime() - d.getTime() < withinDays * 86_400_000;
}

/**
 * Rules-based risk engine. Phase 1 baseline: transparent thresholds on the
 * 7-day rolling ratio, its trend slope, and days since the last study log.
 */
export function assessRisk(logs: DailyLog[], now = new Date()): RiskAssessment {
  const sorted = sortByDate(logs);
  const base: RiskAssessment = {
    level: "low",
    ratio: null,
    slope: null,
    daysRising: 0,
    daysSinceStudy: null,
    reason: "",
    source: "rules",
    confidence: 0.3,
  };

  if (sorted.length < MIN_LOGS_FOR_ASSESSMENT) {
    return {
      ...base,
      reason: "Not enough data yet — keep logging to unlock a risk signal.",
    };
  }

  const { ratio, gameHours } = rollingRatio(sorted);
  const slope = ratioSlope(sorted);
  const daysRising = consecutiveDaysRising(sorted);
  const sinceStudy = daysSinceLastStudy(sorted, now);
  const recentCount = sorted.filter((l) => isRecentLog(l, now)).length;
  const confidence = Math.min(0.9, 0.4 + recentCount * 0.05);

  const assessment: RiskAssessment = {
    ...base,
    ratio,
    slope,
    daysRising,
    daysSinceStudy: sinceStudy,
    confidence,
  };

  if (ratio === null) {
    return { ...assessment, reason: "No hours logged recently — nothing to assess yet." };
  }

  if (sinceStudy !== null && sinceStudy >= NO_STUDY_DAYS_FOR_HIGH && gameHours > 0) {
    return {
      ...assessment,
      level: "high",
      reason: `You haven't logged any studying in ${sinceStudy} days while still gaming.`,
    };
  }

  if (!Number.isFinite(ratio)) {
    return {
      ...assessment,
      level: "high",
      reason: "Zero study time logged in the last 7 days while gaming continues.",
    };
  }

  if (ratio >= HIGH_RISK_RATIO && daysRising >= MIN_DAYS_RISING) {
    return {
      ...assessment,
      level: "high",
      reason: `Your ratio is ${formatRatio(ratio)} and has risen ${daysRising} days straight.`,
    };
  }

  if (ratio >= HIGH_RISK_RATIO) {
    return {
      ...assessment,
      level: "moderate",
      reason: `Your ratio is ${formatRatio(ratio)}, above the ${HIGH_RISK_RATIO}:1 high-risk line, but not climbing.`,
    };
  }

  if (ratio >= MODERATE_RISK_RATIO && (slope ?? 0) > 0 && daysRising >= 3) {
    return {
      ...assessment,
      level: "moderate",
      reason: `Your ratio is ${formatRatio(ratio)} and trending up ${daysRising} days in a row.`,
    };
  }

  return {
    ...assessment,
    reason: `Your ratio is ${formatRatio(ratio)} — that looks balanced.`,
  };
}
