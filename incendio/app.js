const COLORS = {
  orange: "#ff7a00",
  green: "#22c55e",
  red: "#ef4444",
  muted: "#8b8b93",
  grid: "rgba(255,255,255,0.06)",
};

const STORAGE = {
  dados: "fireboard_extintores_v4",
  precos: "fireboard_precos_v4",
  updated: "fireboard_updated_v4",
  updateAlerts: "fireboard_update_alerts_v1",
  theme: "fireboard_theme_v1",
};

const NUMS_PARA_RECARGA = [2, 6, 16, 17, 18, 26, 31, 38, 41, 44, 53, 57, 58, 60, 62];

const TIPOS = [
  "Pó químico ABC",
  "Pó químico BC",
  "CO2",
  "Água pressurizada",
  "Espuma mecânica",
];

const DEFAULT_PRECOS = {
  recarga: { 2: 45, 6: 65, 8: 85, 12: 110, 20: 160 },
  recargaPorTipo: {
    "Pó químico ABC": { 2: 45, 6: 65, 8: 85, 12: 110, 20: 160 },
    "Pó químico BC": { 4: 55, 6: 70, 8: 90, 12: 120 },
    CO2: { 4: 90, 6: 130 },
    "Água pressurizada": { 10: 60 },
    "Espuma mecânica": { 9: 80 },
  },
  testeHidrostatico: 120,
  testeHidrostaticoPorTipo: {
    "Pó químico ABC": 120,
    "Pó químico BC": 120,
    CO2: 150,
    "Água pressurizada": 100,
    "Espuma mecânica": 110,
  },
  orcamentoAnual: 15000,
};

const CSV_HEADER = [
  "num",
  "local",
  "dpto",
  "tipo",
  "cargaKg",
  "dataRecarga",
  "validadeRecarga",
  "proximaRecarga",
  "dataUltimoTH",
  "statusTH",
  "proximoTH",
];

const charts = {};
let EXTINTORES = [];
let BASE_DATA = [];
let PRECOS = structuredClone(DEFAULT_PRECOS);
let currentPage = "dashboard";
let searchTerm = "";
let dptoFilter = "";
let statusFilter = "";
let cargaFilter = "";
let tipoFilter = "";
let tipoRecargaFilter = "";
let thStatusFilter = "";

function parseDate(br) {
  if (!br) return null;
  const [d, m, y] = String(br).split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function formatDateBR(date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateInput(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addYears(date, years) {
  return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
}

function thDateInvalida(br) {
  const d = parseDate(br);
  if (!d) return true;
  return d.getFullYear() < 2005;
}

function money(n) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function destroyChart(key) {
  if (charts[key]) {
    charts[key].destroy();
    delete charts[key];
  }
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function daysUntil(date) {
  const a = startOfDay(new Date());
  const b = startOfDay(date);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function loadUpdateAlerts() {
  try {
    const raw = localStorage.getItem(STORAGE.updateAlerts);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function pushUpdateAlert(message) {
  const list = loadUpdateAlerts();
  list.unshift({
    id: `${Date.now()}`,
    at: new Date().toISOString(),
    message: message || "Inventário de extintores atualizado.",
  });
  localStorage.setItem(STORAGE.updateAlerts, JSON.stringify(list.slice(0, 20)));
}

function showToast(title, text) {
  const host = document.getElementById("toastHost");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<strong>${title}</strong><p>${text}</p>`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

/** Dois alertas: 60 dias e 30 dias antes da recarga (com prazo até o fim daquele mês). */
function buildVencimentoAlerts() {
  const alert60 = [];
  const alert30 = [];
  const overdue = [];

  EXTINTORES.forEach((e) => {
    const due = parseDate(e.proximaRecarga);
    if (!due) return;
    const monthEnd = endOfMonth(due);
    const daysToDue = daysUntil(due);
    const daysToMonthEnd = daysUntil(monthEnd);
    const item = {
      num: e.num,
      local: e.local,
      dpto: e.dpto,
      proximaRecarga: e.proximaRecarga,
      monthEnd: formatDateInput(monthEnd),
      days: daysToDue,
      daysToMonthEnd,
    };

    if (e.validadeRecarga === "Vencido" || daysToDue < 0) {
      overdue.push(item);
      return;
    }
    // Alerta 30 dias até a data de recarga
    if (daysToDue <= 30) alert30.push(item);
    // Alerta 60 dias (ainda não entrou nos 30)
    else if (daysToDue <= 60) alert60.push(item);
  });

  const byDays = (a, b) => a.days - b.days;
  return {
    alert60: alert60.sort(byDays),
    alert30: alert30.sort(byDays),
    overdue: overdue.sort(byDays),
  };
}

function refreshAlertsUI() {
  const { alert60, alert30, overdue } = buildVencimentoAlerts();
  const updates = loadUpdateAlerts();
  const badgeCount = alert60.length + alert30.length + overdue.length + (updates.length ? 1 : 0);
  const badge = document.getElementById("alertBadge");
  if (badge) {
    badge.textContent = String(badgeCount);
    badge.hidden = badgeCount === 0;
  }

  const body = document.getElementById("alertsBody");
  if (!body) return;

  const parts = [];

  if (updates.length) {
    const last = updates[0];
    parts.push(`
      <div class="alerts-group">
        <h4>Atualização de extintores</h4>
        <div class="alert-item alert-update">
          <div class="alert-ico ok"><i class="fa-solid fa-cloud-arrow-up"></i></div>
          <div>
            <strong>Inventário atualizado</strong>
            <p>${last.message}<br>${formatDateBR(new Date(last.at))} · ${new Date(last.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      </div>`);
  }

  if (alert30.length) {
    parts.push(`
      <div class="alerts-group">
        <h4>Alerta 30 dias — recarga próxima</h4>
        ${alert30
          .slice(0, 12)
          .map(
            (e) => `
          <div class="alert-item alert-30">
            <div class="alert-ico danger"><i class="fa-solid fa-bell"></i></div>
            <div>
              <strong>Nº ${e.num} · ${e.local}</strong>
              <p>${e.dpto} · recarga em ${e.proximaRecarga} · prazo até ${e.monthEnd} · faltam ${e.days} dia(s)</p>
            </div>
          </div>`
          )
          .join("")}
        ${alert30.length > 12 ? `<p class="alerts-empty">+${alert30.length - 12} outros</p>` : ""}
      </div>`);
  }

  if (alert60.length) {
    parts.push(`
      <div class="alerts-group">
        <h4>Alerta 60 dias — recarga no horizonte</h4>
        ${alert60
          .slice(0, 12)
          .map(
            (e) => `
          <div class="alert-item alert-60">
            <div class="alert-ico warn"><i class="fa-regular fa-bell"></i></div>
            <div>
              <strong>Nº ${e.num} · ${e.local}</strong>
              <p>${e.dpto} · recarga em ${e.proximaRecarga} · prazo até ${e.monthEnd} · faltam ${e.days} dia(s)</p>
            </div>
          </div>`
          )
          .join("")}
        ${alert60.length > 12 ? `<p class="alerts-empty">+${alert60.length - 12} outros</p>` : ""}
      </div>`);
  }

  if (overdue.length) {
    parts.push(`
      <div class="alerts-group">
        <h4>Recargas vencidas</h4>
        ${overdue
          .slice(0, 10)
          .map(
            (e) => `
          <div class="alert-item alert-30">
            <div class="alert-ico danger"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div>
              <strong>Nº ${e.num} · ${e.local}</strong>
              <p>${e.dpto} · vencimento ${e.proximaRecarga}</p>
            </div>
          </div>`
          )
          .join("")}
      </div>`);
  }

  body.innerHTML = parts.length
    ? parts.join("")
    : `<p class="alerts-empty">Nenhum alerta no momento.</p>`;
}

function setAlertsOpen(open) {
  const panel = document.getElementById("alertsPanel");
  const btn = document.getElementById("btnAlerts");
  if (!panel || !btn) return;
  panel.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) refreshAlertsUI();
}

function bindAlertsUI() {
  const btn = document.getElementById("btnAlerts");
  const close = document.getElementById("btnCloseAlerts");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const panel = document.getElementById("alertsPanel");
      setAlertsOpen(Boolean(panel?.hidden));
    });
  }
  if (close) close.addEventListener("click", () => setAlertsOpen(false));
  document.addEventListener("click", (e) => {
    const wrap = document.querySelector(".alert-wrap");
    if (!wrap || wrap.contains(e.target)) return;
    setAlertsOpen(false);
  });
}

function persist(options = {}) {
  localStorage.setItem(STORAGE.dados, JSON.stringify(EXTINTORES));
  localStorage.setItem(STORAGE.precos, JSON.stringify(PRECOS));
  localStorage.setItem(STORAGE.updated, new Date().toISOString());
  const cloud = window.FireBoardCloud;
  if (cloud?.isReady?.() && cloud.currentUser?.()) {
    cloud
      .saveShared({ extintores: EXTINTORES, precos: PRECOS })
      .catch((err) => console.error("Falha ao salvar na nuvem:", err));
  }
  if (options.notifyUpdate) {
    pushUpdateAlert(options.message || `Inventário salvo: ${EXTINTORES.length} extintores.`);
    showToast("Atualização registrada", options.message || "Os extintores foram atualizados.");
  }
  refreshAlertsUI();
}

function mergePrecos(parsed) {
  if (!parsed || typeof parsed !== "object") return structuredClone(DEFAULT_PRECOS);
  return {
    recarga: { ...DEFAULT_PRECOS.recarga, ...(parsed.recarga || {}) },
    recargaPorTipo: {
      ...DEFAULT_PRECOS.recargaPorTipo,
      ...(parsed.recargaPorTipo || {}),
    },
    testeHidrostatico: Number(parsed.testeHidrostatico ?? DEFAULT_PRECOS.testeHidrostatico),
    testeHidrostaticoPorTipo: {
      ...DEFAULT_PRECOS.testeHidrostaticoPorTipo,
      ...(parsed.testeHidrostaticoPorTipo || {}),
    },
    orcamentoAnual: Number(parsed.orcamentoAnual ?? DEFAULT_PRECOS.orcamentoAnual),
  };
}

function loadPrecos() {
  try {
    const raw = localStorage.getItem(STORAGE.precos);
    if (!raw) return structuredClone(DEFAULT_PRECOS);
    return mergePrecos(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_PRECOS);
  }
}

function applyCloudPayload(data, { seedIfEmpty = false } = {}) {
  if (data?.extintores?.length) {
    EXTINTORES = data.extintores.map((e) =>
      applyValidadeTH({ ...e, tipo: normalizeTipo(e.tipo) })
    );
    if (data.precos) PRECOS = mergePrecos(data.precos);
    if (data.updatedAt) localStorage.setItem(STORAGE.updated, data.updatedAt);
    localStorage.setItem(STORAGE.dados, JSON.stringify(EXTINTORES));
    localStorage.setItem(STORAGE.precos, JSON.stringify(PRECOS));
    return true;
  }
  if (seedIfEmpty) {
    persist();
  }
  return false;
}

function refreshCurrentView() {
  if (!currentPage) return;
  navigate(currentPage);
}


function fixMojibakeText(value) {
  if (value == null) return value;
  let s = String(value);
  const map = {
    0x80: "À", 0x81: "Á", 0xa0: "à", 0xa1: "á", 0xa2: "â", 0xa3: "ã",
    0xa7: "ç", 0xa9: "é", 0xaa: "ê", 0xad: "í", 0xb3: "ó", 0xb4: "ô",
    0xb5: "õ", 0xba: "ú",
  };
  const re = new RegExp(String.fromCodePoint(0xc3, 0x192, 0xc2) + "([\u0080-\u00BF])", "g");
  s = s.replace(re, (_, ch) => map[ch.codePointAt(0)] || ch);
  s = s.split(String.fromCodePoint(0xc3, 0x201a, 0xc2, 0xb7)).join("·");
  s = s.split(String.fromCodePoint(0xc3, 0x201a, 0xc2, 0xba)).join("º");
  return s;
}

function sanitizeExtintor(e) {
  if (!e || typeof e !== "object") return e;
  const out = { ...e };
  for (const k of ["local", "dpto", "tipo", "validadeRecarga", "statusTH", "dataRecarga", "proximaRecarga", "dataUltimoTH", "proximoTH"]) {
    if (out[k] != null) out[k] = fixMojibakeText(out[k]);
  }
  return out;
}

function normalizeTipo(tipo) {
  return tipo && String(tipo).trim() ? String(tipo).trim() : "Pó químico ABC";
}

function custoRecarga(e) {
  const tipo = normalizeTipo(e.tipo);
  const byTipo = PRECOS.recargaPorTipo?.[tipo];
  if (byTipo) {
    const val = byTipo[e.cargaKg] ?? byTipo[String(e.cargaKg)];
    if (val != null) return Number(val);
  }
  const table = PRECOS.recarga || {};
  const key = String(e.cargaKg);
  if (table[key] != null) return Number(table[key]);
  if (table[e.cargaKg] != null) return Number(table[e.cargaKg]);
  return 65;
}

function custoTH(e) {
  const tipo = normalizeTipo(e?.tipo);
  const byTipo = PRECOS.testeHidrostaticoPorTipo?.[tipo];
  if (byTipo != null) return Number(byTipo);
  return Number(PRECOS.testeHidrostatico || 0);
}

function applyValidadeTH(item) {
  const e = sanitizeExtintor(item);
  const last = parseDate(e.dataUltimoTH);
  if (thDateInvalida(e.dataUltimoTH)) {
    e.statusTH = "Vencido";
    if (!e.proximoTH || thDateInvalida(e.proximoTH)) e.proximoTH = "";
    return e;
  }
  const proximo = addYears(last, 5);
  e.proximoTH = formatDateInput(proximo);
  e.statusTH = startOfDay(proximo) >= startOfDay(new Date()) ? "Válido" : "Vencido";
  return e;
}

function normalizeConformidade(list) {
  const paraRecarga = new Set(NUMS_PARA_RECARGA);
  return list.map((raw) => {
    const item = { ...raw, tipo: normalizeTipo(raw.tipo) };
    if (paraRecarga.has(Number(item.num))) {
      item.validadeRecarga = "Vencido";
      if (thDateInvalida(item.dataUltimoTH) || item.dataUltimoTH === "01/12/2022" || item.dataUltimoTH === "31/12/2022") {
        item.dataUltimoTH = "";
        item.proximoTH = "";
      }
    }
    return applyValidadeTH(item);
  });
}

function filtered() {
  return EXTINTORES.filter((e) => {
    if (dptoFilter && e.dpto !== dptoFilter) return false;
    if (statusFilter && e.validadeRecarga !== statusFilter) return false;
    if (cargaFilter && String(e.cargaKg) !== String(cargaFilter)) return false;
    if (tipoFilter && normalizeTipo(e.tipo) !== tipoFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const blob = `${e.num} ${e.local} ${e.dpto} ${e.tipo} ${e.cargaKg}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

function countBy(arr, keyFn) {
  const map = {};
  arr.forEach((item) => {
    const k = keyFn(item);
    map[k] = (map[k] || 0) + 1;
  });
  return map;
}

function sparkFill(color) {
  if (color === COLORS.orange) return "rgba(255,122,0,0.15)";
  if (color === COLORS.green) return "rgba(34,197,94,0.15)";
  return "rgba(239,68,68,0.15)";
}

function sparkline(canvasId, values, color) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx || typeof Chart === "undefined") return;
  charts[canvasId] = new Chart(ctx, {
    type: "line",
    data: {
      labels: values.map((_, i) => i),
      datasets: [{
        data: values,
        borderColor: color,
        backgroundColor: sparkFill(color),
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  });
}

function updateKPIs(data) {
  const total = data.length;
  const validos = data.filter((e) => e.validadeRecarga === "Válido").length;
  const vencidos = data.filter((e) => e.validadeRecarga === "Vencido").length;
  const taxa = total ? Math.round((validos / total) * 100) : 0;

  document.getElementById("kpiTotal").textContent = total;
  document.getElementById("kpiValidos").textContent = validos;
  document.getElementById("kpiVencidos").textContent = vencidos;
  document.getElementById("kpiTaxa").textContent = `${taxa}%`;
  document.getElementById("kpiValidosTrend").textContent = `${validos} de ${total} em dia`;
  document.getElementById("kpiVencidosTrend").textContent = vencidos
    ? `${vencidos} precisam de recarga`
    : "Nenhum pendente";
  const taxaEl = document.getElementById("kpiTaxaTrend");
  taxaEl.textContent = taxa >= 100 ? "Meta 100% atingida" : `${taxa}% · meta 100%`;
  taxaEl.className = `kpi-trend ${taxa >= 100 ? "up" : "down"}`;
  refreshAlertsUI();
  document.getElementById("donutCenterValue").textContent = total;

  sparkline("sparkTotal", [40, 48, 52, 58, 61, 65, total], COLORS.orange);
  sparkline("sparkValidos", [30, 35, 40, 44, 48, 50, validos], COLORS.green);
  sparkline("sparkVencidos", [20, 18, 16, 17, 15, 16, vencidos], COLORS.red);
  sparkline("sparkTaxa", [70, 72, 74, 76, 77, 78, taxa], COLORS.orange);
}

function renderStatusChart(data) {
  destroyChart("status");
  if (typeof Chart === "undefined") return;
  const validos = data.filter((e) => e.validadeRecarga === "Válido").length;
  const vencidos = data.filter((e) => e.validadeRecarga === "Vencido").length;
  const total = data.length || 1;

  charts.status = new Chart(document.getElementById("chartStatus"), {
    type: "doughnut",
    data: {
      labels: ["Em dia", "Para recarga"],
      datasets: [{
        data: [validos, vencidos],
        backgroundColor: [COLORS.orange, COLORS.red],
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: { legend: { display: false } },
    },
  });

  document.getElementById("statusLegend").innerHTML = `
    <li>
      <span class="legend-dot" style="background:${COLORS.orange}"></span>
      <div><strong>Recargas válidas</strong><small>${Math.round((validos / total) * 100)}% do total</small></div>
      <strong>${validos}</strong>
    </li>
    <li>
      <span class="legend-dot" style="background:${COLORS.red}"></span>
      <div><strong>Extintores para recarga</strong><small>${Math.round((vencidos / total) * 100)}% do total</small></div>
      <strong>${vencidos}</strong>
    </li>`;
}

function renderLocaisChart(data) {
  destroyChart("locais");
  if (typeof Chart === "undefined") return;
  const map = countBy(data, (e) => e.local);
  const labels = Object.keys(map).sort((a, b) => map[b] - map[a]);

  charts.locais = new Chart(document.getElementById("chartLocais"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: labels.map((l) => map[l]),
        backgroundColor: COLORS.orange,
        borderRadius: 8,
        maxBarThickness: 28,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: COLORS.muted, maxRotation: 45, minRotation: 25, font: { size: 10 } },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: COLORS.muted, precision: 0 },
          grid: { color: COLORS.grid },
        },
      },
    },
  });
}

function renderRecargasChart(data) {
  destroyChart("recargas");
  if (typeof Chart === "undefined") return;
  const months = {};
  data.filter((e) => e.validadeRecarga === "Válido").forEach((e) => {
    const d = parseDate(e.proximaRecarga);
    if (!d) return;
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    months[key] = (months[key] || 0) + 1;
  });
  const labels = Object.keys(months).sort((a, b) => {
    const [ma, ya] = a.split("/").map(Number);
    const [mb, yb] = b.split("/").map(Number);
    return ya !== yb ? ya - yb : ma - mb;
  });

  charts.recargas = new Chart(document.getElementById("chartRecargas"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: labels.map((l) => months[l]),
        borderColor: COLORS.orange,
        backgroundColor: "rgba(255,122,0,0.18)",
        fill: true,
        tension: 0.35,
        pointBackgroundColor: COLORS.orange,
        pointRadius: 4,
        borderWidth: 2.5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: COLORS.muted, font: { size: 10 } }, grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { color: COLORS.muted, precision: 0 },
          grid: { color: COLORS.grid },
        },
      },
    },
  });
}

function renderVencidosList(data) {
  const vencidos = data.filter((e) => e.validadeRecarga === "Vencido").slice(0, 6);
  document.getElementById("vencidosList").innerHTML = vencidos.length
    ? vencidos.map((e) => `
      <li class="tx-item">
        <div class="tx-icon"><i class="fa-solid fa-fire-extinguisher"></i></div>
        <div class="tx-meta">
          <strong>#${e.num} · ${e.local}</strong>
          <span>${e.dpto} · Pó ABC ${e.cargaKg} kg · ${money(custoRecarga(e))}</span>
        </div>
        <div class="tx-amount">
          <strong>${money(custoRecarga(e))}</strong>
          <span>Para recarga</span>
        </div>
      </li>`).join("")
    : '<li class="tx-item"><div class="tx-meta"><strong>Nenhum extintor para recarga no filtro atual</strong></div></li>';
}

function renderGoals(data) {
  const dptos = [...new Set(data.map((e) => e.dpto))].sort();
  document.getElementById("goalList").innerHTML = dptos.map((d) => {
    const items = data.filter((e) => e.dpto === d);
    const ok = items.filter((e) => e.validadeRecarga === "Válido").length;
    const pct = items.length ? Math.round((ok / items.length) * 100) : 0;
    return `
      <li class="goal-item">
        <div class="goal-top">
          <strong>${d}</strong>
          <span>${ok}/${items.length} · ${pct}%</span>
        </div>
        <div class="progress"><i style="width:${pct}%"></i></div>
      </li>`;
  }).join("");
}

function updateInsight(data) {
  const total = data.length;
  const validos = data.filter((e) => e.validadeRecarga === "Válido").length;
  const vencidos = total - validos;
  const taxa = total ? Math.round((validos / total) * 100) : 0;
  const year = new Date().getFullYear();
  const custos = buildCustos(year);
  document.getElementById("insightText").textContent =
    `Inventário com ${total} extintores ativos · ${validos} em dia e ${vencidos} para recarga. Conformidade ${taxa}% (meta 100%). Custo urgente ${money(custos.urgente)} · previsão ${year}: ${money(custos.anual)}.`;
  document.getElementById("insightStamp").textContent = `Atualizado · ${formatDateBR(new Date())}`;
}

function refreshDashboard() {
  const data = filtered();
  updateKPIs(data);
  renderStatusChart(data);
  renderLocaisChart(data);
  renderRecargasChart(data);
  renderVencidosList(data);
  renderGoals(data);
  updateInsight(data);
}

function renderTable() {
  const data = filtered().slice().sort((a, b) => a.num - b.num);
  document.getElementById("tableBody").innerHTML = data.map((e) => {
    const th = applyValidadeTH(e);
    return `
    <tr>
      <td>${e.num}</td>
      <td>${e.local}</td>
      <td>${e.dpto}</td>
      <td>${normalizeTipo(e.tipo)}</td>
      <td>${e.cargaKg} kg</td>
      <td>${e.dataRecarga || "—"}</td>
      <td><span class="status-pill ${e.validadeRecarga === "Válido" ? "valido" : "vencido"}">${e.validadeRecarga === "Válido" ? "Válido" : "Para recarga"}</span></td>
      <td>${e.proximaRecarga || "—"}</td>
      <td>${th.dataUltimoTH || "Sem ensaio"}</td>
      <td><span class="status-pill ${th.statusTH === "Válido" ? "valido" : "vencido"}">${th.statusTH}</span></td>
      <td>${th.proximoTH || "—"}</td>
    </tr>`;
  }).join("");
}

function renderLocaisPage() {
  const map = {};
  EXTINTORES.forEach((e) => {
    if (!map[e.local]) map[e.local] = [];
    map[e.local].push(e);
  });
  document.getElementById("localCards").innerHTML = Object.keys(map).sort().map((local) => {
    const items = map[local];
    const ok = items.filter((e) => e.validadeRecarga === "Válido").length;
    return `
      <article class="local-card">
        <h3>${local}</h3>
        <p class="muted">${items[0].dpto} · ${items.length} extintores</p>
        <div class="local-stats">
          <div class="local-stat"><span>Total</span><strong>${items.length}</strong></div>
          <div class="local-stat"><span>Válidos</span><strong>${ok}</strong></div>
          <div class="local-stat"><span>Vencidos</span><strong>${items.length - ok}</strong></div>
        </div>
      </article>`;
  }).join("");
}

function renderVencimentosPage() {
  const vencidos = EXTINTORES.filter((e) => e.validadeRecarga === "Vencido");
  const th = EXTINTORES.filter((e) => e.statusTH === "Vencido");
  const now = new Date();
  const in90 = EXTINTORES.filter((e) => {
    if (e.validadeRecarga !== "Válido") return false;
    const d = parseDate(e.proximaRecarga);
    if (!d) return false;
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  });

  document.getElementById("vencNow").textContent = vencidos.length;
  document.getElementById("thVencidos").textContent = th.length;
  document.getElementById("prox90").textContent = in90.length;
  document.getElementById("vencTableBody").innerHTML = [...vencidos]
    .sort((a, b) => a.num - b.num)
    .map((e) => `
    <tr>
      <td>${e.num}</td>
      <td>${e.local}</td>
      <td>${e.dpto}</td>
      <td>${e.cargaKg} kg</td>
      <td><span class="status-pill vencido">${e.validadeRecarga}</span></td>
      <td>${e.proximaRecarga}</td>
      <td><span class="status-pill ${e.statusTH === "Válido" ? "valido" : "vencido"}">${e.statusTH}</span></td>
    </tr>`).join("");
}

function renderDepartamentosPage() {
  const map = {};
  EXTINTORES.forEach((e) => {
    if (!map[e.dpto]) map[e.dpto] = [];
    map[e.dpto].push(e);
  });
  document.getElementById("dptoCards").innerHTML = Object.keys(map).sort().map((d) => {
    const items = map[d];
    const ok = items.filter((e) => e.validadeRecarga === "Válido").length;
    return `
      <article class="local-card">
        <h3>${d}</h3>
        <p class="muted">${items.length} extintores · ${Math.round((ok / items.length) * 100)}% conformidade</p>
        <div class="local-stats">
          <div class="local-stat"><span>Total</span><strong>${items.length}</strong></div>
          <div class="local-stat"><span>Válidos</span><strong>${ok}</strong></div>
          <div class="local-stat"><span>Vencidos</span><strong>${items.length - ok}</strong></div>
        </div>
      </article>`;
  }).join("");

  destroyChart("dpto");
  if (typeof Chart === "undefined") return;
  const labels = Object.keys(map).sort();
  charts.dpto = new Chart(document.getElementById("chartDpto"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Válidos",
          data: labels.map((d) => map[d].filter((e) => e.validadeRecarga === "Válido").length),
          backgroundColor: COLORS.orange,
          borderRadius: 8,
        },
        {
          label: "Vencidos",
          data: labels.map((d) => map[d].filter((e) => e.validadeRecarga === "Vencido").length),
          backgroundColor: COLORS.red,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: COLORS.muted } } },
      scales: {
        x: { stacked: true, ticks: { color: COLORS.muted }, grid: { display: false } },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { color: COLORS.muted, precision: 0 },
          grid: { color: COLORS.grid },
        },
      },
    },
  });
}

function dueDate(status, nextDate) {
  const now = new Date();
  if (status === "Vencido") return new Date(now.getFullYear(), now.getMonth(), 1);
  return parseDate(nextDate);
}

function buildCustos(year) {
  const now = new Date();
  const monthNow = now.getMonth();
  const rows = EXTINTORES.map((e) => {
    const recargaValor = custoRecarga(e);
    const thValor = custoTH(e);
    const recargaDue = dueDate(e.validadeRecarga, e.proximaRecarga);
    const thDue = dueDate(e.statusTH, e.proximoTH);
    const recargaNoAno = recargaDue && recargaDue.getFullYear() === year;
    const thNoAno = thDue && thDue.getFullYear() === year;
    const recargaMes = recargaNoAno ? recargaDue.getMonth() : null;
    const thMes = thNoAno ? thDue.getMonth() : null;
    const urgenteRecarga = e.validadeRecarga === "Vencido";
    const urgenteTH = e.statusTH === "Vencido";
    const total = (recargaNoAno ? recargaValor : 0) + (thNoAno ? thValor : 0);
    let quando = "—";
    if (urgenteRecarga || urgenteTH) quando = "Urgente";
    else if (recargaDue) quando = recargaDue.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    return {
      e,
      recargaValor,
      thValor: thNoAno ? thValor : 0,
      recargaNoAno,
      thNoAno,
      recargaMes,
      thMes,
      urgenteRecarga,
      urgenteTH,
      total,
      quando,
    };
  });

  const mensal = Array(12).fill(0);
  rows.forEach((r) => {
    if (r.recargaNoAno) mensal[r.recargaMes] += r.recargaValor;
    if (r.thNoAno) mensal[r.thMes] += r.thValor;
  });

  const porDpto = {};
  rows.forEach((r) => {
    if (!porDpto[r.e.dpto]) porDpto[r.e.dpto] = 0;
    porDpto[r.e.dpto] += r.total;
  });

  const urgente = rows
    .filter((r) => r.urgenteRecarga || r.urgenteTH)
      .reduce((s, r) => s + (r.urgenteRecarga ? r.recargaValor : 0) + (r.urgenteTH ? custoTH(r.e) : 0), 0);

  const sorted = rows.slice().sort((a, b) => Number(a.e.num) - Number(b.e.num));
  const rowsNoAno = sorted.filter((r) => r.total > 0 || r.urgenteRecarga || r.urgenteTH);

  return {
    rows: sorted,
    rowsNoAno,
    mensal,
    porDpto,
    anual: rows.reduce((s, r) => s + r.total, 0),
    mesAtual: mensal[monthNow] || 0,
    urgente,
    urgenteQtd: rows.filter((r) => r.urgenteRecarga).length,
  };
}

function selectedYear() {
  const el = document.getElementById("orcYear");
  return el && el.value ? Number(el.value) : new Date().getFullYear();
}

function nextProjectionYear() {
  return new Date().getFullYear() + 1;
}

/** Empurra a data para cair no ano-alvo (ciclo anual ou de N anos). */
function dateInTargetYear(date, year, stepYears = 1) {
  if (!date) return null;
  let d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let guard = 0;
  while (d.getFullYear() < year && guard < 20) {
    d = new Date(d.getFullYear() + stepYears, d.getMonth(), d.getDate());
    guard += 1;
  }
  return d.getFullYear() === year ? d : null;
}

function buildProjecao(year) {
  const mensal = Array(12).fill(0);
  const qtdMes = Array(12).fill(0);
  const porDpto = {};
  const porTipo = {};
  const rows = [];

  EXTINTORES.forEach((e) => {
    const item = applyValidadeTH({ ...e, tipo: normalizeTipo(e.tipo) });
    let baseRecarga = parseDate(item.proximaRecarga);
    if (!baseRecarga || item.validadeRecarga === "Vencido") {
      baseRecarga = new Date();
    }
    const recargaDate = dateInTargetYear(baseRecarga, year, 1);
    const thBase = parseDate(item.proximoTH);
    const thDate = thBase ? dateInTargetYear(thBase, year, 5) : null;

    const recargaValor = recargaDate ? custoRecarga(item) : 0;
    const thValor = thDate ? custoTH(item) : 0;
    if (!recargaDate && !thDate) return;

    if (recargaDate) {
      mensal[recargaDate.getMonth()] += recargaValor;
      qtdMes[recargaDate.getMonth()] += 1;
      const tipo = normalizeTipo(item.tipo);
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    }
    if (thDate) mensal[thDate.getMonth()] += thValor;

    const total = recargaValor + thValor;
    const dpto = item.dpto || "—";
    porDpto[dpto] = (porDpto[dpto] || 0) + total;

    rows.push({
      e: item,
      recargaDate,
      thDate,
      recargaValor,
      thValor,
      total,
    });
  });

  rows.sort((a, b) => Number(a.e.num) - Number(b.e.num));
  const picoIdx = mensal.reduce((best, val, idx, arr) => (val > arr[best] ? idx : best), 0);
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return {
    year,
    rows,
    mensal,
    qtdMes,
    porDpto,
    porTipo,
    recargasQtd: rows.filter((r) => r.recargaDate).length,
    thQtd: rows.filter((r) => r.thDate).length,
    anual: rows.reduce((s, r) => s + r.total, 0),
    picoMes: mensal[picoIdx] > 0 ? meses[picoIdx] : "—",
    picoValor: mensal[picoIdx] || 0,
  };
}

function renderProjecao() {
  const year = nextProjectionYear();
  const proj = buildProjecao(year);
  const title = document.getElementById("projTitle");
  const sub = document.getElementById("projSub");
  if (title) title.textContent = `Projeção ${year}`;
  if (sub) {
    sub.textContent = `Planejamento de recargas e testes hidrostáticos para ${year}`;
  }

  document.getElementById("projKpiRecargas").textContent = proj.recargasQtd;
  document.getElementById("projKpiRecargasTrend").textContent =
    `${proj.recargasQtd} de ${EXTINTORES.length} extintores`;
  document.getElementById("projKpiTh").textContent = proj.thQtd;
  document.getElementById("projKpiThTrend").textContent = proj.thQtd
    ? "Ensaios no ciclo de 5 anos"
    : "Nenhum TH neste ano";
  document.getElementById("projKpiCusto").textContent = money(proj.anual);
  document.getElementById("projKpiCustoTrend").textContent = `Preços atuais · ${year}`;
  document.getElementById("projKpiPico").textContent = proj.picoMes;
  document.getElementById("projKpiPicoTrend").textContent =
    proj.picoValor > 0 ? money(proj.picoValor) : "Sem pico";

  document.getElementById("projInsight").textContent =
    `Em ${year} estão previstas ${proj.recargasQtd} recargas e ${proj.thQtd} testes hidrostáticos, ` +
    `com custo estimado de ${money(proj.anual)}. Mês de maior demanda: ${proj.picoMes}.`;
  document.getElementById("projStamp").textContent =
    `Projeção gerada · ${formatDateBR(new Date())}`;

  document.getElementById("projTopList").innerHTML = proj.rows
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map(
      (r) => `
      <li class="tx-item">
        <div class="tx-meta">
          <strong>Nº ${r.e.num} · ${r.e.local}</strong>
          <small>${r.e.dpto} · ${normalizeTipo(r.e.tipo)} ${r.e.cargaKg} kg</small>
        </div>
        <div class="tx-amount">
          <strong>${money(r.total)}</strong>
          <span>${r.recargaDate ? r.recargaDate.toLocaleDateString("pt-BR", { month: "short" }) : "TH"}</span>
        </div>
      </li>`
    )
    .join("") || '<li class="tx-item"><div class="tx-meta"><strong>Sem itens projetados</strong></div></li>';

  const tipoEntries = Object.entries(proj.porTipo).sort((a, b) => b[1] - a[1]);
  const tipoMax = Math.max(1, ...tipoEntries.map(([, n]) => n));
  document.getElementById("projTipoList").innerHTML = tipoEntries.length
    ? tipoEntries
        .map(
          ([tipo, n]) => `
      <li class="goal-item">
        <div class="goal-top">
          <strong>${tipo}</strong>
          <span>${n} recargas</span>
        </div>
        <div class="progress"><i style="width:${Math.round((n / tipoMax) * 100)}%"></i></div>
      </li>`
        )
        .join("")
    : '<li class="goal-item"><div class="goal-top"><strong>Sem recargas</strong></div></li>';

  document.getElementById("projTableBody").innerHTML = proj.rows
    .map(
      (r) => `
      <tr>
        <td>${r.e.num}</td>
        <td>${r.e.local}</td>
        <td>${r.e.dpto}</td>
        <td>${normalizeTipo(r.e.tipo)}</td>
        <td>${r.e.cargaKg} kg</td>
        <td>${r.recargaDate ? formatDateInput(r.recargaDate) : "—"}</td>
        <td>${r.recargaDate ? money(r.recargaValor) : "—"}</td>
        <td>${r.thDate ? formatDateInput(r.thDate) : "—"}</td>
        <td>${r.thDate ? money(r.thValor) : "—"}</td>
        <td><strong>${money(r.total)}</strong></td>
      </tr>`
    )
    .join("");

  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  destroyChart("projMes");
  destroyChart("projDpto");
  destroyChart("projQtd");
  if (typeof Chart === "undefined") return;

  charts.projMes = new Chart(document.getElementById("chartProjMes"), {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        {
          label: "Custo (R$)",
          data: proj.mensal,
          backgroundColor: COLORS.orange,
          borderRadius: 8,
          maxBarThickness: 28,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => money(ctx.parsed.y) } },
      },
      scales: {
        x: { ticks: { color: COLORS.muted }, grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { color: COLORS.muted, callback: (v) => `R$ ${v}` },
          grid: { color: COLORS.grid },
        },
      },
    },
  });

  const dptoLabels = Object.keys(proj.porDpto).sort();
  charts.projDpto = new Chart(document.getElementById("chartProjDpto"), {
    type: "bar",
    data: {
      labels: dptoLabels,
      datasets: [
        {
          label: "Custo (R$)",
          data: dptoLabels.map((d) => proj.porDpto[d]),
          backgroundColor: COLORS.orange,
          borderRadius: 8,
          maxBarThickness: 42,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => money(ctx.parsed.x) } },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: COLORS.muted, callback: (v) => `R$ ${v}` },
          grid: { color: COLORS.grid },
        },
        y: { ticks: { color: COLORS.muted }, grid: { display: false } },
      },
    },
  });

  charts.projQtd = new Chart(document.getElementById("chartProjQtd"), {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        {
          label: "Recargas",
          data: proj.qtdMes,
          backgroundColor: "rgba(255,122,0,0.55)",
          borderRadius: 8,
          maxBarThickness: 28,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: COLORS.muted }, grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { color: COLORS.muted, precision: 0 },
          grid: { color: COLORS.grid },
        },
      },
    },
  });
}

function exportProjecaoCSV() {
  const year = nextProjectionYear();
  const proj = buildProjecao(year);
  const header = "num;local;dpto;tipo;cargaKg;dataRecarga;custoRecarga;dataTH;custoTH;total";
  const lines = proj.rows.map((r) =>
    [
      r.e.num,
      r.e.local,
      r.e.dpto,
      normalizeTipo(r.e.tipo),
      r.e.cargaKg,
      r.recargaDate ? formatDateInput(r.recargaDate) : "",
      r.recargaValor,
      r.thDate ? formatDateInput(r.thDate) : "",
      r.thValor,
      r.total,
    ]
      .map(csvEscape)
      .join(";")
  );
  downloadBlob(
    "\uFEFF" + [header, ...lines].join("\n"),
    `projecao-extintores-${year}.csv`,
    "text/csv;charset=utf-8;"
  );
}

function renderOrcamento() {
  const year = selectedYear();
  const custos = buildCustos(year);
  const saldo = Number(PRECOS.orcamentoAnual || 0) - custos.anual;
  const mesNome = new Date().toLocaleDateString("pt-BR", { month: "long" });

  document.getElementById("orcUrgente").textContent = money(custos.urgente);
  document.getElementById("orcUrgenteQtd").textContent = `${custos.urgenteQtd} recargas vencidas`;
  document.getElementById("orcMes").textContent = money(custos.mesAtual);
  document.getElementById("orcMesLabel").textContent = mesNome;
  document.getElementById("orcAno").textContent = money(custos.anual);
  document.getElementById("orcAnoDetalhe").textContent =
    `${custos.rowsNoAno.length} com custo em ${year} · ${custos.rows.length} no inventário`;
  document.getElementById("orcSaldo").textContent = money(saldo);
  const saldoEl = document.getElementById("orcSaldoTrend");
  saldoEl.textContent = saldo >= 0 ? "Dentro do orçamento" : "Estouro orçamentário";
  saldoEl.className = `kpi-trend ${saldo >= 0 ? "up" : "down"}`;

  renderPriceForms();
  const orcAnual = document.getElementById("orcamentoAnual");
  if (orcAnual) orcAnual.value = PRECOS.orcamentoAnual;

  document.getElementById("orcTableBody").innerHTML = custos.rows
    .map((r) => {
      const foraDoAno = !r.recargaNoAno && !r.thNoAno && !r.urgenteRecarga && !r.urgenteTH;
      const statusLabel = r.urgenteRecarga
        ? "Vencido"
        : foraDoAno
          ? "Fora do ano"
          : "Programado";
      const statusClass = r.urgenteRecarga ? "vencido" : foraDoAno ? "neutro" : "valido";
      return `
      <tr>
        <td>${r.e.num}</td>
        <td>${r.e.local}</td>
        <td>${r.e.dpto}</td>
        <td>${r.e.cargaKg} kg</td>
        <td>${r.recargaNoAno || r.urgenteRecarga ? money(r.recargaValor) : "—"}</td>
        <td>${r.thNoAno || r.urgenteTH ? money(r.thValor || custoTH(r.e)) : "—"}</td>
        <td><strong>${money(r.total)}</strong></td>
        <td>${r.quando}</td>
        <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
      </tr>`;
    })
    .join("");

  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  destroyChart("orcMes");
  destroyChart("orcDpto");
  if (typeof Chart === "undefined") return;

  charts.orcMes = new Chart(document.getElementById("chartOrcMes"), {
    type: "bar",
    data: {
      labels: meses,
      datasets: [{
        label: "Custo (R$)",
        data: custos.mensal,
        backgroundColor: COLORS.orange,
        borderRadius: 8,
        maxBarThickness: 28,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => money(ctx.parsed.y) } },
      },
      scales: {
        x: { ticks: { color: COLORS.muted }, grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { color: COLORS.muted, callback: (v) => `R$ ${v}` },
          grid: { color: COLORS.grid },
        },
      },
    },
  });

  const dptoLabels = Object.keys(custos.porDpto).sort();
  charts.orcDpto = new Chart(document.getElementById("chartOrcDpto"), {
    type: "bar",
    data: {
      labels: dptoLabels,
      datasets: [{
        label: "Custo (R$)",
        data: dptoLabels.map((d) => custos.porDpto[d]),
        backgroundColor: COLORS.orange,
        borderRadius: 8,
        maxBarThickness: 42,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => money(ctx.parsed.x) } },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: COLORS.muted, callback: (v) => `R$ ${v}` },
          grid: { color: COLORS.grid },
        },
        y: { ticks: { color: COLORS.muted }, grid: { display: false } },
      },
    },
  });
}

function priceFormHtml() {
  const tiposPreco = [...new Set([...TIPOS, ...EXTINTORES.map((e) => normalizeTipo(e.tipo))])];
  return tiposPreco.map((tipo) => {
    const cargasTipo = PRECOS.recargaPorTipo?.[tipo] || {};
    const usadas = EXTINTORES.filter((e) => normalizeTipo(e.tipo) === tipo).map((e) => String(e.cargaKg));
    const kgs = [...new Set([...Object.keys(cargasTipo), ...usadas])].sort((a, b) => Number(a) - Number(b));
    const thVal = PRECOS.testeHidrostaticoPorTipo?.[tipo] ?? PRECOS.testeHidrostatico;
    return `
      <div class="price-tipo-block">
        <h3>${tipo}</h3>
        <div class="price-grid">
          ${kgs.map((kg) => `
            <div class="price-item">
              <label>Recarga ${kg} kg (R$)</label>
              <input type="number" min="0" step="0.01" data-tipo="${tipo}" data-carga="${kg}" value="${cargasTipo[kg] ?? ""}" />
            </div>`).join("")}
          <div class="price-item">
            <label>Teste hidrostático (R$)</label>
            <input type="number" min="0" step="0.01" data-th-tipo="${tipo}" value="${thVal}" />
          </div>
        </div>
      </div>`;
  }).join("");
}

function renderPriceForms() {
  const html = priceFormHtml();
  ["priceTipoWrap", "pricePageWrap"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
  const anual = PRECOS.orcamentoAnual ?? "";
  const a1 = document.getElementById("orcamentoAnual");
  const a2 = document.getElementById("orcamentoAnualPage");
  if (a1) a1.value = anual;
  if (a2) a2.value = anual;
  const tipoSel = document.getElementById("newPrecoTipo");
  if (tipoSel && !tipoSel.dataset.ready) {
    TIPOS.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      tipoSel.appendChild(opt);
    });
    tipoSel.dataset.ready = "1";
  }
}

function renderPrecosPage() {
  renderPriceForms();
}

function savePrecosFromForm() {
  if (!PRECOS.recargaPorTipo) PRECOS.recargaPorTipo = {};
  if (!PRECOS.testeHidrostaticoPorTipo) PRECOS.testeHidrostaticoPorTipo = {};
  document.querySelectorAll("input[data-tipo][data-carga]").forEach((input) => {
    const tipo = input.dataset.tipo;
    if (!PRECOS.recargaPorTipo[tipo]) PRECOS.recargaPorTipo[tipo] = {};
    PRECOS.recargaPorTipo[tipo][input.dataset.carga] = Number(input.value || 0);
    PRECOS.recarga[input.dataset.carga] = Number(input.value || 0);
  });
  document.querySelectorAll("input[data-th-tipo]").forEach((input) => {
    PRECOS.testeHidrostaticoPorTipo[input.dataset.thTipo] = Number(input.value || 0);
  });
  const anualEl = document.getElementById("orcamentoAnualPage") || document.getElementById("orcamentoAnual");
  if (anualEl) PRECOS.orcamentoAnual = Number(anualEl.value || 0);
  persist();
  renderPriceForms();
  const msg = document.getElementById("precoMsg");
  if (msg) {
    msg.hidden = false;
    msg.className = "import-msg ok";
    msg.textContent = "Valores de recarga e TH salvos. O orçamento já usa os novos preços.";
  }
}

function addPrecoRecarga() {
  const tipo = document.getElementById("newPrecoTipo")?.value;
  const carga = Number(document.getElementById("newPrecoCarga")?.value || 0);
  const valor = Number(document.getElementById("newPrecoValor")?.value || 0);
  if (!tipo || !carga) {
    alert("Informe o tipo e a carga (kg).");
    return;
  }
  if (!PRECOS.recargaPorTipo) PRECOS.recargaPorTipo = {};
  if (!PRECOS.recargaPorTipo[tipo]) PRECOS.recargaPorTipo[tipo] = {};
  PRECOS.recargaPorTipo[tipo][carga] = valor;
  PRECOS.recarga[carga] = valor;
  persist();
  document.getElementById("newPrecoCarga").value = "";
  document.getElementById("newPrecoValor").value = "";
  renderPriceForms();
}

function csvEscape(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function toCSV(rows) {
  const lines = [CSV_HEADER.join(";")];
  rows.forEach((e) => {
    lines.push(CSV_HEADER.map((k) => csvEscape(e[k])).join(";"));
  });
  return "\uFEFF" + lines.join("\n");
}

function downloadBlob(content, name, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, "").trim();
  const first = clean.split(/\r?\n/, 1)[0] || "";
  const sep = first.includes(";") ? ";" : ",";
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const split = (line) => {
    const out = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else q = !q;
      } else if (ch === sep && !q) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  const headers = split(lines[0]).map((h) => h.replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const cols = split(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return applyValidadeTH({
      num: Number(row.num || 0),
      local: row.local || "",
      dpto: row.dpto || "",
      tipo: row.tipo || "Pó químico ABC",
      cargaKg: Number(row.cargaKg || 0),
      dataRecarga: row.dataRecarga || "",
      validadeRecarga: row.validadeRecarga || "Válido",
      proximaRecarga: row.proximaRecarga || "",
      dataUltimoTH: row.dataUltimoTH || "",
      statusTH: row.statusTH || "Válido",
      proximoTH: row.proximoTH || null,
    });
  }).filter((r) => r.num || r.local);
}

function showImportMsg(text, ok) {
  const el = document.getElementById("importMsg");
  if (!el) return;
  el.hidden = false;
  el.textContent = text;
  el.className = `import-msg ${ok ? "ok" : "err"}`;
}

function renderDadosPage() {
  document.getElementById("dadosCount").textContent = `${EXTINTORES.length} registros`;
  document.getElementById("editTableBody").innerHTML = EXTINTORES
    .slice()
    .sort((a, b) => a.num - b.num)
    .map((e, idx) => `
      <tr data-idx="${idx}">
        <td><input class="edit-input" data-f="num" value="${e.num}" /></td>
        <td><input class="edit-input" data-f="local" value="${e.local}" /></td>
        <td><input class="edit-input" data-f="dpto" value="${e.dpto}" /></td>
        <td>
          <select class="edit-input" data-f="tipo">
            ${TIPOS.map((t) => `<option ${normalizeTipo(e.tipo) === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </td>
        <td><input class="edit-input" data-f="cargaKg" value="${e.cargaKg}" /></td>
        <td><input class="edit-input" data-f="dataRecarga" value="${e.dataRecarga || ""}" /></td>
        <td>
          <select class="edit-input" data-f="validadeRecarga">
            <option ${e.validadeRecarga === "Válido" ? "selected" : ""}>Válido</option>
            <option ${e.validadeRecarga === "Vencido" ? "selected" : ""}>Vencido</option>
          </select>
        </td>
        <td><input class="edit-input" data-f="proximaRecarga" value="${e.proximaRecarga || ""}" /></td>
        <td><input class="edit-input" data-f="dataUltimoTH" value="${e.dataUltimoTH || ""}" /></td>
        <td>
          <select class="edit-input" data-f="statusTH">
            <option ${e.statusTH === "Válido" ? "selected" : ""}>Válido</option>
            <option ${e.statusTH === "Vencido" ? "selected" : ""}>Vencido</option>
          </select>
        </td>
        <td><input class="edit-input" data-f="proximoTH" value="${e.proximoTH || ""}" /></td>
        <td><button type="button" class="btn-icon" data-del="${e.num}" title="Excluir"><i class="fa-solid fa-trash"></i></button></td>
      </tr>`).join("");
}

function collectEditTable() {
  return [...document.querySelectorAll("#editTableBody tr")].map((tr) => {
    const get = (f) => tr.querySelector(`[data-f="${f}"]`)?.value?.trim() || "";
    return applyValidadeTH({
      num: Number(get("num") || 0),
      local: get("local"),
      dpto: get("dpto"),
      tipo: get("tipo") || "Pó químico ABC",
      cargaKg: Number(get("cargaKg") || 0),
      dataRecarga: get("dataRecarga"),
      validadeRecarga: get("validadeRecarga"),
      proximaRecarga: get("proximaRecarga"),
      dataUltimoTH: get("dataUltimoTH"),
      statusTH: get("statusTH"),
      proximoTH: get("proximoTH") || null,
    });
  });
}

function saveDadosFromTable() {
  EXTINTORES = collectEditTable();
  persist({
    notifyUpdate: true,
    message: `Inventário salvo: ${EXTINTORES.length} extintores.`,
  });
  populateFilters();
  showImportMsg(`Inventário salvo: ${EXTINTORES.length} extintores.`, true);
  renderDadosPage();
}

function addRow() {
  const next = Math.max(0, ...EXTINTORES.map((e) => Number(e.num) || 0)) + 1;
  EXTINTORES.push({
    num: next,
    local: "",
    dpto: "",
    tipo: "Pó químico ABC",
    cargaKg: 6,
    dataRecarga: "",
    validadeRecarga: "Válido",
    proximaRecarga: "",
    dataUltimoTH: "",
    statusTH: "Válido",
    proximoTH: "",
  });
  renderDadosPage();
}

function fillSelect(el, values, emptyLabel, current) {
  if (!el) return;
  el.innerHTML = `<option value="">${emptyLabel}</option>`;
  values.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  });
  if (current) el.value = current;
}

function renderRecargasPage() {
  const year = new Date().getFullYear();
  const data = tipoRecargaFilter
    ? EXTINTORES.filter((e) => normalizeTipo(e.tipo) === tipoRecargaFilter)
    : EXTINTORES;
  const tipos = [...new Set(EXTINTORES.map((e) => normalizeTipo(e.tipo)))].sort();
  fillSelect(document.getElementById("filterTipoRecarga"), tipos, "Todos os tipos", tipoRecargaFilter);

  const validas = data.filter((e) => e.validadeRecarga === "Válido").length;
  const custoAno = data.reduce((s, e) => {
    const d = parseDate(e.proximaRecarga);
    return s + (d && d.getFullYear() === year ? custoRecarga(e) : 0);
  }, 0);

  document.getElementById("recKpiTipos").textContent = tipos.length;
  document.getElementById("recKpiValidas").textContent = `${validas}/${data.length}`;
  document.getElementById("recKpiCusto").textContent = money(custoAno);

  document.getElementById("tipoCards").innerHTML = tipos.map((tipo) => {
    const items = EXTINTORES.filter((e) => normalizeTipo(e.tipo) === tipo);
    const ok = items.filter((e) => e.validadeRecarga === "Válido").length;
    const cargas = [...new Set(items.map((e) => `${e.cargaKg} kg`))].join(", ");
    const custo = items.reduce((s, e) => s + custoRecarga(e), 0);
    return `
      <article class="local-card">
        <h3>${tipo}</h3>
        <p class="muted">${cargas || "sem carga"} · recarga unitária conforme kg</p>
        <div class="local-stats">
          <div class="local-stat"><span>Qtd</span><strong>${items.length}</strong></div>
          <div class="local-stat"><span>Válidas</span><strong>${ok}</strong></div>
          <div class="local-stat"><span>Custo total</span><strong>${money(custo)}</strong></div>
        </div>
      </article>`;
  }).join("");

  document.getElementById("recargaTableBody").innerHTML = data
    .slice()
    .sort((a, b) => a.num - b.num)
    .map((e) => `
      <tr>
        <td>${e.num}</td>
        <td>${normalizeTipo(e.tipo)}</td>
        <td>${e.cargaKg} kg</td>
        <td>${e.local}</td>
        <td>${e.dpto}</td>
        <td>${e.dataRecarga || "—"}</td>
        <td><span class="status-pill ${e.validadeRecarga === "Válido" ? "valido" : "vencido"}">${e.validadeRecarga}</span></td>
        <td>${e.proximaRecarga || "—"}</td>
        <td><strong>${money(custoRecarga(e))}</strong></td>
      </tr>`).join("");

  destroyChart("tipos");
  destroyChart("tipoCusto");
  if (typeof Chart === "undefined") return;
  const labels = tipos;
  charts.tipos = new Chart(document.getElementById("chartTipos"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: labels.map((t) => EXTINTORES.filter((e) => normalizeTipo(e.tipo) === t).length),
        backgroundColor: COLORS.orange,
        borderRadius: 8,
        maxBarThickness: 42,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: COLORS.muted }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: COLORS.muted, precision: 0 }, grid: { color: COLORS.grid } },
      },
    },
  });
  charts.tipoCusto = new Chart(document.getElementById("chartTipoCusto"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: labels.map((t) =>
          EXTINTORES.filter((e) => normalizeTipo(e.tipo) === t).reduce((s, e) => s + custoRecarga(e), 0)
        ),
        backgroundColor: COLORS.orange,
        borderRadius: 8,
        maxBarThickness: 42,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => money(ctx.parsed.y) } },
      },
      scales: {
        x: { ticks: { color: COLORS.muted }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: COLORS.muted, callback: (v) => `R$ ${v}` }, grid: { color: COLORS.grid } },
      },
    },
  });
}

function renderThPage() {
  const year = new Date().getFullYear();
  const now = new Date();
  const data = thStatusFilter
    ? EXTINTORES.filter((e) => e.statusTH === thStatusFilter)
    : EXTINTORES;
  const validos = EXTINTORES.filter((e) => e.statusTH === "Válido").length;
  const vencidos = EXTINTORES.filter((e) => e.statusTH === "Vencido").length;
  const in12 = EXTINTORES.filter((e) => {
    const d = parseDate(e.proximoTH);
    if (!d) return false;
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 365;
  }).length;
  const custoAno = EXTINTORES.reduce((s, e) => {
    const d = parseDate(e.proximoTH);
    const dueNow = e.statusTH === "Vencido";
    return s + ((dueNow || (d && d.getFullYear() === year)) ? custoTH(e) : 0);
  }, 0);

  document.getElementById("thKpiValidos").textContent = validos;
  document.getElementById("thKpiValidosTrend").textContent =
    EXTINTORES.length ? `${Math.round((validos / EXTINTORES.length) * 100)}% conformidade TH` : "—";
  document.getElementById("thKpiVencidos").textContent = vencidos;
  document.getElementById("thKpiVencidosTrend").textContent = vencidos ? "Requer teste" : "Nenhum vencido";
  document.getElementById("thKpi12").textContent = in12;
  document.getElementById("thKpiCusto").textContent = money(custoAno);
  document.getElementById("thKpiCustoDetalhe").textContent = `${year}`;

  document.getElementById("thTableBody").innerHTML = data
    .slice()
    .sort((a, b) => a.num - b.num)
    .map((e) => `
      <tr>
        <td>${e.num}</td>
        <td>${normalizeTipo(e.tipo)}</td>
        <td>${e.cargaKg} kg</td>
        <td>${e.local}</td>
        <td>${e.dpto}</td>
        <td>${e.dataUltimoTH || "Sem ensaio"}</td>
        <td><span class="status-pill ${e.statusTH === "Válido" ? "valido" : "vencido"}">${e.statusTH === "Válido" ? "Válido" : "Vencido"}</span></td>
        <td>${e.proximoTH || "—"}</td>
        <td><strong>${money(custoTH(e))}</strong></td>
      </tr>`).join("");

  const months = {};
  EXTINTORES.forEach((e) => {
    const d = parseDate(e.proximoTH);
    if (!d) return;
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    months[key] = (months[key] || 0) + 1;
  });
  const agendaLabels = Object.keys(months).sort((a, b) => {
    const [ma, ya] = a.split("/").map(Number);
    const [mb, yb] = b.split("/").map(Number);
    return ya !== yb ? ya - yb : ma - mb;
  });
  const tipos = [...new Set(EXTINTORES.map((e) => normalizeTipo(e.tipo)))].sort();

  destroyChart("thAgenda");
  destroyChart("thTipo");
  if (typeof Chart === "undefined") return;
  charts.thAgenda = new Chart(document.getElementById("chartThAgenda"), {
    type: "bar",
    data: {
      labels: agendaLabels,
      datasets: [{
        data: agendaLabels.map((l) => months[l]),
        backgroundColor: COLORS.orange,
        borderRadius: 8,
        maxBarThickness: 28,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: COLORS.muted, maxRotation: 45, minRotation: 25, font: { size: 10 } }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: COLORS.muted, precision: 0 }, grid: { color: COLORS.grid } },
      },
    },
  });
  charts.thTipo = new Chart(document.getElementById("chartThTipo"), {
    type: "bar",
    data: {
      labels: tipos,
      datasets: [
        {
          label: "Válido",
          data: tipos.map((t) => EXTINTORES.filter((e) => normalizeTipo(e.tipo) === t && e.statusTH === "Válido").length),
          backgroundColor: COLORS.orange,
          borderRadius: 8,
        },
        {
          label: "Vencido",
          data: tipos.map((t) => EXTINTORES.filter((e) => normalizeTipo(e.tipo) === t && e.statusTH === "Vencido").length),
          backgroundColor: COLORS.red,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: COLORS.muted } } },
      scales: {
        x: { stacked: true, ticks: { color: COLORS.muted }, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, ticks: { color: COLORS.muted, precision: 0 }, grid: { color: COLORS.grid } },
      },
    },
  });
}

function renderRelatorios() {
  const total = EXTINTORES.length;
  const validos = EXTINTORES.filter((e) => e.validadeRecarga === "Válido").length;
  const vencidos = total - validos;
  const th = EXTINTORES.filter((e) => e.statusTH === "Vencido").length;
  const year = new Date().getFullYear();
  const custos = buildCustos(year);
  document.getElementById("reportSummary").textContent =
    `Relatório operacional e orçamentário. ${total} unidades no inventário.`;
  document.getElementById("reportBullets").innerHTML = `
    <li>Recargas válidas: ${validos} (${total ? Math.round((validos / total) * 100) : 0}%)</li>
    <li>Extintores para recarga: ${vencidos} · custo urgente ${money(custos.urgente)}</li>
    <li>Testes hidrostáticos vencidos: ${th}</li>
    <li>Previsão ${year}: ${money(custos.anual)} · orçamento ${money(PRECOS.orcamentoAnual)}</li>
    <li>Alimente os dados todo mês em “Alimentar dados” (Excel/CSV).</li>`;
}

function populateYearSelect() {
  const el = document.getElementById("orcYear");
  if (!el || el.dataset.ready) return;
  const y = new Date().getFullYear();
  [y - 1, y, y + 1, y + 2].forEach((n) => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    if (n === y) opt.selected = true;
    el.appendChild(opt);
  });
  el.dataset.ready = "1";
}

function populateFilters() {
  const dptoSelect = document.getElementById("filterDpto");
  const current = dptoSelect.value;
  dptoSelect.innerHTML = '<option value="">Todos os departamentos</option>';
  [...new Set(EXTINTORES.map((e) => e.dpto))].filter(Boolean).sort().forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    dptoSelect.appendChild(opt);
  });
  dptoSelect.value = current;

  const cargaSelect = document.getElementById("filterCarga");
  const curCarga = cargaSelect.value;
  cargaSelect.innerHTML = '<option value="">Todas as cargas</option>';
  [...new Set(EXTINTORES.map((e) => e.cargaKg))]
    .filter((c) => c !== "" && c != null)
    .sort((a, b) => a - b)
    .forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = `${c} kg`;
      cargaSelect.appendChild(opt);
    });
  cargaSelect.value = curCarga;

  const tipoSelect = document.getElementById("filterTipo");
  if (tipoSelect) {
    fillSelect(
      tipoSelect,
      [...new Set(EXTINTORES.map((e) => normalizeTipo(e.tipo)))].sort(),
      "Todos os tipos",
      tipoFilter
    );
  }
}


function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function syncChartTheme() {
  const light = getTheme() === "light";
  COLORS.muted = light ? "#71717a" : "#8b8b93";
  COLORS.grid = light ? "rgba(24,24,27,0.08)" : "rgba(255,255,255,0.06)";
  if (typeof Chart !== "undefined") Chart.defaults.color = COLORS.muted;
}

function updateThemeToggleUI() {
  const btn = document.getElementById("btnTheme");
  const icon = document.getElementById("themeIcon");
  if (!btn || !icon) return;
  const light = getTheme() === "light";
  icon.className = light ? "fa-solid fa-moon" : "fa-solid fa-sun";
  btn.title = light ? "Modo escuro" : "Modo claro";
  btn.setAttribute("aria-label", light ? "Ativar modo escuro" : "Ativar modo claro");
}

function applyTheme(theme, { refresh = true } = {}) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(STORAGE.theme, next);
  syncChartTheme();
  updateThemeToggleUI();
  if (refresh) navigate(currentPage);
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE.theme);
  applyTheme(saved === "light" ? "light" : "dark", { refresh: false });
}
function navigate(page) {
  currentPage = page;
  document.querySelectorAll(".page").forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add("active");
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page);
  });
  window.location.hash = page;

  if (page === "dashboard") refreshDashboard();
  if (page === "projecao") renderProjecao();
  if (page === "extintores") renderTable();
  if (page === "locais") renderLocaisPage();
  if (page === "vencimentos") renderVencimentosPage();
  if (page === "departamentos") renderDepartamentosPage();
  if (page === "recargas") renderRecargasPage();
  if (page === "th") renderThPage();
  if (page === "precos") renderPrecosPage();
  if (page === "orcamento") renderOrcamento();
  if (page === "dados") renderDadosPage();
  if (page === "relatorios") renderRelatorios();
  if (page === "configuracoes") {
    document.getElementById("cfgTotal").textContent = EXTINTORES.length;
    const upd = localStorage.getItem(STORAGE.updated);
    document.getElementById("cfgUpdated").textContent = upd
      ? formatDateBR(new Date(upd))
      : "Dados do PDF original";
    const cloud = window.FireBoardCloud;
    const cfgCloud = document.getElementById("cfgCloud");
    if (cfgCloud) {
      if (!cloud?.isConfigured?.()) cfgCloud.textContent = "Não configurado";
      else if (cloud.currentUser?.()) cfgCloud.textContent = `Online · ${cloud.currentUser().email}`;
      else cfgCloud.textContent = "Configurado · desconectado";
    }
    document.getElementById("cfgFonte").textContent =
      cloud?.isReady?.() && cloud.currentUser?.()
        ? "Firebase (compartilhado)"
        : localStorage.getItem(STORAGE.dados)
          ? "Planilha salva neste navegador"
          : "Controle de extintores.pdf";
  }
}

function exportCSV() {
  downloadBlob(toCSV(EXTINTORES), "controle-extintores.csv", "text/csv;charset=utf-8;");
}

const PRINT_TITLES = {
  dashboard: "Dashboard operacional",
  projecao: "Projeção do próximo ano",
  extintores: "Inventário de extintores",
  locais: "Extintores por local",
  vencimentos: "Vencimentos e prioridades",
  departamentos: "Conformidade por departamento",
  recargas: "Recargas por tipo",
  th: "Teste hidrostático",
  precos: "Valores de recarga",
  orcamento: "Orçamento",
  dados: "Alimentar dados",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};


function clearPrintFit() {
  const page = document.querySelector(".page.active");
  if (!page) return;
  page.style.transform = "";
  page.style.width = "";
  page.style.maxHeight = "";
}

function fitPrintToOnePage() {
  clearPrintFit();
  const page = document.querySelector(".page.active");
  if (!page) return;
  // Area util A4 paisagem (~277x190 mm) em px a 96dpi
  const maxW = 1040;
  const maxH = 690;
  const rect = page.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const scale = Math.min(1, maxW / rect.width, maxH / rect.height);
  if (scale < 0.995) {
    page.style.transformOrigin = "top left";
    page.style.transform = `scale(${scale})`;
    page.style.width = `${(100 / scale).toFixed(2)}%`;
  }
}

function printGestaoAVista() {
  const titleEl = document.getElementById("printPageTitle");
  const dateEl = document.getElementById("printDateStamp");
  if (titleEl) titleEl.textContent = PRINT_TITLES[currentPage] || "Painel FireBoard";
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  document.body.classList.add("is-printing");
  navigate(currentPage);
  requestAnimationFrame(() => {
    setTimeout(() => window.print(), 180);
  });
}

window.addEventListener("beforeprint", () => {
  const titleEl = document.getElementById("printPageTitle");
  const dateEl = document.getElementById("printDateStamp");
  if (titleEl) titleEl.textContent = PRINT_TITLES[currentPage] || "Painel FireBoard";
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  document.body.classList.add("is-printing");
});

window.addEventListener("afterprint", () => {
  document.body.classList.remove("is-printing");
});

function exportOrcamentoCSV() {
  const year = selectedYear();
  const custos = buildCustos(year);
  const header = "num;local;dpto;cargaKg;custoRecarga;custoTH;total;quando;status";
  const lines = custos.rows.map((r) =>
    [r.e.num, r.e.local, r.e.dpto, r.e.cargaKg, r.recargaValor, r.thValor, r.total, r.quando, r.urgenteRecarga ? "Vencido" : "Programado"]
      .map(csvEscape)
      .join(";")
  );
  downloadBlob("\uFEFF" + [header, ...lines].join("\n"), `orcamento-extintores-${year}.csv`, "text/csv;charset=utf-8;");
}

function bindNav() {
  const nav = document.getElementById("sidebarNav");
  if (!nav || nav.dataset.bound) return;
  nav.dataset.bound = "1";
  nav.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      const id = toggle.dataset.toggle;
      const group = document.getElementById(id);
      if (!group) return;
      const open = toggle.getAttribute("aria-expanded") !== "false";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      group.classList.toggle("collapsed", open);
      const chev = toggle.querySelector(".nav-chevron");
      if (chev) chev.textContent = open ? "▸" : "▾";
      return;
    }
    const item = e.target.closest(".nav-item[data-page]");
    if (!item) return;
    e.preventDefault();
    navigate(item.dataset.page);
  });

  document.querySelectorAll("[data-page]:not(.nav-item)").forEach((el) => {
    el.addEventListener("click", (e) => {
      const page = el.dataset.page;
      if (!page) return;
      e.preventDefault();
      navigate(page);
    });
  });
}

function bindEvents() {
  bindNav();

  document.getElementById("btnTheme")?.addEventListener("click", () => {
    applyTheme(getTheme() === "light" ? "dark" : "light");
  });

  document.getElementById("sideSearch").addEventListener("input", (e) => {
    searchTerm = e.target.value.trim();
    if (currentPage === "dashboard") refreshDashboard();
    if (currentPage === "extintores") renderTable();
  });

  document.getElementById("filterDpto").addEventListener("change", (e) => {
    dptoFilter = e.target.value;
    refreshDashboard();
  });

  document.getElementById("filterStatus").addEventListener("change", (e) => {
    statusFilter = e.target.value;
    renderTable();
  });

  document.getElementById("filterCarga").addEventListener("change", (e) => {
    cargaFilter = e.target.value;
    renderTable();
  });

  document.getElementById("filterTipo").addEventListener("change", (e) => {
    tipoFilter = e.target.value;
    renderTable();
  });

  document.getElementById("filterTipoRecarga").addEventListener("change", (e) => {
    tipoRecargaFilter = e.target.value;
    renderRecargasPage();
  });

  document.getElementById("filterThStatus").addEventListener("change", (e) => {
    thStatusFilter = e.target.value;
    renderThPage();
  });

  document.getElementById("btnRelatorio").addEventListener("click", () => navigate("relatorios"));
  document.getElementById("btnExport").addEventListener("click", exportCSV);
  document.getElementById("btnExportOrc").addEventListener("click", exportOrcamentoCSV);
  document.getElementById("btnExportProj")?.addEventListener("click", exportProjecaoCSV);
  document.getElementById("btnPrintProj")?.addEventListener("click", printGestaoAVista);
  document.getElementById("btnPrint")?.addEventListener("click", printGestaoAVista);
  bindAlertsUI();
  document.getElementById("orcYear").addEventListener("change", renderOrcamento);
  document.querySelectorAll(".js-save-precos").forEach((btn) => {
    btn.addEventListener("click", savePrecosFromForm);
  });
  document.getElementById("btnAddPreco")?.addEventListener("click", addPrecoRecarga);

  document.getElementById("btnDownloadTpl").addEventListener("click", exportCSV);
  document.getElementById("btnSaveDados").addEventListener("click", saveDadosFromTable);
  document.getElementById("btnAddRow").addEventListener("click", addRow);
  document.getElementById("btnResetDados").addEventListener("click", () => {
    if (!confirm("Restaurar os 69 registros do PDF original? Alterações não salvas em CSV serão perdidas.")) return;
    EXTINTORES = structuredClone(BASE_DATA);
    persist({
      notifyUpdate: true,
      message: "Dados restaurados a partir do PDF original.",
    });
    populateFilters();
    renderDadosPage();
    showImportMsg("Dados restaurados a partir do PDF original.", true);
  });

  document.getElementById("fileImport").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(String(reader.result || ""));
        if (!rows.length) {
          showImportMsg("Arquivo vazio ou formato inválido. Use o CSV baixado do painel.", false);
          return;
        }
        EXTINTORES = rows;
        persist({
          notifyUpdate: true,
          message: `Importados ${rows.length} extintores de ${file.name}.`,
        });
        populateFilters();
        renderDadosPage();
        showImportMsg(`Importados ${rows.length} extintores de ${file.name}. Clique em Salvar se for editar depois.`, true);
      } catch (err) {
        console.error(err);
        showImportMsg("Não foi possível ler a planilha. Salve no Excel como CSV (separado por ponto e vírgula).", false);
      }
      e.target.value = "";
    };
    reader.readAsText(file, "utf-8");
  });

  document.getElementById("editTableBody").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-del]");
    if (!btn) return;
    const num = Number(btn.dataset.del);
    EXTINTORES = EXTINTORES.filter((x) => Number(x.num) !== num);
    renderDadosPage();
    showImportMsg(`Extintor nº ${num} removido. Clique em Salvar alterações para gravar.`, true);
  });
}

async function loadData() {
  const cloud = window.FireBoardCloud;
  if (cloud?.isReady?.() && cloud.currentUser?.()) {
    try {
      const remote = await cloud.loadShared();
      if (remote?.extintores?.length) return remote.extintores;
    } catch (err) {
      console.warn("Falha ao ler nuvem, usando dados locais:", err);
    }
  }
  const saved = localStorage.getItem(STORAGE.dados);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      /* usa base */
    }
  }
  if (typeof window.EXTINTORES_DATA !== "undefined") {
    return window.EXTINTORES_DATA;
  }
  const res = await fetch("extintores.json");
  if (!res.ok) throw new Error("Falha ao carregar extintores.json");
  return res.json();
}

function waitForCloud() {
  if (window.FireBoardCloud) return Promise.resolve(window.FireBoardCloud);
  return new Promise((resolve) => {
    window.addEventListener("fireboard-cloud-ready", () => resolve(window.FireBoardCloud), {
      once: true,
    });
  });
}

async function bootstrapApp() {
  initTheme();
  if (typeof Chart !== "undefined") {
    Chart.defaults.font.family = '"Segoe UI", sans-serif';
    Chart.defaults.color = COLORS.muted;
  }

  bindNav();
  document.getElementById("todayDate").textContent = formatDateBR(new Date());
  populateYearSelect();

  try {
    const cloud = window.FireBoardCloud;
    let fromCloud = false;
    if (cloud?.isReady?.() && cloud.currentUser?.()) {
      try {
        const remote = await cloud.loadShared();
        if (remote?.extintores?.length) {
          const original =
            typeof window.EXTINTORES_DATA !== "undefined"
              ? window.EXTINTORES_DATA
              : remote.extintores;
          BASE_DATA = normalizeConformidade(structuredClone(original));
          EXTINTORES = remote.extintores.map((e) =>
            applyValidadeTH({ ...e, tipo: normalizeTipo(e.tipo) })
          );
          PRECOS = remote.precos ? mergePrecos(remote.precos) : loadPrecos();
          if (remote.updatedAt) localStorage.setItem(STORAGE.updated, remote.updatedAt);
          localStorage.setItem(STORAGE.dados, JSON.stringify(EXTINTORES));
          localStorage.setItem(STORAGE.precos, JSON.stringify(PRECOS));
          fromCloud = true;
        }
      } catch (err) {
        console.warn(err);
      }
    }

    if (!fromCloud) {
      const loaded = await loadData();
      const original = typeof window.EXTINTORES_DATA !== "undefined" ? window.EXTINTORES_DATA : loaded;
      const fromStorage = Boolean(localStorage.getItem(STORAGE.dados));
      BASE_DATA = normalizeConformidade(structuredClone(original));
      EXTINTORES = fromStorage
        ? structuredClone(loaded).map((e) => applyValidadeTH({ ...e, tipo: normalizeTipo(e.tipo) }))
        : normalizeConformidade(structuredClone(loaded));
      PRECOS = loadPrecos();
      if (cloud?.isReady?.() && cloud.currentUser?.()) {
        await cloud.saveShared({ extintores: EXTINTORES, precos: PRECOS });
      } else if (!fromStorage) {
        persist();
      }
    }
  } catch (err) {
    document.getElementById("insightText").textContent =
      "Não foi possível carregar os dados. Abra via servidor local (Live Server).";
    console.error(err);
    return;
  }

  populateFilters();
  bindEvents();

  const cloud = window.FireBoardCloud;
  if (cloud?.isReady?.() && cloud.currentUser?.()) {
    cloud.subscribe((data) => {
      if (!data?.extintores?.length) return;
      const same =
        JSON.stringify(data.extintores) === JSON.stringify(EXTINTORES) &&
        JSON.stringify(data.precos || {}) === JSON.stringify(PRECOS);
      if (same) return;
      applyCloudPayload(data);
      populateFilters();
      refreshCurrentView();
    });
  }

  const hash = window.location.hash.replace("#", "");
  const valid = [
    "dashboard",
    "projecao",
    "extintores",
    "locais",
    "vencimentos",
    "departamentos",
    "recargas",
    "th",
    "precos",
    "orcamento",
    "dados",
    "relatorios",
    "configuracoes",
  ];
  navigate(valid.includes(hash) ? hash : "dashboard");
}

let appStarted = false;

document.addEventListener("DOMContentLoaded", async () => {
  await waitForCloud();
  const cloud = window.FireBoardCloud;

  if (!cloud?.isConfigured?.()) {
    return;
  }

  window.addEventListener("fireboard-auth", async (ev) => {
    const user = ev.detail?.user;
    if (!user) {
      appStarted = false;
      return;
    }
    if (appStarted) return;
    appStarted = true;
    await bootstrapApp();
  });

  const user = await cloud.waitForAuth();
  if (user && !appStarted) {
    appStarted = true;
    await bootstrapApp();
  }
});
