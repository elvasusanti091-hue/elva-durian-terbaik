const STORAGE_KEYS = {
  criteria: "spk_saw_criteria_v1",
  alternatives: "spk_saw_alternatives_v1"
};

const defaultCriteria = [
  { code: "C1", name: "Ukuran & Bentuk Buah", type: "Benefit", weight: 4 },
  { code: "C2", name: "Ketebalan & Warna Daging", type: "Benefit", weight: 5 },
  { code: "C3", name: "Rasa & Tekstur Daging", type: "Benefit", weight: 5 },
  { code: "C4", name: "Aroma Khas", type: "Benefit", weight: 4 }
];

const defaultAlternatives = [
  { id: cryptoId(), name: "Durian Musang King", values: [5, 5, 5, 5] },
  { id: cryptoId(), name: "Durian Black Thorn", values: [5, 5, 4, 5] },
  { id: cryptoId(), name: "Durian Duri Hitam", values: [4, 5, 4, 4] },
  { id: cryptoId(), name: "Durian Petruk", values: [4, 4, 4, 4] },
  { id: cryptoId(), name: "Durian D24", values: [4, 4, 5, 4] },
  { id: cryptoId(), name: "Durian Simpor", values: [4, 4, 4, 3] },
  { id: cryptoId(), name: "Durian Matahari", values: [4, 4, 3, 4] },
  { id: cryptoId(), name: "Durian Kanjang", values: [4, 3, 4, 4] },
  { id: cryptoId(), name: "Durian Montong", values: [3, 4, 4, 3] },
  { id: cryptoId(), name: "Durian Ochee", values: [3, 5, 3, 4] },
  { id: cryptoId(), name: "Durian Merah", values: [3, 4, 4, 3] },
  { id: cryptoId(), name: "Durian Bawor", values: [3, 3, 4, 3] },
  { id: cryptoId(), name: "Durian Tembaga", values: [3, 3, 3, 3] },
  { id: cryptoId(), name: "Durian Bokor", values: [3, 3, 3, 2] },
  { id: cryptoId(), name: "Durian Udang Merah", values: [2, 3, 3, 2] }
];

let criteria = loadJSON(STORAGE_KEYS.criteria, defaultCriteria);
let alternatives = loadJSON(STORAGE_KEYS.alternatives, defaultAlternatives);

const el = {
  criteriaTable: document.getElementById("criteriaTable"),
  alternativesTable: document.getElementById("alternativesTable"),
  calculationTable: document.getElementById("calculationTable"),
  rankingTable: document.getElementById("rankingTable"),
  criteriaMini: document.getElementById("criteriaMini"),
  alternativeForm: document.getElementById("alternativeForm"),
  altName: document.getElementById("altName"),
  c1: document.getElementById("c1"),
  c2: document.getElementById("c2"),
  c3: document.getElementById("c3"),
  c4: document.getElementById("c4"),
  statAlternatives: document.getElementById("statAlternatives"),
  statCriteria: document.getElementById("statCriteria"),
  statBest: document.getElementById("statBest"),
  statBestScore: document.getElementById("statBestScore"),
  weightSummary: document.getElementById("weightSummary"),
  bestCard: document.getElementById("bestCard"),
  bestName: document.getElementById("bestName"),
  bestDetail: document.getElementById("bestDetail"),
  bestScoreCard: document.getElementById("bestScoreCard"),
  btnResetDefault: document.getElementById("btnResetDefault"),
  btnExportJSON: document.getElementById("btnExportJSON")
};

el.alternativeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = el.altName.value.trim();
  if (!name) return;

  const values = [el.c1, el.c2, el.c3, el.c4].map((input) => clampScore(input.value));
  alternatives.unshift({
    id: cryptoId(),
    name,
    values
  });

  saveAll();
  renderAll();
  el.alternativeForm.reset();
  el.altName.focus();
  el.c1.value = 3;
  el.c2.value = 3;
  el.c3.value = 3;
  el.c4.value = 3;
});

el.btnResetDefault.addEventListener("click", () => {
  if (!confirm("Kembalikan data ke default bawaan?")) return;
  criteria = structuredCloneSafe(defaultCriteria);
  alternatives = structuredCloneSafe(defaultAlternatives);
  saveAll();
  renderAll();
});

el.btnExportJSON.addEventListener("click", () => {
  const data = {
    criteria,
    alternatives
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data-spk-saw-durian.json";
  a.click();
  URL.revokeObjectURL(url);
});

function renderAll() {
  const results = calculateSAW();
  renderCriteria();
  renderAlternatives();
  renderCalculation(results);
  renderRanking(results);
  renderSummary(results);
  saveAll();
}

function renderCriteria() {
  el.criteriaTable.innerHTML = "";
  el.criteriaMini.innerHTML = "";
  const totalWeight = criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  el.weightSummary.textContent = `Bobot Total: ${totalWeight}`;

  criteria.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="badge">${item.code}</span></td>
      <td>${item.name}</td>
      <td><span class="badge">${item.type}</span></td>
      <td>
        <input class="weight-input" data-index="${index}" type="number" min="1" max="10" step="1" value="${item.weight}" />
      </td>
      <td>
        <div class="inline-actions">
          <button class="small-btn" data-action="up" data-index="${index}" type="button">Naik</button>
          <button class="small-btn" data-action="down" data-index="${index}" type="button">Turun</button>
        </div>
      </td>
    `;
    el.criteriaTable.appendChild(tr);
  });

  criteria.forEach((item) => {
    const box = document.createElement("div");
    box.className = "mini-item";
    box.innerHTML = `
      <strong>${item.code} • ${item.name}</strong>
      <span>${item.type} • Bobot ${item.weight}</span>
    `;
    el.criteriaMini.appendChild(box);
  });

  document.querySelectorAll(".weight-input").forEach((input) => {
    input.addEventListener("change", () => {
      const idx = Number(input.dataset.index);
      const value = clampWeight(input.value);
      criteria[idx].weight = value;
      renderAll();
    });
  });

  document.querySelectorAll('[data-action="up"]').forEach((btn) => {
    btn.addEventListener("click", () => reorderCriteria(Number(btn.dataset.index), -1));
  });

  document.querySelectorAll('[data-action="down"]').forEach((btn) => {
    btn.addEventListener("click", () => reorderCriteria(Number(btn.dataset.index), 1));
  });
}

function renderAlternatives() {
  el.alternativesTable.innerHTML = "";
  el.statAlternatives.textContent = alternatives.length;

  alternatives.forEach((alt, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${alt.name}</strong></td>
      <td><span class="badge">${alt.values[0]}</span></td>
      <td><span class="badge">${alt.values[1]}</span></td>
      <td><span class="badge">${alt.values[2]}</span></td>
      <td><span class="badge">${alt.values[3]}</span></td>
      <td>
        <div class="inline-actions">
          <button class="small-btn danger" type="button" data-delete="${alt.id}">Hapus</button>
        </div>
      </td>
    `;
    el.alternativesTable.appendChild(tr);
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.delete;
      alternatives = alternatives.filter((item) => item.id !== id);
      saveAll();
      renderAll();
    });
  });
}

function renderCalculation(results) {
  el.calculationTable.innerHTML = "";
  results.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.normalized[0].toFixed(3)}</td>
      <td>${row.normalized[1].toFixed(3)}</td>
      <td>${row.normalized[2].toFixed(3)}</td>
      <td>${row.normalized[3].toFixed(3)}</td>
      <td><strong>${row.score.toFixed(3)}</strong></td>
    `;
    el.calculationTable.appendChild(tr);
  });
}

function renderRanking(results) {
  el.rankingTable.innerHTML = "";
  const sorted = [...results].sort((a, b) => b.score - a.score);

  sorted.forEach((row, index) => {
    const tr = document.createElement("tr");
    const isBest = index === 0;
    tr.innerHTML = `
      <td><span class="badge ${isBest ? "best" : ""}">${index + 1}</span></td>
      <td>${row.name}</td>
      <td><strong>${row.score.toFixed(3)}</strong></td>
      <td>${isBest ? '<span class="badge best">Terbaik</span>' : '<span class="badge">Layak</span>'}</td>
    `;
    el.rankingTable.appendChild(tr);
  });
}

function renderSummary(results) {
  if (!results.length) {
    el.statBest.textContent = "-";
    el.statBestScore.textContent = "0";
    el.bestName.textContent = "-";
    el.bestDetail.textContent = "Belum ada alternatif.";
    return;
  }

  const best = [...results].sort((a, b) => b.score - a.score)[0];
  el.statBest.textContent = best.name;
  el.statBestScore.textContent = best.score.toFixed(3);
  el.bestName.textContent = best.name;
  el.bestScoreCard.textContent = best.score.toFixed(3);
  el.bestDetail.textContent = `Peringkat pertama berdasarkan bobot kriteria dan nilai normalisasi SAW.`;
}

function calculateSAW() {
  if (!alternatives.length) return [];

  const weightTotal = criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0) || 1;
  const weights = criteria.map((item) => Number(item.weight || 0) / weightTotal);
  const maxValues = [0, 1, 2, 3].map((idx) => Math.max(...alternatives.map((alt) => Number(alt.values[idx] || 0))));

  return alternatives.map((alt) => {
    const normalized = alt.values.map((value, idx) => {
      const max = maxValues[idx] || 1;
      return Number(value) / max;
    });
    const score = normalized.reduce((sum, value, idx) => sum + value * weights[idx], 0);
    return {
      id: alt.id,
      name: alt.name,
      values: alt.values,
      normalized,
      score
    };
  });
}

function reorderCriteria(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= criteria.length) return;
  [criteria[index], criteria[target]] = [criteria[target], criteria[index]];
  saveAll();
  renderAll();
}

function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 1;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function clampWeight(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 1;
  return Math.max(1, Math.min(10, Math.round(n)));
}

function cryptoId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 11);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredCloneSafe(fallback);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : structuredCloneSafe(fallback);
  } catch {
    return structuredCloneSafe(fallback);
  }
}

function saveAll() {
  localStorage.setItem(STORAGE_KEYS.criteria, JSON.stringify(criteria));
  localStorage.setItem(STORAGE_KEYS.alternatives, JSON.stringify(alternatives));
}

function structuredCloneSafe(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

renderAll();