"""Train the ML service on synthetic cohort data (demo / bootstrap).

Usage:
  python train_seed.py          # train directly
  python train_seed.py --serve  # also boot the API afterwards
"""
import random

from main import TrainRequest, TrainRow, train_model

random.seed(42)


def synthetic_row(rng: random.Random) -> TrainRow:
    ratio = rng.uniform(0.2, 5.0)
    slope = rng.uniform(-0.3, 0.5)
    days_rising = rng.randint(0, 7)
    study_hours_per_day = rng.uniform(0, 6)
    game_hours_per_day = study_hours_per_day * ratio
    days_since_study = rng.randint(0, 10)

    # Ground truth: high ratio, falling study, hot streaks and study droughts hurt.
    logit = (
        1.2 * (ratio - 1.5)
        - 0.5 * (study_hours_per_day - 2.0)
        + 0.3 * days_rising
        + 0.4 * days_since_study
        + 2.0 * slope
        - 2.5
    )
    p_decline = 1 / (1 + pow(2.718281828, -logit))
    outcome = 1 if rng.random() < p_decline else 0

    return TrainRow(
        features={
            "ratio_7d": ratio,
            "slope": slope,
            "days_rising": days_rising,
            "study_hours_per_day": study_hours_per_day,
            "game_hours_per_day": game_hours_per_day,
            "days_since_study": days_since_study,
        },
        outcome=outcome,
    )


def main() -> None:
    rng = random.Random(7)
    rows = [synthetic_row(rng) for _ in range(250)]
    result = train_model(TrainRequest(rows=rows))
    print("seed training done:", result)


if __name__ == "__main__":
    import sys

    main()
    if "--serve" in sys.argv:
        import uvicorn

        uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)
