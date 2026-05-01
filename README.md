# Iris classifiers

Train **logistic regression** and **random forest** on scikit-learn’s Iris dataset, export metrics and visual artifacts to JSON, and view them in a browser dashboard (holdout accuracy, macro precision/recall/F1, confusion matrices, petal scatter, random-forest feature importance).

## Prerequisites

- **Git**
- **Python 3** (for training)
- **Node.js** and **npm** (for the dashboard dev server)

## Clone the repository

```bash
git clone https://github.com/arjun-ankad/iris-classifiers.git
cd iris-classifiers
```

If you use SSH:

```bash
git clone git@github.com:arjun-ankad/iris-classifiers.git
cd iris-classifiers
```

---

## 1. Run the model (training)

Create a virtual environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

From the **repository root**, train both models and write results to `data/iris_results.json`:

```bash
python -m ml.train
```

Equivalent:

```bash
make install    # optional: pip install -r requirements.txt using current pip
make train      # or: make ml — creates data/ if needed, then runs training
```

**Custom output path:**

```bash
python -m ml.train --out path/to/results.json
```

**What gets written (default `data/iris_results.json`):**

| Key | Contents |
|-----|----------|
| **`meta`** | Dataset id, train/test counts, `random_state`, `feature_names`, `target_names` (order for confusion-matrix rows/columns). |
| **`models.*`** | Per model: `accuracy`, `precision_macro`, `recall_macro`, `f1_macro`, `confusion_matrix`. Random forest also has `feature_importance` aligned with `feature_names` (non-negative, sum ≈ 1). |
| **`scatter`** | Full Iris sample points: `pl`, `pw`, `species` for the petal scatter in the dashboard. |

---

## Design decisions

**Machine learning**

- **Two models:** Logistic regression (linear, fast) vs random forest (nonlinear, ensemble) on the same split to compare linear vs tree-based behavior on a small, well-behaved dataset.
- **Single holdout split:** Stratified 75/25 with `random_state=42` for reproducibility. No cross-validation or tuning—the goal is a clear baseline and stable numbers for the dashboard, not leaderboard performance.
- **No feature scaling:** Raw cm features for both models under identical conditions (called out in the UI); Iris is forgiving, so both models still perform strongly.
- **Macro metrics:** Precision, recall, and F1 are **macro**-averaged so each species counts equally in a 3-class summary. Confusion matrices use explicit `labels` aligned with `target_names`, so the UI never guesses row/column order.
- **Random forest:** `feature_importance` from the fitted forest is exported for the dashboard’s bar view.

**Data export**

- **One JSON file** holds `meta`, per-model results, and `scatter`, so the page can load everything with a single request.
- **Scatter vs metrics:** The scatter plot uses all 150 samples (petal length vs width) for classic EDA. Reported accuracy, macro metrics, and confusion matrices come only from the stratified train/test split in `train.py`.

---

## 2. Run the dashboard

The UI loads **`iris_results.json` from `frontend/public/`**. After training, copy the freshly generated file from `data/`:

```bash
# from repository root
make sync-ui
```

Or manually:

```bash
cp data/iris_results.json frontend/public/iris_results.json
```

A copy is already committed under `frontend/public/` so the dashboard can start before you run training; **`make sync-ui`** refreshes it after `python -m ml.train`.

Install UI dependencies and start the dev server:

```bash
cd frontend
npm install
npm start
```

Open **http://localhost:3000** in your browser. Stop the server with `Ctrl+C`.

**Production build** (optional):

```bash
cd frontend
npm run build
```

Serve the `frontend/build` folder with any static file host; ensure `iris_results.json` is available at the site root (same as in `public/` for local development).

---

## Makefile targets

| Target | Action |
|--------|--------|
| `make install` | `pip install -r requirements.txt` |
| `make train` / `make ml` | Run `ml.train`, default output `data/iris_results.json` |
| `make sync-ui` | Copy `data/iris_results.json` → `frontend/public/iris_results.json` |

---

## Repository layout

```
iris-classifiers/
├── data/                  # training output (iris_results.json after train)
├── ml/
│   └── train.py           # training + JSON export
├── frontend/
│   ├── public/            # static assets + iris_results.json for the dev server
│   └── src/               # dashboard UI
├── requirements.txt
├── Makefile
└── README.md
```
