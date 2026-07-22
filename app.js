const DISCIPLINAS = [
  { key: "matematica", label: "Matemática" },
  { key: "portugues", label: "Português" },
  { key: "historia", label: "História" },
  { key: "geografia", label: "Geografia" },
  { key: "biologia", label: "Biologia" },
  { key: "fisica", label: "Física" },
  { key: "quimica", label: "Química" },
];

const RAW_CSV = `id,nome,serie,turma,matematica,portugues,historia,geografia,biologia,fisica,quimica,media
1,Ana Souza,1º Ano,A,7.5,8.0,6.5,7.0,8.5,6.0,7.0,7.2
2,Bruno Lima,1º Ano,A,5.5,6.0,7.0,6.5,5.0,6.0,5.5,5.9
3,Carla Mendes,1º Ano,B,9.0,8.5,9.5,8.0,9.0,8.5,9.0,8.8
4,Diego Alves,1º Ano,B,4.0,5.5,6.0,5.0,4.5,5.0,4.0,4.9
5,Elena Costa,1º Ano,C,8.0,7.5,8.0,7.0,8.5,7.5,8.0,7.8
6,Felipe Rocha,1º Ano,C,6.5,7.0,6.0,7.5,6.5,6.0,7.0,6.6
7,Gabriela Nunes,2º Ano,A,9.5,9.0,8.5,9.0,9.5,9.0,8.5,9.0
8,Henrique Dias,2º Ano,A,5.0,4.5,6.0,5.5,5.0,4.0,5.5,5.1
9,Isabela Freitas,2º Ano,B,7.0,8.5,7.5,8.0,7.0,7.5,8.0,7.6
10,João Pereira,2º Ano,B,6.0,6.5,5.5,6.0,7.0,5.5,6.5,6.1
11,Karina Oliveira,2º Ano,C,8.5,9.0,8.0,8.5,9.0,8.0,8.5,8.5
12,Lucas Martins,2º Ano,C,3.5,4.0,5.0,4.5,3.0,4.0,3.5,3.9
13,Mariana Barbosa,3º Ano,A,9.0,8.0,9.0,8.5,9.5,8.5,9.0,8.8
14,Nicolas Teixeira,3º Ano,A,7.5,7.0,6.5,7.5,7.0,6.0,7.0,6.9
15,Olivia Ramos,3º Ano,B,8.0,8.5,7.5,8.0,8.0,7.5,8.5,7.9
16,Pedro Santos,3º Ano,B,5.5,6.5,6.0,5.0,6.0,5.5,6.5,5.9
17,Queila Ferreira,3º Ano,C,9.5,9.5,9.0,9.0,9.5,9.0,9.5,9.3
18,Rafael Gomes,1º Ano,A,6.0,5.5,7.0,6.5,6.0,5.0,6.0,6.0
19,Sofia Carvalho,1º Ano,B,8.5,8.0,8.5,9.0,8.0,8.5,8.0,8.4
20,Thiago Moreira,1º Ano,C,4.5,5.0,4.0,5.5,4.5,5.0,4.0,4.6
21,Úrsula Pinto,2º Ano,A,7.0,7.5,8.0,7.0,7.5,7.0,8.0,7.4
22,Vitor Azevedo,2º Ano,B,6.5,6.0,7.5,6.5,6.0,7.0,6.5,6.6
23,Wendy Castro,2º Ano,C,9.0,8.5,9.0,8.5,9.0,8.0,9.5,8.8
24,Xavier Melo,3º Ano,A,5.0,6.0,5.5,6.5,5.0,6.0,5.5,5.6
25,Yasmin Lopes,3º Ano,B,8.0,9.0,8.5,8.0,9.0,8.5,8.0,8.4
26,Zeca Andrade,3º Ano,C,7.5,7.0,7.5,8.0,7.0,7.5,7.0,7.4
27,Amanda Vieira,1º Ano,A,6.0,7.5,6.5,7.0,6.5,6.0,7.5,6.7
28,Bernardo Cruz,1º Ano,B,9.0,8.5,9.5,9.0,8.5,9.0,8.0,8.8
29,Camila Duarte,1º Ano,C,4.0,5.0,4.5,5.5,4.0,5.0,4.5,4.6
30,Daniel Borges,2º Ano,A,8.5,8.0,7.5,8.0,8.5,7.5,8.0,8.0
31,Eduarda Pires,2º Ano,B,7.0,6.5,7.0,6.0,7.5,6.5,7.0,6.8
32,Fernando Reis,2º Ano,C,5.5,5.0,6.0,5.5,5.0,6.5,5.5,5.6
33,Giovana Monteiro,3º Ano,A,9.5,9.0,9.5,9.0,9.0,9.5,9.0,9.2
34,Heitor Campos,3º Ano,B,6.5,7.0,6.0,7.5,6.5,7.0,6.0,6.6
35,Ingrid Batista,3º Ano,C,8.0,7.5,8.5,8.0,7.5,8.0,8.5,8.0
36,Júlio Cunha,1º Ano,A,3.0,4.5,5.0,4.0,3.5,4.0,3.0,3.9
37,Larissa Moura,1º Ano,B,7.5,8.0,7.0,8.5,7.5,8.0,7.0,7.6
38,Mateus Silveira,1º Ano,C,8.5,7.5,8.0,7.0,8.5,7.5,8.0,7.9
39,Natália Correia,2º Ano,A,6.0,6.5,5.5,6.0,6.5,5.5,6.0,6.0
40,Otávio Farias,2º Ano,B,9.0,9.5,8.5,9.0,9.5,9.0,8.5,9.0
41,Patrícia Nogueira,2º Ano,C,5.0,5.5,6.5,5.0,5.5,6.0,5.0,5.5
42,Renato Cardoso,3º Ano,A,7.0,8.0,7.5,7.0,8.0,7.5,7.0,7.4
43,Simone Araújo,3º Ano,B,8.5,8.0,9.0,8.5,8.0,8.5,9.0,8.5
44,Tales Ribeiro,3º Ano,C,4.5,5.5,4.0,5.0,4.5,5.5,4.0,4.7
45,Valentina Prado,1º Ano,A,9.0,8.5,9.0,8.0,9.5,8.5,9.0,8.8
46,Wagner Tavares,1º Ano,B,6.5,6.0,7.0,6.5,6.0,7.5,6.5,6.6
47,Ximena Guimarães,2º Ano,A,7.5,8.5,8.0,7.5,8.0,7.5,8.5,7.9
48,Yuri Fonseca,2º Ano,B,5.5,6.0,5.0,6.5,5.5,6.0,5.0,5.6
49,Zélia Machado,3º Ano,A,8.0,9.0,8.5,9.0,8.0,8.5,9.0,8.6
50,Arthur Peixoto,3º Ano,B,7.0,6.5,7.5,7.0,6.5,7.0,7.5,7.0`;

const COLORS = {
  blue: "#5c73db",
  green: "#05cd99",
  orange: "#ffb547",
  red: "#ee5d50",
  purple: "#7551ff",
};

const SERIES_COLORS = ["#5c73db", "#05cd99", "#ffb547"];
const STATUS_COLORS = {
  aprovado: "#05cd99",
  recuperacao: "#ffb547",
  reprovado: "#ee5d50",
};

const filters = {
  serie: "",
  turma: "",
  disciplina: "",
  status: "",
  search: "",
  alunoId: null,
};

let alunos = [];
let charts = {};
let currentPage = "dashboard";
let selectedTurma = null;
let turmaSerieFilter = "";

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i];
    });
    DISCIPLINAS.forEach((d) => {
      row[d.key] = Number(row[d.key]);
    });
    row.id = Number(row.id);
    row.media = Number(row.media);
    return row;
  });
}

function getNota(aluno) {
  if (filters.disciplina) return aluno[filters.disciplina];
  return aluno.media;
}

function getStatus(nota) {
  if (nota >= 6) return "aprovado";
  if (nota >= 4) return "recuperacao";
  return "reprovado";
}

function statusLabel(status) {
  return {
    aprovado: "Aprovado",
    recuperacao: "Recuperação",
    reprovado: "Reprovado",
  }[status];
}

function applyFilters(source = alunos) {
  return source.filter((a) => {
    if (filters.serie && a.serie !== filters.serie) return false;
    if (filters.turma && a.turma !== filters.turma) return false;
    if (filters.alunoId && a.id !== filters.alunoId) return false;
    if (filters.search && !a.nome.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    const status = getStatus(getNota(a));
    if (filters.status && status !== filters.status) return false;
    return true;
  });
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function destroyChart(key) {
  if (charts[key]) {
    charts[key].destroy();
    delete charts[key];
  }
}

function destroyCharts(keys) {
  if (!keys) {
    Object.keys(charts).forEach((k) => destroyChart(k));
    return;
  }
  keys.forEach(destroyChart);
}

function chartDefaults() {
  Chart.defaults.font.family = "Poppins";
  Chart.defaults.color = "#8f9bba";
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
}

function navigate(page, options = {}) {
  currentPage = page;

  document.querySelectorAll(".page").forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  if (page === "turmas") {
    if (options.openTurma) {
      selectedTurma = options.openTurma;
      showTurmaDetail(selectedTurma);
    } else if (!options.keepDetail) {
      selectedTurma = null;
      showTurmasOverview();
    }
  }

  renderPage(page);
  window.location.hash = page;
}

function renderPage(page) {
  if (page === "dashboard") refreshDashboard();
  if (page === "turmas" && !selectedTurma) renderTurmaCards();
  if (page === "alunos") renderAlunosPage();
  if (page === "disciplinas") renderDisciplinasPage();
  if (page === "avaliacoes") renderAvaliacoesPage();
  if (page === "configuracoes") {
    document.getElementById("configAlunosTotal").textContent = alunos.length;
  }
}

function updateKPIs(data) {
  const notas = data.map(getNota);
  const media = avg(notas);
  const aprovados = data.filter((a) => getStatus(getNota(a)) === "aprovado").length;
  const taxa = data.length ? (aprovados / data.length) * 100 : 0;

  let melhor = null;
  data.forEach((a) => {
    const n = getNota(a);
    if (!melhor || n > getNota(melhor)) melhor = a;
  });

  document.getElementById("kpiAlunos").textContent = data.length;
  document.getElementById("kpiMedia").textContent = data.length ? round1(media).toFixed(1) : "0.0";
  document.getElementById("kpiAprovacao").textContent = `${Math.round(taxa)}%`;
  document.getElementById("kpiMelhor").textContent = melhor ? round1(getNota(melhor)).toFixed(1) : "—";
  document.getElementById("kpiMelhorNome").textContent = melhor ? melhor.nome : "—";
}

function updateTable(data) {
  const sorted = [...data].sort((a, b) => getNota(b) - getNota(a));
  document.getElementById("tableBody").innerHTML = sorted
    .map((a) => {
      const nota = getNota(a);
      const status = getStatus(nota);
      return `<tr>
        <td>${a.nome}</td>
        <td>${a.serie}</td>
        <td>${a.turma}</td>
        <td class="media-cell">${round1(nota).toFixed(1)}</td>
        <td><span class="status-pill ${status}">${statusLabel(status)}</span></td>
      </tr>`;
    })
    .join("");
  document.getElementById("tableCount").textContent = `${data.length} registro${data.length === 1 ? "" : "s"}`;
}

function updateChips() {
  const chips = document.getElementById("activeChips");
  const items = [];

  if (filters.serie) items.push({ key: "serie", label: `Série: ${filters.serie}` });
  if (filters.turma) items.push({ key: "turma", label: `Turma: ${filters.turma}` });
  if (filters.disciplina) {
    const d = DISCIPLINAS.find((x) => x.key === filters.disciplina);
    items.push({ key: "disciplina", label: `Disciplina: ${d.label}` });
  }
  if (filters.status) items.push({ key: "status", label: `Situação: ${statusLabel(filters.status)}` });
  if (filters.alunoId) {
    const aluno = alunos.find((a) => a.id === filters.alunoId);
    if (aluno) items.push({ key: "alunoId", label: `Aluno: ${aluno.nome}` });
  }
  if (filters.search) items.push({ key: "search", label: `Busca: ${filters.search}` });

  if (!items.length) {
    chips.hidden = true;
    chips.innerHTML = "";
    return;
  }

  chips.hidden = false;
  chips.innerHTML = items
    .map(
      (item) => `<span class="chip">${item.label}
        <button type="button" data-clear="${item.key}" aria-label="Remover filtro">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </span>`
    )
    .join("");

  chips.querySelectorAll("button[data-clear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.clear;
      if (key === "alunoId") filters.alunoId = null;
      else filters[key] = "";
      if (key === "serie") document.getElementById("filterSerie").value = "";
      if (key === "turma") document.getElementById("filterTurma").value = "";
      if (key === "disciplina") document.getElementById("filterDisciplina").value = "";
      if (key === "status") document.getElementById("filterStatus").value = "";
      if (key === "search") document.getElementById("searchInput").value = "";
      refreshDashboard();
    });
  });
}

function createDashboardCharts(data) {
  destroyCharts(["disciplinas", "series", "turmas", "status", "top"]);

  const mediaDisc = DISCIPLINAS.map((d) => round1(avg(data.map((a) => a[d.key]))));
  const discBg = DISCIPLINAS.map((d) =>
    filters.disciplina && filters.disciplina !== d.key
      ? "rgba(92, 115, 219, 0.25)"
      : COLORS.blue
  );

  charts.disciplinas = new Chart(document.getElementById("chartDisciplinas"), {
    type: "bar",
    data: {
      labels: DISCIPLINAS.map((d) => d.label),
      datasets: [{
        label: "Média",
        data: mediaDisc,
        backgroundColor: discBg,
        borderRadius: 10,
        maxBarThickness: 42,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { afterBody: () => "Clique para filtrar por esta disciplina" } },
      },
      scales: {
        y: { beginAtZero: true, max: 10, grid: { color: "#eef2ff" } },
        x: { grid: { display: false } },
      },
      onClick: (_e, elements) => {
        if (!elements.length) return;
        const key = DISCIPLINAS[elements[0].index].key;
        filters.disciplina = filters.disciplina === key ? "" : key;
        document.getElementById("filterDisciplina").value = filters.disciplina;
        refreshDashboard();
      },
      onHover: (event, elements) => {
        event.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
    },
  });

  const seriesLabels = ["1º Ano", "2º Ano", "3º Ano"];
  charts.series = new Chart(document.getElementById("chartSeries"), {
    type: "doughnut",
    data: {
      labels: seriesLabels,
      datasets: [{
        data: seriesLabels.map((s) => data.filter((a) => a.serie === s).length),
        backgroundColor: SERIES_COLORS,
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: { afterBody: () => "Clique para filtrar por esta série" } },
      },
      onClick: (_e, elements) => {
        if (!elements.length) return;
        const value = seriesLabels[elements[0].index];
        filters.serie = filters.serie === value ? "" : value;
        document.getElementById("filterSerie").value = filters.serie;
        refreshDashboard();
      },
      onHover: (event, elements) => {
        event.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
    },
  });

  const turmas = ["A", "B", "C"];
  charts.turmas = new Chart(document.getElementById("chartTurmas"), {
    type: "bar",
    data: {
      labels: turmas.map((t) => `Turma ${t}`),
      datasets: [{
        label: "Média",
        data: turmas.map((t) => round1(avg(data.filter((a) => a.turma === t).map(getNota)))),
        backgroundColor: COLORS.green,
        borderRadius: 10,
        maxBarThickness: 56,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { afterBody: () => "Clique para ver detalhes das turmas" } },
      },
      scales: {
        y: { beginAtZero: true, max: 10, grid: { color: "#eef2ff" } },
        x: { grid: { display: false } },
      },
      onClick: (_e, elements) => {
        if (!elements.length) return;
        const letter = turmas[elements[0].index];
        if (filters.serie) {
          navigate("turmas", { openTurma: { serie: filters.serie, turma: letter } });
        } else {
          turmaSerieFilter = "";
          document.getElementById("turmaSerieFilter").value = "";
          navigate("turmas");
          setTimeout(() => highlightTurmaLetter(letter), 50);
        }
      },
      onHover: (event, elements) => {
        event.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
    },
  });

  const statusKeys = ["aprovado", "recuperacao", "reprovado"];
  charts.status = new Chart(document.getElementById("chartStatus"), {
    type: "doughnut",
    data: {
      labels: ["Aprovado", "Recuperação", "Reprovado"],
      datasets: [{
        data: statusKeys.map((s) => data.filter((a) => getStatus(getNota(a)) === s).length),
        backgroundColor: statusKeys.map((s) => STATUS_COLORS[s]),
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: { afterBody: () => "Clique para filtrar por esta situação" } },
      },
      onClick: (_e, elements) => {
        if (!elements.length) return;
        const value = statusKeys[elements[0].index];
        filters.status = filters.status === value ? "" : value;
        document.getElementById("filterStatus").value = filters.status;
        refreshDashboard();
      },
      onHover: (event, elements) => {
        event.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
    },
  });

  const top = [...data].sort((a, b) => getNota(b) - getNota(a)).slice(0, 8);
  charts.top = new Chart(document.getElementById("chartTop"), {
    type: "bar",
    data: {
      labels: top.map((a) => a.nome.split(" ")[0]),
      datasets: [{
        label: "Nota",
        data: top.map((a) => round1(getNota(a))),
        backgroundColor: top.map((a) =>
          filters.alunoId && filters.alunoId !== a.id
            ? "rgba(117, 81, 255, 0.25)"
            : COLORS.purple
        ),
        borderRadius: 8,
        maxBarThickness: 28,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => top[items[0].dataIndex]?.nome || "",
            afterBody: () => "Clique para focar neste aluno",
          },
        },
      },
      scales: {
        x: { beginAtZero: true, max: 10, grid: { color: "#eef2ff" } },
        y: { grid: { display: false } },
      },
      onClick: (_e, elements) => {
        if (!elements.length) return;
        const aluno = top[elements[0].index];
        filters.alunoId = filters.alunoId === aluno.id ? null : aluno.id;
        refreshDashboard();
      },
      onHover: (event, elements) => {
        event.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
    },
  });
}

function refreshDashboard() {
  const data = applyFilters();
  updateKPIs(data);
  updateTable(data);
  updateChips();
  createDashboardCharts(data);
}

function getTurmaGroups() {
  const map = new Map();
  alunos.forEach((a) => {
    const key = `${a.serie}|${a.turma}`;
    if (!map.has(key)) map.set(key, { serie: a.serie, turma: a.turma, alunos: [] });
    map.get(key).alunos.push(a);
  });
  return [...map.values()].sort((a, b) => {
    if (a.serie !== b.serie) return a.serie.localeCompare(b.serie, "pt-BR");
    return a.turma.localeCompare(b.turma);
  });
}

function showTurmasOverview() {
  document.getElementById("turmasOverview").hidden = false;
  document.getElementById("turmaDetail").hidden = true;
  destroyCharts(["turmaDisc", "turmaStatus"]);
}

function showTurmaDetail(turmaRef) {
  document.getElementById("turmasOverview").hidden = true;
  document.getElementById("turmaDetail").hidden = false;

  const data = alunos.filter((a) => a.serie === turmaRef.serie && a.turma === turmaRef.turma);
  const media = avg(data.map((a) => a.media));
  const aprovados = data.filter((a) => getStatus(a.media) === "aprovado").length;
  const taxa = data.length ? (aprovados / data.length) * 100 : 0;
  let melhor = null;
  data.forEach((a) => {
    if (!melhor || a.media > melhor.media) melhor = a;
  });

  document.getElementById("turmaDetailTitle").textContent = `${turmaRef.serie} — Turma ${turmaRef.turma}`;
  document.getElementById("turmaDetailSubtitle").textContent =
    `Visão detalhada · Professor Franklin Silva · ${data.length} alunos`;

  document.getElementById("turmaKpiAlunos").textContent = data.length;
  document.getElementById("turmaKpiMedia").textContent = round1(media).toFixed(1);
  document.getElementById("turmaKpiAprovacao").textContent = `${Math.round(taxa)}%`;
  document.getElementById("turmaKpiMelhor").textContent = melhor ? round1(melhor.media).toFixed(1) : "—";
  document.getElementById("turmaKpiMelhorNome").textContent = melhor ? melhor.nome : "—";

  const sorted = [...data].sort((a, b) => b.media - a.media);
  document.getElementById("turmaTableBody").innerHTML = sorted
    .map((a) => {
      const status = getStatus(a.media);
      return `<tr>
        <td>${a.nome}</td>
        ${DISCIPLINAS.map((d) => `<td>${a[d.key].toFixed(1)}</td>`).join("")}
        <td class="media-cell">${a.media.toFixed(1)}</td>
        <td><span class="status-pill ${status}">${statusLabel(status)}</span></td>
      </tr>`;
    })
    .join("");
  document.getElementById("turmaTableCount").textContent = `${data.length} alunos`;

  destroyCharts(["turmaDisc", "turmaStatus"]);

  charts.turmaDisc = new Chart(document.getElementById("chartTurmaDisc"), {
    type: "bar",
    data: {
      labels: DISCIPLINAS.map((d) => d.label),
      datasets: [{
        label: "Média",
        data: DISCIPLINAS.map((d) => round1(avg(data.map((a) => a[d.key])))),
        backgroundColor: COLORS.blue,
        borderRadius: 10,
        maxBarThickness: 42,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 10, grid: { color: "#eef2ff" } },
        x: { grid: { display: false } },
      },
    },
  });

  const statusKeys = ["aprovado", "recuperacao", "reprovado"];
  charts.turmaStatus = new Chart(document.getElementById("chartTurmaStatus"), {
    type: "doughnut",
    data: {
      labels: ["Aprovado", "Recuperação", "Reprovado"],
      datasets: [{
        data: statusKeys.map((s) => data.filter((a) => getStatus(a.media) === s).length),
        backgroundColor: statusKeys.map((s) => STATUS_COLORS[s]),
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: { legend: { position: "bottom" } },
    },
  });
}

function highlightTurmaLetter(letter) {
  document.querySelectorAll(".turma-card").forEach((card) => {
    card.style.borderColor = card.dataset.turma === letter ? "var(--blue)" : "transparent";
  });
}

function renderTurmaCards() {
  const container = document.getElementById("turmaCards");
  let groups = getTurmaGroups();
  if (turmaSerieFilter) groups = groups.filter((g) => g.serie === turmaSerieFilter);

  container.innerHTML = groups
    .map((g) => {
      const media = avg(g.alunos.map((a) => a.media));
      const aprovados = g.alunos.filter((a) => getStatus(a.media) === "aprovado").length;
      const taxa = Math.round((aprovados / g.alunos.length) * 100);
      return `<button type="button" class="turma-card" data-serie="${g.serie}" data-turma="${g.turma}">
        <div class="turma-card-top">
          <div>
            <h3>${g.serie} — Turma ${g.turma}</h3>
            <p class="muted">${g.alunos.length} alunos</p>
          </div>
          <div class="turma-badge">${g.turma}</div>
        </div>
        <div class="turma-stats">
          <div class="turma-stat"><span>Média</span><strong>${round1(media).toFixed(1)}</strong></div>
          <div class="turma-stat"><span>Aprovação</span><strong>${taxa}%</strong></div>
        </div>
        <div class="turma-card-action">Ver detalhes <i class="fa-solid fa-arrow-right"></i></div>
      </button>`;
    })
    .join("");

  container.querySelectorAll(".turma-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedTurma = { serie: card.dataset.serie, turma: card.dataset.turma };
      showTurmaDetail(selectedTurma);
    });
  });
}

function renderAlunosPage() {
  let data = [...alunos];
  if (filters.search) {
    data = data.filter((a) => a.nome.toLowerCase().includes(filters.search.toLowerCase()));
  }
  data.sort((a, b) => b.media - a.media);
  document.getElementById("alunosPageBody").innerHTML = data
    .map((a) => {
      const status = getStatus(a.media);
      return `<tr>
        <td>${a.nome}</td>
        <td>${a.serie}</td>
        <td>${a.turma}</td>
        <td class="media-cell">${a.media.toFixed(1)}</td>
        <td><span class="status-pill ${status}">${statusLabel(status)}</span></td>
      </tr>`;
    })
    .join("");
  document.getElementById("alunosPageCount").textContent = `${data.length} registros`;
}

function renderDisciplinasPage() {
  document.getElementById("disciplinaCards").innerHTML = DISCIPLINAS.map((d) => {
    const media = avg(alunos.map((a) => a[d.key]));
    const aprov = alunos.filter((a) => getStatus(a[d.key]) === "aprovado").length;
    const taxa = Math.round((aprov / alunos.length) * 100);
    return `<article class="disciplina-card">
      <h3>${d.label}</h3>
      <div class="media-big">${round1(media).toFixed(1)}</div>
      <p class="muted">Média geral · ${taxa}% de aprovação</p>
    </article>`;
  }).join("");

  destroyChart("discPage");
  charts.discPage = new Chart(document.getElementById("chartDiscPage"), {
    type: "bar",
    data: {
      labels: DISCIPLINAS.map((d) => d.label),
      datasets: [{
        label: "Média",
        data: DISCIPLINAS.map((d) => round1(avg(alunos.map((a) => a[d.key])))),
        backgroundColor: COLORS.blue,
        borderRadius: 10,
        maxBarThickness: 48,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 10, grid: { color: "#eef2ff" } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderAvaliacoesPage() {
  const aprov = alunos.filter((a) => getStatus(a.media) === "aprovado").length;
  const rec = alunos.filter((a) => getStatus(a.media) === "recuperacao").length;
  const rep = alunos.filter((a) => getStatus(a.media) === "reprovado").length;

  document.getElementById("avKpiAprov").textContent = aprov;
  document.getElementById("avKpiRec").textContent = rec;
  document.getElementById("avKpiRep").textContent = rep;
  document.getElementById("avKpiTaxa").textContent = `${Math.round((aprov / alunos.length) * 100)}%`;

  destroyCharts(["avStatus", "avSerie"]);

  charts.avStatus = new Chart(document.getElementById("chartAvStatus"), {
    type: "doughnut",
    data: {
      labels: ["Aprovado", "Recuperação", "Reprovado"],
      datasets: [{
        data: [aprov, rec, rep],
        backgroundColor: [STATUS_COLORS.aprovado, STATUS_COLORS.recuperacao, STATUS_COLORS.reprovado],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: { legend: { position: "bottom" } },
    },
  });

  const series = ["1º Ano", "2º Ano", "3º Ano"];
  charts.avSerie = new Chart(document.getElementById("chartAvSerie"), {
    type: "bar",
    data: {
      labels: series,
      datasets: [
        {
          label: "Aprovado",
          data: series.map((s) => alunos.filter((a) => a.serie === s && getStatus(a.media) === "aprovado").length),
          backgroundColor: STATUS_COLORS.aprovado,
          borderRadius: 8,
        },
        {
          label: "Recuperação",
          data: series.map((s) => alunos.filter((a) => a.serie === s && getStatus(a.media) === "recuperacao").length),
          backgroundColor: STATUS_COLORS.recuperacao,
          borderRadius: 8,
        },
        {
          label: "Reprovado",
          data: series.map((s) => alunos.filter((a) => a.serie === s && getStatus(a.media) === "reprovado").length),
          backgroundColor: STATUS_COLORS.reprovado,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, grid: { color: "#eef2ff" } },
      },
    },
  });
}

function bindControls() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(item.dataset.page);
    });
  });

  document.getElementById("backTurmas").addEventListener("click", () => {
    selectedTurma = null;
    showTurmasOverview();
    renderTurmaCards();
  });

  document.getElementById("turmaSerieFilter").addEventListener("change", (e) => {
    turmaSerieFilter = e.target.value;
    renderTurmaCards();
  });

  document.getElementById("filterSerie").addEventListener("change", (e) => {
    filters.serie = e.target.value;
    refreshDashboard();
  });
  document.getElementById("filterTurma").addEventListener("change", (e) => {
    filters.turma = e.target.value;
    refreshDashboard();
  });
  document.getElementById("filterDisciplina").addEventListener("change", (e) => {
    filters.disciplina = e.target.value;
    refreshDashboard();
  });
  document.getElementById("filterStatus").addEventListener("change", (e) => {
    filters.status = e.target.value;
    refreshDashboard();
  });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    filters.search = e.target.value.trim();
    if (currentPage === "dashboard") refreshDashboard();
    if (currentPage === "alunos") renderAlunosPage();
  });

  document.getElementById("clearFilters").addEventListener("click", () => {
    filters.serie = "";
    filters.turma = "";
    filters.disciplina = "";
    filters.status = "";
    filters.search = "";
    filters.alunoId = null;
    document.getElementById("filterSerie").value = "";
    document.getElementById("filterTurma").value = "";
    document.getElementById("filterDisciplina").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("searchInput").value = "";
    refreshDashboard();
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    navigate("dashboard");
    alert("Sessão encerrada. Bem-vindo de volta, Professor Franklin Silva!");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  chartDefaults();
  alunos = parseCSV(RAW_CSV);
  bindControls();
  const hash = window.location.hash.replace("#", "");
  const valid = ["dashboard", "turmas", "alunos", "disciplinas", "avaliacoes", "configuracoes"];
  navigate(valid.includes(hash) ? hash : "dashboard");
});
