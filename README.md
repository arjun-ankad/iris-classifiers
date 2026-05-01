# Iris Dataset Classification

Minimal pipeline: load the Iris dataset, train **logistic regression** and **random forest**, then write **accuracy** and **confusion matrices** to JSON for a future dashboard.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Or: `make install` (uses your current `pip`).

## Run training

```bash
python -m ml.train
```

Or: `make ml` / `make train` (creates `data/` if needed).

Custom output path:

```bash
python -m ml.train --out path/to/results.json
```

## Output

Default file: **`data/iris_results.json`**.

- **`meta`**: `dataset`, sample counts, `random_state`, `feature_names`, `target_names` (row/column order for confusion matrices).
- **`models.*`**: `accuracy`, macro **`precision_macro`**, **`recall_macro`**, **`f1_macro`**, **`confusion_matrix`** (same axis order as `target_names`). Random forest also includes **`feature_importance`** (one weight per `feature_names`, sums to 1).

## Design choices

- Single stratified train/test split (`random_state=42`) for clarity and reproducibility—no CV or tuning, since the goal is a clear baseline and exported artifacts.
- Confusion matrices use explicit `labels` aligned with `target_names` so the frontend can map indices without guessing sklearn’s default ordering.

## Frontend (Create React App)

```bash
cd frontend
npm install
```

After training, copy the latest JSON into `public/` so the dev server can load it:

```bash
make sync-ui    # from repo root; or: cp data/iris_results.json frontend/public/
npm start       # http://localhost:3000
```

The dashboard reads `public/iris_results.json` (a sample is committed under `frontend/public/` so `npm start` works before the first run).

Create React App with React 18 and `react-router-dom`. Layout and styles are plain HTML tags and classes in [`frontend/src/index.css`](frontend/src/index.css) (Tailwind is only wired for `@tailwind` base in that file). No chart libraries—CSS bars and tables only.
