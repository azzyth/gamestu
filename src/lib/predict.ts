import type { DailyLog, RiskAssessment, RiskLevel } from "./types";
import { assessRisk } from "./risk-model";

export const MIN_ML_CONFIDENCE = 0.55;
const ML_TIMEOUT_MS = 3000;

interface MlPredictResponse {
  risk_level: RiskLevel;
  confidence: number;
  reason?: string;
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return value === "low" || value === "moderate" || value === "high";
}

/**
 * Predict risk with the Phase 2 ML service when available, falling back to the
 * Phase 1 rules engine on error, timeout, or low-confidence output.
 */
export async function predictRisk(logs: DailyLog[]): Promise<RiskAssessment> {
  const fallback = assessRisk(logs);
  const mlUrl = process.env.ML_SERVICE_URL;
  if (!mlUrl) return fallback;

  try {
    const res = await fetch(`${mlUrl.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ logs: logs.slice(-28) }),
      signal: AbortSignal.timeout(ML_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as Partial<MlPredictResponse>;
    if (!isRiskLevel(data.risk_level) || typeof data.confidence !== "number") return fallback;

    if (data.confidence >= MIN_ML_CONFIDENCE) {
      return {
        ...fallback,
        level: data.risk_level,
        confidence: data.confidence,
        reason: data.reason ?? fallback.reason,
        source: "ml",
      };
    }
    // Low-confidence ML output renders as a trend watch, not a hard risk level.
    return {
      ...fallback,
      reason: `Trend watch: ${fallback.reason}`,
    };
  } catch {
    return fallback;
  }
}
