// Ruta7 MVP UI (demo local)
// - Genera un itinerario "simulado"
// - Calcula combustible + costos estimados
// - Guarda y lista itinerarios con localStorage

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];

const VIEWS = ["create", "result", "saved"];
const LS_KEY = "ruta7_itineraries_v01";

const demoPOIs = [
  { name: "Coyhaique", type: "base", avgCostCLP: 0 },
  { name: "Puerto Río Tranquilo", type: "tour", avgCostCLP: 25000 },
  { name: "Capillas de Mármol", type: "tour", avgCostCLP: 35000 },
  { name: "Lago General Carrera", type: "viewpoint", avgCostCLP: 0 },
  { name: "Cerro Castillo", type: "hike", avgCostCLP: 0 },
  { name: "Camping Río Simpson", type: "camping", avgCostCLP: 12000 },
];

let state = {
  lastItinerary: null,
  pois: [],
};

function money(n){
  const v = Math.round(Number(n || 0));
  return v.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}
function fmtKm(n){ return `${Math.round(n)} km`; }
function fmtTime(min){
  const h = Math.floor(min/60);
  const m = Math.round(min%60);
  if(h <= 0) return `${m} min`;
  return `${h} h ${m} min`;
}
function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

function setView(name){
  VIEWS.forEach(v => {
    $(`#view-${v}`).classList.toggle("active", v === name);
    $(`.navBtn[data-view="${v}"]`).classList.toggle("active", v === name);
  });
}

$$(".navBtn").forEach(btn => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

$("#btnTryExample").addEventListener("click", () => {
  $("#budget").value = 500000;
  $("#days").value = 5;
  $("#kml").value = 12;
  $("#fuelPrice").value = 1400;
  $("#style").value = "Aventura";
  toast("Ejemplo cargado ✅");
});

$("#btnSeed").addEventListener("click", () => {
  state.pois = demoPOIs;
  toast("POIs demo cargados ✅");
});

$("#btnClear").addEventListener("click", () => {
  state.lastItinerary = null;
  toast("Estado limpio ✅");
});

$("#itineraryForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const budgetCLP = Number($("#budget").value);
  const days = Number($("#days").value);
  const kmPerLiter = Number($("#kml").value);
  const fuelPriceCLP = Number($("#fuelPrice").value);
  const style = $("#style").value;
  const region = "Aysén";

  if(!budgetCLP || !days || !kmPerLiter || !fuelPriceCLP){
    toast("Completa los campos.");
    return;
  }

  // DEMO: en producción, esto viene de Google Directions (Functions)
  // Para simular, hacemos una distancia coherente según días:
  const baseKm = 180;             // km base
  const kmPerDay = 90;            // km extra por día
  const distanceKm = baseKm + (days * kmPerDay);
  const durationMin = Math.round(distanceKm / 70 * 60); // 70km/h promedio

  // Combustible
  const liters = distanceKm / kmPerLiter;
  const fuelCLP = liters * fuelPriceCLP;

  // Costos extra demo (si hay POIs, suma algunos)
  const toursCLP = estimateTours(days);
  const campingCLP = estimateCamping(days, style);
  const foodCLP = estimateFood(days, style);

  const totalCLP = fuelCLP + toursCLP + campingCLP + foodCLP;

  // "IA" simulada
  const ai = generateAIContent(days, style);

  state.lastItinerary = {
    id: crypto.randomUUID(),
    title: `${style} en ${region}`,
    region,
    style,
    budgetCLP,
    days,
    fuel: { kmPerLiter, fuelPriceCLP, liters, fuelCLP },
    route: {
      origin: "Coyhaique",
      destination: "Puerto Río Tranquilo",
      distanceKm,
      durationMin,
      waypoints: ai.waypoints,
    },
    costs: { fuelCLP, toursCLP, campingCLP, foodCLP, totalCLP },
    ai,
    createdAt: new Date().toISOString(),
    pdfUrl: null,
  };

  renderResult(state.lastItinerary);
  setView("result");
  toast("Ruta generada ✅");
});

function estimateTours(days){
  // demo simple: 1 tour cada 2 días
  const n = Math.max(1, Math.round(days / 2));
  const avg = 28000;
  return n * avg;
}
function estimateCamping(days, style){
  // demo: camping se usa más en aventura/mochilero
  const nightly = (style === "Aventura" || style === "Mochilero") ? 12000 : 0;
  const nights = Math.max(0, days - 1);
  return nights * nightly;
}
function estimateFood(days, style){
  // demo: comida diaria
  const perDay = (style === "Familiar") ? 22000 : 16000;
  return days * perDay;
}

function generateAIContent(days, style){
  // En producción: esto lo genera un LLM (Cloud Function)
  const base = [
    { day: 1, title: "Coyhaique → Lago General Carrera", desc: "Salida temprano, miradores y primer atardecer junto al lago. Recomendación: comprar provisiones en Coyhaique." },
    { day: 2, title: "Capillas de Mármol (tour)", desc: "Tour en bote por las formaciones de mármol. Evita horas punta y lleva capa para viento." },
    { day: 3, title: "Senderos y miradores", desc: "Caminata suave, fotografía y avistamiento de aves. Mantén distancia con fauna local." },
    { day: 4, title: "Cerro Castillo (opcional)", desc: "Ruta de trekking según nivel. Si vas con familia, considera miradores accesibles." },
    { day: 5, title: "Regreso con paradas", desc: "Paradas cortas + gastronomía local. Cierra con un café y revisa gastos para el próximo viaje." },
  ];

  const trimmed = base.slice(0, Math.max(1, Math.min(10, days)));

  const faunaFlora = [
    "Huemules, cóndores, carpintero negro",
    "Lengas, ñires, coigües (según sector)",
    "Ríos glaciares y humedales con aves migratorias",
  ];

  const funFacts = [
    "La Carretera Austral comenzó a construirse en 1976 y conectó zonas aisladas del sur.",
    "El mármol de General Carrera fue esculpido por siglos de oleaje y erosión.",
    "En Aysén el clima puede cambiar rápido: lleva capas y siempre un plan B.",
  ];

  const waypoints = [
    "Coyhaique",
    "Puerto Río Tranquilo",
    "Lago General Carrera",
    style === "Aventura" ? "Cerro Castillo" : "Miradores Panorámicos",
  ];

  return {
    itinerary: trimmed,
    faunaFlora,
    funFact: funFacts[Math.floor(Math.random() * funFacts.length)],
    waypoints,
  };
}

function renderResult(it){
  // Summary cards
  $("#sumDistance").textContent = fmtKm(it.route.distanceKm);
  $("#sumTime").textContent = fmtTime(it.route.durationMin);
  $("#sumFuel").textContent = money(it.costs.fuelCLP);
  $("#sumTotal").textContent = money(it.costs.totalCLP);

  // Costs
  $("#costFuel").textContent = money(it.costs.fuelCLP);
  $("#costTours").textContent = money(it.costs.toursCLP);
  $("#costCamping").textContent = money(it.costs.campingCLP);
  $("#costFood").textContent = money(it.costs.foodCLP);

  // Accordion itinerary
  const acc = $("#itineraryAccordion");
  acc.innerHTML = "";
  it.ai.itinerary.forEach((d, idx) => {
    const item = document.createElement("div");
    item.className = "accItem" + (idx === 0 ? " open" : "");
    item.innerHTML = `
      <button class="accHead" type="button">
        <div>
          <b>Día ${idx + 1}: ${escapeHtml(d.title)}</b><br/>
          <span>${escapeHtml(d.desc).slice(0, 70)}${d.desc.length > 70 ? "…" : ""}</span>
        </div>
        <div>▾</div>
      </button>
      <div class="accBody">${escapeHtml(d.desc)}</div>
    `;
    item.querySelector(".accHead").addEventListener("click", () => {
      item.classList.toggle("open");
    });
    acc.appendChild(item);
  });

  // Fauna/flora and fun fact
  $("#faunaFlora").innerHTML = it.ai.faunaFlora.map(x => `• ${escapeHtml(x)}`).join("<br/>");
  $("#funFact").textContent = it.ai.funFact;

  // Map placeholder label
  $("#mapPlaceholder .mapTitle").textContent = `Ruta (demo): ${it.route.origin} → ${it.route.destination}`;
  $("#mapPlaceholder .mapSub").textContent = `Paradas: ${it.route.waypoints.join(" • ")}`;
}

$("#btnSave").addEventListener("click", () => {
  if(!state.lastItinerary) return toast("Primero genera una ruta.");
  const list = loadSaved();
  list.unshift(state.lastItinerary);
  saveAll(list);
  toast("Itinerario guardado ✅");
  renderSaved();
});

$("#btnPDF").addEventListener("click", () => {
  if(!state.lastItinerary) return toast("Primero genera una ruta.");
  // MVP placeholder: en producción esto llamaría a una Cloud Function que genera PDF y devuelve URL
  toast("PDF: (MVP) Conéctalo a Firebase Function ✅");
  alert("En producción: /pdf/generate (Cloud Function) → Storage → URL de descarga.");
});

$("#btnDeleteAll").addEventListener("click", () => {
  localStorage.removeItem(LS_KEY);
  renderSaved();
  toast("Itinerarios eliminados.");
});

function loadSaved(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return [];
    return JSON.parse(raw);
  }catch{ return []; }
}
function saveAll(list){
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function renderSaved(){
  const list = loadSaved();
  const el = $("#savedList");
  el.innerHTML = "";

  if(list.length === 0){
    el.innerHTML = `<div class="savedCard"><b>No hay itinerarios aún.</b><div class="muted" style="margin-top:6px;">Genera uno y presiona “Guardar”.</div></div>`;
    return;
  }

  list.forEach((it) => {
    const card = document.createElement("div");
    card.className = "savedCard";
    const created = new Date(it.createdAt);
    card.innerHTML = `
      <div class="savedCardTop">
        <div>
          <div class="savedTitle">${escapeHtml(it.title)}</div>
          <div class="savedMeta">
            <span>📍 ${escapeHtml(it.region)}</span>
            <span>🗓️ ${it.days} días</span>
            <span>🛣️ ${Math.round(it.route.distanceKm)} km</span>
            <span>💸 ${money(it.costs.totalCLP)}</span>
            <span>🕒 ${created.toLocaleDateString("es-CL")}</span>
          </div>
        </div>
        <button class="btn ghost" title="Eliminar">🗑️</button>
      </div>

      <div class="savedActions">
        <button class="btn soft">Ver detalles</button>
        <button class="btn primary">Descargar PDF</button>
      </div>
    `;

    const [btnDel, btnView, btnPdf] = [
      card.querySelector(".btn.ghost"),
      card.querySelectorAll(".savedActions .btn")[0],
      card.querySelectorAll(".savedActions .btn")[1],
    ];

    btnDel.addEventListener("click", () => {
      const all = loadSaved().filter(x => x.id !== it.id);
      saveAll(all);
      renderSaved();
      toast("Eliminado.");
    });

    btnView.addEventListener("click", () => {
      state.lastItinerary = it;
      renderResult(it);
      setView("result");
      toast("Mostrando itinerario.");
    });

    btnPdf.addEventListener("click", () => {
      alert("En producción: PDF desde Storage (link). En MVP: conéctalo a Cloud Function.");
    });

    el.appendChild(card);
  });
}

// Utils
function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// init
renderSaved();
