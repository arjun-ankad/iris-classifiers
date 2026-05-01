"""This python script trains Iris classifiers i.e. logistic regression and random forest and exports metrics + confusion matrices to JSON"""

import argparse
import json
from pathlib import Path

import numpy as np
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split


def main() -> None:
    parser = argparse.ArgumentParser(description="Train Iris classifiers and export metrics to JSON.")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("data/iris_results.json"),
        help="Output JSON path (default: data/iris_results.json)",
    )
    args = parser.parse_args()

    bunch = load_iris()
    X, y = bunch.data, bunch.target
    feature_names = list(bunch.feature_names)
    target_names = list(bunch.target_names)
    label_order = np.arange(len(target_names))

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y,
    )

    models = {
        "logistic_regression": LogisticRegression(max_iter=200),
        "random_forest": RandomForestClassifier(n_estimators=100, random_state=42),
    }

    results_models = {}
    for name, est in models.items():
        est.fit(X_train, y_train)
        y_pred = est.predict(X_test)
        report = classification_report(
            y_test, y_pred, labels=label_order, output_dict=True, zero_division=0
        )
        macro = report["macro avg"]
        block = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision_macro": float(macro["precision"]),
            "recall_macro": float(macro["recall"]),
            "f1_macro": float(macro["f1-score"]),
            "confusion_matrix": confusion_matrix(
                y_test, y_pred, labels=label_order
            ).tolist(),
        }
        if name == "random_forest":
            block["feature_importance"] = [
                float(x) for x in est.feature_importances_
            ]
        results_models[name] = block

    scatter = [
        {
            "pl": float(X[i, 2]),
            "pw": float(X[i, 3]),
            "species": int(y[i]),
        }
        for i in range(X.shape[0])
    ]

    payload = {
        "meta": {
            "dataset": "iris",
            "n_train": int(X_train.shape[0]),
            "n_test": int(X_test.shape[0]),
            "random_state": 42,
            "feature_names": feature_names,
            "target_names": target_names,
        },
        "models": results_models,
        "scatter": scatter,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
