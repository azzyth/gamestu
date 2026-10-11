"""Game to Study Ratio — ML prediction service (Phase 2).

Run: uvicorn main:app --port 8001
Endpoints:
  POST /predict — risk_level + confidence for a set of daily logs (503 until trained)
  POST /train   — train on cohort rows (features + outcome), promote only on AUC improvement
  GET  /health  — registry status
"""
from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from joblib import dump, load
from pydantic import BaseModel
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "model.joblib"
META_PATH = MODEL_DIR / "metadata.json"
FEATURES = [
    "ratio_7d",
    "slope",
    "days_rising",
    "study_hours_per_day",
    "game_hours_per_day",
    "days_since_study",
]

app = FastAPI(title="gamestu ml-service")


class Log(BaseModel):
    log_date: str
    game_hours: float = 0
    study_hours: float = 0


class PredictRequest(BaseModel):
    logs: List[Log]


class TrainRow(BaseModel):
    features: dict
    outcome: int  # 1 = grades declined, 0 = held or improved


class TrainRequest(BaseModel):
    rows: List[TrainRow]


class PredictResponse(BaseModel):
    risk_level: str
    confidence: float
    reason: str


def _features_from_logs(logs: List[Log]) -> Optional[dict]:
    if len(logs) < 3:
        return None
    rows = sorted(logs, key=lambda l: l.log_date)[-7:]
    game = sum(l.game_hours for l in rows)
    study = sum(l.study_hours for l in rows)
    if game + study <= 0:
        return None
    ratio = min((game / study) if study > 0 else 20.0, 20.0)

    ratios: List[float] = []
    for l in rows:
        s, g = l.study_hours, l.game_hours
        if g + s > 0:
            ratios.append(min(g / s, 20.0) if s > 0 else 20.0)

    slope = 0.0
    if len(ratios) >= 2:
        n = len(ratios)
        x_mean = (n - 1) / 2
        y_mean = sum(ratios) / n
        num = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(ratios))
        den = sum((i - x_mean) ** 2 for i in range(n))
        slope = num / den if den else 0.0

    rising = 0
    for i in range(len(ratios) - 1, 0, -1):
        if ratios[i] > ratios[i - 1]:
            rising += 1
        else:
            break

    days_since = 30
    for l in reversed(sorted(logs, key=lambda l: l.log_date)):
        if l.study_hours > 0:
            d = datetime.fromisoformat(l.log_date).date()
            days_since = max(0, (date.today() - d).days)
            break

    return {
        "ratio_7d": ratio,
        "slope": slope,
        "days_rising": float(rising),
        "study_hours_per_day": study / 7,
        "game_hours_per_day": game / 7,
        "days_since_study": float(days_since),
    }


def _load_model():
    if MODEL_PATH.exists():
        return load(MODEL_PATH), json.loads(META_PATH.read_text())
    return None, None


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    feats = _features_from_logs(req.logs)
    if feats is None:
        raise HTTPException(503, "not enough data to featurize")
    model, _ = _load_model()
    if model is None:
        raise HTTPException(503, "no trained model — caller should fall back to rules engine")

    x = np.array([[feats[f] for f in FEATURES]])
    proba = float(model.predict_proba(x)[0][1])
    level = "high" if proba >= 0.66 else "moderate" if proba >= 0.34 else "low"
    confidence = round(max(proba, 1 - proba), 3)
    reason = (
        f"Model estimates a {int(proba * 100)}% chance your current habits hurt your grades "
        f"(7-day ratio {feats['ratio_7d']:.1f}:1, {feats['study_hours_per_day']:.1f}h study/day)."
    )
    return PredictResponse(risk_level=level, confidence=confidence, reason=reason)


def train_model(req: TrainRequest) -> dict:
    if len(req.rows) < 30:
        raise HTTPException(400, f"need at least 30 rows, got {len(req.rows)}")
    X = np.array([[float(r.features.get(f, 0.0)) for f in FEATURES] for r in req.rows])
    y = np.array([r.outcome for r in req.rows])
    if len(set(y.tolist())) < 2:
        raise HTTPException(400, "need both classes (declined and not)")

    if len(y) >= 40:
        X_tr, X_te, y_tr, y_te = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    else:
        X_tr, X_te, y_tr, y_te = X, X, y, y

    if len(y) >= 100:
        model = GradientBoostingClassifier(random_state=42)
    else:
        model = LogisticRegression(max_iter=1000)
    model.fit(X_tr, y_tr)

    metrics = {"n": int(len(y))}
    if len(set(y_te.tolist())) > 1:
        auc = float(roc_auc_score(y_te, model.predict_proba(X_te)[:, 1]))
        metrics["auc"] = round(auc, 3)
    else:
        metrics["auc"] = None

    _, old_meta = _load_model()
    promote = old_meta is None or (metrics["auc"] or 0) >= (old_meta.get("auc") or 0)
    if promote:
        MODEL_DIR.mkdir(exist_ok=True)
        dump(model, MODEL_PATH)
        META_PATH.write_text(
            json.dumps({**metrics, "trained_at": datetime.now(timezone.utc).isoformat()})
        )
    return {"promoted": promote, **metrics}


@app.post("/train")
def train(req: TrainRequest):
    return train_model(req)


@app.get("/health")
def health():
    _, meta = _load_model()
    return {"status": "ok", "model": meta}
