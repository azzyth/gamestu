export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  game_hours: number;
  study_hours: number;
  source: "manual" | "google_calendar" | "steam";
  notes: string | null;
}

export type RiskLevel = "low" | "moderate" | "high";

export interface RiskAssessment {
  level: RiskLevel;
  ratio: number | null;
  slope: number | null;
  daysRising: number;
  daysSinceStudy: number | null;
  reason: string;
  source: "rules" | "ml";
  confidence: number;
}

export interface WeeklySummary {
  week_start: string;
  avg_ratio: number | null;
  prev_avg_ratio: number | null;
  game_hours: number;
  study_hours: number;
  summary: string;
}

export interface Goal {
  id: string;
  target_ratio: number | null;
  target_study_hours: number | null;
  active_from: string;
}

export interface Exam {
  id: string;
  subject: string;
  exam_date: string;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  created_at: string;
  acknowledged_at: string | null;
}
