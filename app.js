// ---------- Reference lists ----------
const SUPPLIERS = ["الفاخر","السعدي","مهام الطريق","رمز الذويب","شلالات التربة","أبو سرهد","اليان","النورس","أبو عمر","فرسان","الكمال الشمالي","الشهباء","الجري","كنوز","ابو راشد","ابو عمار","ابو كريم"];
const CLIENTS = ["الساير","ال سي","يو ال سي","دولفين","هشام","جولف اند ورد","عرفان","هيونداي"];
const COUNTRIES = ["عمان","السعودية","الإمارات","الكويت"];
const PORTS = ["خزائن","الدقم","صحار","جبل علي","خورفكان","ينبع","جدة","قابوس","الفجيرة"];
const VEHICLE_TYPES = ["ناقلة","لوبد","بوكس","سطحة"];
const CARRIER_STATUSES = ["بالطريق إلى الميناء","في الميناء","منفذ الربع الخالي","ترانزيت السعودية","منفذ السلع","منفذ الخفجي","منفذ السالمي","وصلت","منفذ النويصيب","بالطريق ل عمان"];
const PERMIT_TYPES = ["دخول وخروج","خروج","دخول"];
const PERMIT_STATUSES = ["لم يقدم","تم الطلب","فعال","إعادة اصدار"];
const CARGO_STATUSES = ["قيد التحميل","ترانزيت","تم التنزيل"];

const FIELDS = [
  { key: "serialNo", label: "م", type: "text", placeholder: "رقم تسلسلي (اختياري)" },
  { key: "vehicleType", label: "نوع السيارة", type: "select", options: VEHICLE_TYPES },
  { key: "count", label: "العدد", type: "number" },
  { key: "arrivalDate", label: "تاريخ الوصول", type: "date" },
  { key: "loadingDate", label: "تاريخ التحميل", type: "date" },
  { key: "country", label: "الدولة", type: "select", options: COUNTRIES },
  { key: "port", label: "الميناء", type: "select", options: PORTS },
  { key: "client", label: "العميل", type: "select", options: CLIENTS },
  { key: "destination", label: "الوجهة", type: "select", options: COUNTRIES },
  { key: "supplier", label: "المورد", type: "select", options: SUPPLIERS },
  { key: "carrierStatus", label: "حالة الناقلة", type: "select", options: CARRIER_STATUSES },
  { key: "permitType", label: "نوع التصريح", type: "select", options: PERMIT_TYPES },
  { key: "permitStatus", label: "حالة التصريح", type: "select", options: PERMIT_STATUSES },
  { key: "cargoStatus", label: "حالة الحمولة", type: "select", options: CARGO_STATUSES },
  { key: "notes", label: "ملاحظات", type: "textarea" },
];

const PERMIT_COLOR = {
  "فعال": { bg: "#E4EEE1", fg: "#3F6B2E", dot: "#5C8A44" },
  "لم يقدم": { bg: "#F5DFDC", fg: "#8C2E24", dot: "#B23A2C" },
  "تم الطلب": { bg: "#E3EAF0", fg: "#2C4F6E", dot: "#3E6E93" },
  "إعادة اصدار": { bg: "#F3E3CC", fg: "#8A5A17", dot: "#C1782E" },
  "": { bg: "#EAE6DA", fg: "#7A7362", dot: "#A69C82" },
};
const CARGO_COLOR = {
  "قيد التحميل": { bg: "#E3EAF0", fg: "#2C4F6E", dot: "#3E6E93" },
  "ترانزيت": { bg: "#F3E3CC", fg: "#8A5A17", dot: "#C1782E" },
  "تم التنزيل": { bg: "#E4EEE1", fg: "#3F6B2E", dot: "#5C8A44" },
  "": { bg: "#EAE6DA", fg: "#7A7362", dot: "#A69C82" },
};
function carrierStatusColor(v) {
  if (!v) return { bg: "#EAE6DA", fg: "#7A7362", dot: "#A69C82" };
  if (v === "وصلت") return { bg: "#E4EEE1", fg: "#3F6B2E", dot: "#5C8A44" };
  if (v.includes("ترانزيت") || v.includes("بالطريق")) return { bg: "#F3E3CC", fg: "#8A5A17", dot: "#C1782E" };
  if (v.includes("منفذ") || v.includes("الميناء")) return { bg: "#E3EAF0", fg: "#2C4F6E", dot: "#3E6E93" };
  return { bg: "#EAE6DA", fg: "#7A7362", dot: "#A69C82" };
}
const CHART_COLORS = ["#2F6690", "#C1782E", "#5C8A44", "#8A5A17", "#6B4D8A", "#A69C82", "#B23A2C", "#3E6E93"];

function fmtDate(d) {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function badge(text, color) {
  return `<span class="cc-badge" style="background:${color.bg};color:${color.fg};border-color:${color.fg}22">
    <span class="dot" style="background:${color.dot}"></span>${esc(text) || "—"}
  </span>`;
}

// ---------- State ----------
let RECORDS = [];
let FORM = {};
let SELECTED = new Set();
let FILTERS = { query: "", supplier: "", permit: "", client: "" };
let CHARTS = {};

FIELDS.forEach((f) => (FORM[f.key] = ""));

// ---------- API ----------
async function apiGet() {
  const res = await fetch("/api/records");
  return res.json();
}
async function apiAdd(record) {
  const res = await fetch("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  return res.json();
}
async function apiBulkDelete(ids) {
  const res = await fetch("/api/records/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  return res.json();
}

// ---------- Tabs ----------
document.querySelectorAll(".cc-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".cc-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const name = tab.dataset.tab;
    document.querySelectorAll(".cc-view").forEach((v) => (v.style.display = "none"));
    document.getElementById(`view-${name}`).style.display = "block";
    if (name === "dashboard") renderDashboard();
    if (name === "records") renderRecords();
    if (name === "add") renderAddForm();
  });
});
function switchTab(name) {
  document.querySelector(`.cc-tab[data-tab="${name}"]`).click();
}

// ---------- Dashboard ----------
function computeStats() {
  const list = RECORDS;
  const total = list.length;
  const active = list.filter((r) => r.permitStatus === "فعال").length;
  const notSubmitted = list.filter((r) => r.permitStatus === "لم يقدم").length;
  const arrived = list.filter((r) => r.carrierStatus === "وصلت").length;
  const inTransit = list.filter((r) => (r.carrierStatus || "").includes("ترانزيت") || (r.carrierStatus || "").includes("بالطريق")).length;
  const totalUnits = list.reduce((s, r) => s + (parseInt(r.count, 10) || 0), 0);

  const bySupplier = {};
  list.forEach((r) => { const k = r.supplier || "غير محدد"; bySupplier[k] = (bySupplier[k] || 0) + 1; });
  const supplierData = Object.entries(bySupplier).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const byDest = {};
  list.forEach((r) => { const k = r.destination || "غير محدد"; byDest[k] = (byDest[k] || 0) + 1; });
  const destData = Object.entries(byDest);

  const byPermit = {};
  list.forEach((r) => { const k = r.permitStatus || "غير محدد"; byPermit[k] = (byPermit[k] || 0) + 1; });
  const permitData = Object.entries(byPermit);

  const byDate = {};
  list.forEach((r) => { const k = r.arrivalDate || ""; if (k) byDate[k] = (byDate[k] || 0) + 1; });
  const dateData = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).map(([d, c]) => [fmtDate(d), c]);

  return { total, active, notSubmitted, arrived, inTransit, totalUnits, supplierData, destData, permitData, dateData };
}

function destroyCharts() {
  Object.values(CHARTS).forEach((c) => c && c.destroy());
  CHARTS = {};
}

function renderDashboard() {
  const s = computeStats();
  document.getElementById("totalPill").textContent = s.total;
  const el = document.getElementById("view-dashboard");
  el.innerHTML = `
    <div class="cc-cards-row">
      ${card("إجمالي الحركات", s.total)}
      ${card("تصاريح فعالة", s.active, "حالة التصريح")}
      ${card("لم يقدم بعد", s.notSubmitted, "يحتاج متابعة")}
      ${card("وصلت", s.arrived, "حالة الناقلة")}
      ${card("في الطريق / ترانزيت", s.inTransit)}
      ${card("إجمالي عدد المركبات", s.totalUnits, "مجموع عمود العدد")}
    </div>
    <div class="cc-charts-grid">
      <div class="cc-chart-box"><div class="cc-chart-title">عدد الحركات حسب المورّد</div><canvas id="chartSupplier"></canvas></div>
      <div class="cc-chart-box"><div class="cc-chart-title">التوزيع حسب الوجهة</div><canvas id="chartDest"></canvas></div>
    </div>
    <div class="cc-charts-grid alt">
      <div class="cc-chart-box"><div class="cc-chart-title">حالة التصاريح</div><canvas id="chartPermit"></canvas></div>
      <div class="cc-chart-box"><div class="cc-chart-title">الحركات حسب تاريخ الوصول</div><canvas id="chartDate"></canvas></div>
    </div>
  `;

  destroyCharts();

  CHARTS.supplier = new Chart(document.getElementById("chartSupplier"), {
    type: "bar",
    data: { labels: s.supplierData.map((d) => d[0]), datasets: [{ data: s.supplierData.map((d) => d[1]), backgroundColor: "#2F6690", borderRadius: 3 }] },
    options: baseChartOpts(false),
  });

  CHARTS.dest = new Chart(document.getElementById("chartDest"), {
    type: "pie",
    data: { labels: s.destData.map((d) => d[0]), datasets: [{ data: s.destData.map((d) => d[1]), backgroundColor: CHART_COLORS }] },
    options: pieChartOpts(),
  });

  CHARTS.permit = new Chart(document.getElementById("chartPermit"), {
    type: "doughnut",
    data: { labels: s.permitData.map((d) => d[0]), datasets: [{ data: s.permitData.map((d) => d[1]), backgroundColor: s.permitData.map((d) => (PERMIT_COLOR[d[0]] || PERMIT_COLOR[""]).dot) }] },
    options: pieChartOpts(),
  });

  CHARTS.date = new Chart(document.getElementById("chartDate"), {
    type: "line",
    data: { labels: s.dateData.map((d) => d[0]), datasets: [{ data: s.dateData.map((d) => d[1]), borderColor: "#C1782E", backgroundColor: "#C1782E", tension: 0.25, pointRadius: 3 }] },
    options: baseChartOpts(false),
  });
}

function card(label, value, sub) {
  return `<div class="cc-card">
    <div class="cc-card-label">${esc(label)}</div>
    <div class="cc-card-value">${esc(value)}</div>
    ${sub ? `<div class="cc-card-sub">${esc(sub)}</div>` : ""}
  </div>`;
}
function baseChartOpts() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { rtl: true, bodyFont: { family: "IBM Plex Sans Arabic" } } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };
}
function pieChartOpts() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", rtl: true, labels: { font: { family: "IBM Plex Sans Arabic", size: 11 } } }, tooltip: { rtl: true } },
  };
}

// ---------- Records table ----------
function getFiltered() {
  return RECORDS.filter((r) => {
    if (FILTERS.supplier && r.supplier !== FILTERS.supplier) return false;
    if (FILTERS.permit && r.permitStatus !== FILTERS.permit) return false;
    if (FILTERS.client && r.client !== FILTERS.client) return false;
    if (FILTERS.query) {
      const hay = Object.values(r).join(" ");
      if (!hay.includes(FILTERS.query)) return false;
    }
    return true;
  });
}

function renderRecords() {
  const filtered = getFiltered();
  const el = document.getElementById("view-records");
  const allSelected = filtered.length > 0 && filtered.every((r) => SELECTED.has(r.id));

  el.innerHTML = `
    <div class="cc-toolbar">
      <input class="cc-input" id="fQuery" style="max-width:220px" placeholder="بحث في كل الحقول..." value="${esc(FILTERS.query)}" />
      <select class="cc-select" id="fSupplier" style="max-width:160px"><option value="">كل الموردين</option>${SUPPLIERS.map((s) => `<option ${s === FILTERS.supplier ? "selected" : ""}>${s}</option>`).join("")}</select>
      <select class="cc-select" id="fClient" style="max-width:160px"><option value="">كل العملاء</option>${CLIENTS.map((c) => `<option ${c === FILTERS.client ? "selected" : ""}>${c}</option>`).join("")}</select>
      <select class="cc-select" id="fPermit" style="max-width:160px"><option value="">كل حالات التصريح</option>${PERMIT_STATUSES.map((p) => `<option ${p === FILTERS.permit ? "selected" : ""}>${p}</option>`).join("")}</select>
      <div style="flex:1"></div>
      <div style="font-size:12.5px;color:#5C5544">${SELECTED.size > 0 ? `محدد: ${SELECTED.size}` : `النتائج: ${filtered.length}`}</div>
      ${SELECTED.size > 0 ? `<button class="cc-btn secondary" id="btnDelete">حذف المحدد</button>` : ""}
    </div>
    <div class="cc-table-wrap">
      <table class="cc-table">
        <thead><tr>
          <th><input type="checkbox" id="selectAll" ${allSelected ? "checked" : ""} /></th>
          <th>م</th><th>نوع السيارة</th><th>العدد</th><th>الوصول</th><th>التحميل</th>
          <th>الدولة</th><th>الميناء</th><th>العميل</th><th>الوجهة</th><th>المورد</th>
          <th>حالة الناقلة</th><th>نوع التصريح</th><th>حالة التصريح</th><th>حالة الحمولة</th><th>ملاحظات</th>
        </tr></thead>
        <tbody>
          ${filtered.length === 0 ? `<tr><td colspan="16" class="cc-empty">لا توجد نتائج مطابقة</td></tr>` : filtered.map(rowHtml).join("")}
        </tbody>
      </table>
    </div>
  `;

  el.querySelector("#fQuery").addEventListener("input", (e) => { FILTERS.query = e.target.value; renderRecords(); });
  el.querySelector("#fSupplier").addEventListener("change", (e) => { FILTERS.supplier = e.target.value; renderRecords(); });
  el.querySelector("#fClient").addEventListener("change", (e) => { FILTERS.client = e.target.value; renderRecords(); });
  el.querySelector("#fPermit").addEventListener("change", (e) => { FILTERS.permit = e.target.value; renderRecords(); });
  el.querySelector("#selectAll").addEventListener("change", () => {
    if (allSelected) filtered.forEach((r) => SELECTED.delete(r.id));
    else filtered.forEach((r) => SELECTED.add(r.id));
    renderRecords();
  });
  el.querySelectorAll(".rowCheck").forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.id;
      if (SELECTED.has(id)) SELECTED.delete(id); else SELECTED.add(id);
      renderRecords();
    });
  });
  const delBtn = el.querySelector("#btnDelete");
  if (delBtn) delBtn.addEventListener("click", async () => {
    await apiBulkDelete(Array.from(SELECTED));
    SELECTED.clear();
    await loadRecords();
    renderRecords();
    renderDashboard();
  });
}

function rowHtml(r) {
  return `<tr style="${SELECTED.has(r.id) ? "background:#F3EFE0" : ""}">
    <td><input type="checkbox" class="rowCheck" data-id="${esc(r.id)}" ${SELECTED.has(r.id) ? "checked" : ""} /></td>
    <td>${esc(r.serialNo) || "—"}</td>
    <td>${esc(r.vehicleType) || "—"}</td>
    <td>${esc(r.count) || "—"}</td>
    <td>${fmtDate(r.arrivalDate)}</td>
    <td>${fmtDate(r.loadingDate)}</td>
    <td>${esc(r.country) || "—"}</td>
    <td>${esc(r.port) || "—"}</td>
    <td>${esc(r.client) || "—"}</td>
    <td>${esc(r.destination) || "—"}</td>
    <td>${esc(r.supplier) || "—"}</td>
    <td>${badge(r.carrierStatus, carrierStatusColor(r.carrierStatus))}</td>
    <td>${esc(r.permitType) || "—"}</td>
    <td>${badge(r.permitStatus, PERMIT_COLOR[r.permitStatus] || PERMIT_COLOR[""])}</td>
    <td>${badge(r.cargoStatus, CARGO_COLOR[r.cargoStatus] || CARGO_COLOR[""])}</td>
    <td style="white-space:normal;max-width:220px">${esc(r.notes) || "—"}</td>
  </tr>`;
}

// ---------- Add form ----------
function renderAddForm() {
  const el = document.getElementById("view-add");
  el.innerHTML = `
    <form class="cc-form-card" id="addForm">
      <div class="cc-form-title">إضافة حركة ناقلة جديدة</div>
      <div class="cc-form-grid">
        ${FIELDS.map(fieldHtml).join("")}
      </div>
      <div style="margin-top:18px;display:flex;gap:10px;align-items:center">
        <button class="cc-btn" type="submit">حفظ الحركة</button>
        <span class="cc-save-note" id="saveNote"></span>
      </div>
    </form>
  `;
  el.querySelector("#addForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const noteEl = document.getElementById("saveNote");
    noteEl.textContent = "جارٍ الحفظ...";
    FIELDS.forEach((f) => { FORM[f.key] = document.getElementById(`field_${f.key}`).value; });
    await apiAdd({ ...FORM });
    noteEl.textContent = "تم الحفظ ✓";
    FIELDS.forEach((f) => (FORM[f.key] = ""));
    await loadRecords();
    setTimeout(() => switchTab("records"), 400);
  });
}

function fieldHtml(f) {
  const wrapClass = f.type === "textarea" ? "full" : "";
  let control;
  if (f.type === "select") {
    control = `<select class="cc-select" id="field_${f.key}"><option value="">— اختر —</option>${f.options.map((o) => `<option>${o}</option>`).join("")}</select>`;
  } else if (f.type === "textarea") {
    control = `<textarea class="cc-textarea" id="field_${f.key}" rows="3"></textarea>`;
  } else {
    control = `<input class="cc-input" id="field_${f.key}" type="${f.type}" placeholder="${esc(f.placeholder || "")}" />`;
  }
  return `<div class="${wrapClass}"><label class="cc-field-label">${esc(f.label)}</label>${control}</div>`;
}

// ---------- Boot ----------
async function loadRecords() {
  RECORDS = await apiGet();
  document.getElementById("totalPill").textContent = RECORDS.length;
}

(async function init() {
  await loadRecords();
  renderDashboard();
})();
