import React, { Fragment, useEffect, useState } from "react";

const SAMPLE_ROWS = [
  { sl: "5.1", sw: "3.5", pl: "1.4", pw: "0.2", sp: "setosa" },
  { sl: "7.0", sw: "3.2", pl: "4.7", pw: "1.4", sp: "versicolor" },
  { sl: "6.3", sw: "3.3", pl: "6.0", pw: "2.5", sp: "virginica" },
];

function heatBg(count, max) {
  if (max === 0) return "rgba(255, 169, 68, 0.12)";
  const t = count / max;
  const r = 255;
  const g = Math.round(169 + (127 - 169) * t);
  const b = Math.round(68 + (0 - 68) * t);
  const a = 0.14 + t * 0.72;
  return `rgba(${r},${g},${b},${a})`;
}

function fmtPct(x) {
  if (x == null || typeof x !== "number" || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(1)}%`;
}

function modelLabel(key) {
  return key.replace(/_/g, " ");
}

/* Rust → vivid orange → apricot (same hue family, readable on light plot bg) */
const SCATTER_SPECIES_COLORS = ["#9a3412", "#ea580c", "#f9a73e"];

function PetalScatterChart({ points, targetNames }) {
  const w = 384;
  const h = 228;
  const padL = 36;
  const padR = 12;
  const padT = 16;
  const padB = 32;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const pl = points.map((p) => p.pl);
  const pw = points.map((p) => p.pw);
  const plMin = Math.min(...pl);
  const plMax = Math.max(...pl);
  const pwMin = Math.min(...pw);
  const pwMax = Math.max(...pw);
  const plR = plMax - plMin || 1;
  const pwR = pwMax - pwMin || 1;
  const padData = 0.06;
  const ePlMin = plMin - plR * padData;
  const ePlMax = plMax + plR * padData;
  const ePwMin = pwMin - pwR * padData;
  const ePwMax = pwMax + pwR * padData;
  const ePlR = ePlMax - ePlMin || 1;
  const ePwR = ePwMax - ePwMin || 1;

  const sx = (x) => padL + ((x - ePlMin) / ePlR) * innerW;
  const sy = (y) => padT + innerH - ((y - ePwMin) / ePwR) * innerH;

  return (
    <div className="scatter-chart-block">
      <svg
        className="scatter-chart"
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        aria-label="Scatter of petal length versus petal width by species"
      >
        <rect
          x={padL}
          y={padT}
          width={innerW}
          height={innerH}
          rx={5}
          fill="rgba(255, 250, 245, 0.75)"
          stroke="rgba(234, 101, 49, 0.22)"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.pl)}
            cy={sy(p.pw)}
            r={3.75}
            fill={SCATTER_SPECIES_COLORS[p.species] ?? "#c2410c"}
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth={0.45}
          />
        ))}
        <text
          x={padL + innerW / 2}
          y={h - 7}
          textAnchor="middle"
          className="scatter-axis-label"
        >
          Petal length (cm)
        </text>
        <text
          x={12}
          y={padT + innerH / 2}
          textAnchor="middle"
          transform={`rotate(-90, 12, ${padT + innerH / 2})`}
          className="scatter-axis-label"
        >
          Petal width (cm)
        </text>
      </svg>
      <ul className="scatter-legend">
        {targetNames.map((name, i) => (
          <li key={name}>
            <span
              className="scatter-legend-swatch"
              style={{ backgroundColor: SCATTER_SPECIES_COLORS[i] }}
            />{" "}
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

const Dashboard = () => {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/iris_results.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load iris_results.json");
        return res.json();
      })
      .then(setPayload)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-panel">
          <main className="dashboard-main">
            <p className="dashboard-error">{error}</p>
          </main>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-panel">
          <main className="dashboard-main">
            <p>Loading...</p>
          </main>
        </div>
      </div>
    );
  }

  const { meta, models, scatter } = payload;
  const modelEntries = Object.entries(models);
  const lr = models.logistic_regression;
  const rf = models.random_forest;
  const lrAcc = lr?.accuracy ?? 0;
  const rfAcc = rf?.accuracy ?? 0;
  const better =
    lrAcc > rfAcc
      ? { name: "Logistic regression", acc: lrAcc, other: rfAcc }
      : lrAcc < rfAcc
        ? { name: "Random forest", acc: rfAcc, other: lrAcc }
        : { name: "Tie", acc: lrAcc, other: lrAcc };

  const insightBullets = [];
  if (better.name === "Tie") {
    insightBullets.push(
      <Fragment>
        On this holdout split (
        <span className="metric-mono">{meta.n_test}</span> test samples), both
        models tie on accuracy (
        <span className="metric-mono">{fmtPct(lrAcc)}</span>).
      </Fragment>
    );
  } else {
    const hi = Math.max(lrAcc, rfAcc);
    const lo = Math.min(lrAcc, rfAcc);
    insightBullets.push(
      <Fragment>
        On this holdout split (
        <span className="metric-mono">{meta.n_test}</span> test samples),{" "}
        {better.name} achieves higher accuracy (
        <span className="metric-mono">{fmtPct(hi)}</span> vs{" "}
        <span className="metric-mono">{fmtPct(lo)}</span>).
      </Fragment>
    );
  }
  insightBullets.push(
    <Fragment>
      Logistic regression assumes a linear decision boundary; random forest can
      capture nonlinear feature interactions. On Iris, petal measurements often
      separate classes well, so a strong linear model is competitive.
    </Fragment>
  );
  

  const rfImp = rf?.feature_importance;
  const impMax = rfImp ? Math.max(...rfImp, 1e-9) : 1;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-panel">
        <main className="dashboard-main">
          <section className="section-block">
            <h1 className="hero-title">Iris Dataset Classification</h1>
            <p className="hero-lede">
              This page compares logistic regression and random forest on the classic Iris dataset: holdout accuracy, macro precision/recall/F1, confusion matrices, and (for the tree model) feature importance.
            </p>
          </section>

          <section className="section-block">
            <h2 className="section-heading">Dataset Overview</h2>
            <p className="body-text">
              Iris has <span className="metric-mono">150</span> samples,{" "}
              <span className="metric-mono">3</span> species (classes), and{" "}
              <span className="metric-mono">4</span> numeric measurements per
              flower. Features are sepal length/width and petal length/width (in
              cm).
            </p>
            <p className="body-text">
              <strong>Sepal</strong> = outer leaf-like parts;{" "}
              <strong>petal</strong> = inner petals. Petal size often separates
              species more than sepal size alone.
            </p>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sepal L (cm)</th>
                    <th>Sepal W (cm)</th>
                    <th>Petal L (cm)</th>
                    <th>Petal W (cm)</th>
                    <th>Species</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map((r) => (
                    <tr key={r.sp + r.sl}>
                      <td>{r.sl}</td>
                      <td>{r.sw}</td>
                      <td>{r.pl}</td>
                      <td>{r.pw}</td>
                      <td>{r.sp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Array.isArray(scatter) && scatter.length > 0 ? (
              <>
                <PetalScatterChart
                  points={scatter}
                  targetNames={meta.target_names}
                />
                <p className="body-text" style={{ marginTop: "0.75rem" }}>
                  <strong>Full Iris data</strong> (
                  <span className="metric-mono">150</span> samples): setosa
                  clusters at small petal size; versicolor and virginica overlap
                  more and need both dimensions (or all four features) to separate
                  cleanly.
                </p>
              </>
            ) : (
              <p className="scatter-note">
                <strong>Chart:</strong> re-run{" "}
                <code>python -m ml.train</code> and sync{" "}
                <code>iris_results.json</code> to include scatter points.
              </p>
            )}
          </section>

          <section className="section-block">
            <h2 className="section-heading">Problem Definition</h2>
            <p className="body-text">
              <strong>Multiclass classification:</strong> predict species (
              {meta.target_names.join(", ")}) from four continuous features.
              Models: <strong>logistic regression</strong> vs{" "}
              <strong>random forest</strong> (same train/test split, stratified,
              seed <span className="metric-mono">{meta.random_state}</span>).
            </p>
          </section>

          <section className="section-block">
            <h2 className="section-heading">Model Summary</h2>
            <p className="body-text">
              <strong>Logistic regression</strong> — linear model; softmax over
              classes. Fast, interpretable coefficients; strong baseline when
              classes are nearly linearly separable.
            </p>
            <p className="body-text">
              <strong>Random forest</strong> — ensemble of decision trees;
              captures nonlinearities and feature interactions without manual
              feature engineering.
            </p>
            <p className="body-text">
              Together they give a simple linear vs nonlinear comparison on the
              same data.
            </p>
          </section>

          <section className="section-block">
            <h2 className="section-heading">Key Metrics</h2>
            <p className="body-text">
              Holdout set:{" "}
              <span className="metric-mono">{meta.n_train}</span> train /{" "}
              <span className="metric-mono">{meta.n_test}</span> test. Macro
              averages treat each class equally.
            </p>
            <div className="metric-cards">
              {modelEntries.map(([key, m]) => (
                <div key={key} className="metric-card">
                  <h3 className="metric-card-title">{modelLabel(key)}</h3>
                  <p className="metric-card-stat">
                    <strong>Accuracy</strong> {fmtPct(m.accuracy)}
                  </p>
                  <p className="metric-card-stat">
                    <strong>Precision (macro)</strong>{" "}
                    {fmtPct(m.precision_macro)}
                  </p>
                  <p className="metric-card-stat">
                    <strong>Recall (macro)</strong> {fmtPct(m.recall_macro)}
                  </p>
                  <p className="metric-card-stat">
                    <strong>F1 (macro)</strong> {fmtPct(m.f1_macro)}
                  </p>
                </div>
              ))}
            </div>
            <h3 className="subsection-label">Accuracy (bars)</h3>
            <div className="accuracy-list">
              {modelEntries.map(([name, m]) => (
                <div key={name} className="accuracy-item">
                  <p className="accuracy-label">
                    {modelLabel(name)} — {(m.accuracy * 100).toFixed(1)}%
                  </p>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.round(m.accuracy * 1000) / 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section-block">
            <h2 className="section-heading">Visual Metrics</h2>
            <p className="body-text">
              Confusion matrices (rows = true class, columns = predicted). Heat
              cells use the orange scale from counts.
            </p>
            {modelEntries.map(([name, m]) => {
              const cm = m.confusion_matrix;
              const maxVal = Math.max(...cm.flat(), 1);
              const labels = meta.target_names;
              return (
                <section key={name} className="matrix-section">
                  <h3 className="metric-card-title">
                    Confusion matrix · {modelLabel(name)}
                  </h3>
                  <p className="matrix-hint">
                    rows = actual, columns = predicted
                  </p>
                  <div className="matrix-wrap">
                    <table className="matrix-table">
                      <thead>
                        <tr>
                          <th />
                          {labels.map((lab) => (
                            <th key={lab}>{lab}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cm.map((row, i) => (
                          <tr key={i}>
                            <th scope="row">{labels[i]}</th>
                            {row.map((v, j) => (
                              <td
                                key={j}
                                className="matrix-cell"
                                style={{ backgroundColor: heatBg(v, maxVal) }}
                              >
                                {v}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}

            {rfImp && (
              <section className="matrix-section">
                <h3 className="metric-card-title">Feature importance (random forest)</h3>
                <p className="body-text">
                  Gini-based importances from the fitted forest (sums to 1).
                </p>
                <div className="importance-block">
                  {meta.feature_names.map((fname, i) => (
                    <div key={fname} className="importance-row">
                      <span className="importance-name">{fname}</span>
                      <span className="importance-pct">
                        {(rfImp[i] * 100).toFixed(1)}%
                      </span>
                      <div className="importance-track">
                        <div
                          className="importance-fill"
                          style={{ width: `${(rfImp[i] / impMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            
          </section>

          <section className="section-block">
            <h2 className="section-heading">Comparison Insight</h2>
            <ul className="insights-list">
              {insightBullets.map((content, i) => (
                <li key={i}>{content}</li>
              ))}
            </ul>
          </section>

          <footer className="page-footer">
            <p className="body-text" style={{ margin: "0 0 0.5rem" }}>
              <strong>Data source:</strong>{" "}
              <a
                href="https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_iris.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Iris dataset via scikit-learn <code>load_iris</code>
              </a>{" "}.
            </p>
            <p className="body-text" style={{ margin: 0 }}>
              <strong>Notes:</strong> default models from sci-kit were used, no feature scaling (both
              trees and logistic regression on raw cm features for this demo),
              single stratified 75/25 split, no cross-validation.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
