// CHANGE THIS to your Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbxv32yAHJtL5dXMmCZO3tJ5yyKnG9eitlHzmReE2QjDPd6fIGGJgQmBPa9aba94g4C0pg/exec";

let vinylCache = [];
let trackCache = [];

// Navigation
document.querySelectorAll(".bottom-nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("page-" + btn.dataset.page).classList.add("active");
  });
});

// ---------- LOAD VINYLS & TRACKS ----------

async function loadVinyls() {
  const data = await fetch(API_URL + "?sheet=Vinyl Inventory").then(r => r.json());
  const rows = data.slice(1); // skip header
  vinylCache = rows;

  renderHome(rows);
  renderBrowse(rows);
}

async function loadTracks() {
  const data = await fetch(API_URL + "?sheet=Tracks").then(r => r.json());
  const rows = data.slice(1);
  trackCache = rows;

  renderTracks(rows);
}

// ---------- HOME ----------

function renderHome(rows) {
  const total = rows.length;
  const value = rows.reduce((t, r) => t + Number(r[5] || 0), 0);
  document.getElementById("stats").innerHTML = `
    <p><strong>Vinyls:</strong> ${total}</p>
    <p><strong>Total Value:</strong> £${value}</p>
  `;
}

// ---------- BROWSE ----------

function renderBrowse(rows) {
  const list = document.getElementById("browseList");
  list.innerHTML = rows.map(r => `
    <p><strong>${r[1]}</strong> – ${r[2]} (${r[3]}) £${r[5]}</p>
  `).join("");
}

document.getElementById("browseFilter").addEventListener("input", applyBrowseFilters);
document.getElementById("browseSort").addEventListener("change", applyBrowseFilters);

function applyBrowseFilters() {
  const filter = document.getElementById("browseFilter").value.toLowerCase();
  const sort = document.getElementById("browseSort").value;

  let rows = vinylCache.filter(r =>
    r.join(" ").toLowerCase().includes(filter)
  );

  if (sort === "artist") rows.sort((a, b) => (a[1] || "").localeCompare(b[1] || ""));
  if (sort === "year") rows.sort((a, b) => (parseInt(a[3]) || 0) - (parseInt(b[3]) || 0));
  if (sort === "value") rows.sort((a, b) => (Number(a[5]) || 0) - (Number(b[5]) || 0));
  if (sort === "date") rows.sort((a, b) => new Date(a[7]) - new Date(b[7]));

  renderBrowse(rows);
}

// ---------- ADD VINYL ----------

document.getElementById("addForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = new FormData(e.target);
  const row = [
    "",                        // ID (formula in sheet)
    form.get("artist"),
    form.get("album"),
    form.get("year"),
    form.get("format"),
    form.get("value"),
    form.get("notes"),
    new Date(),                // Date Added
    ""                         // Edit link (formula)
  ];

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ sheet: "Vinyl Inventory", row })
  });

  alert("Vinyl added!");
  e.target.reset();
  loadVinyls();
});

// ---------- TRACKS ----------

function renderTracks(rows) {
  document.getElementById("trackList").innerHTML =
    rows.map(r => `<p>Vinyl ${r[0]} – ${r[2]} (${r[3]})</p>`).join("");
}

document.getElementById("trackFilter").addEventListener("input", () => {
  const f = document.getElementById("trackFilter").value.toLowerCase();
  const filtered = trackCache.filter(r => r.join(" ").toLowerCase().includes(f));
  renderTracks(filtered);
});

document.getElementById("trackForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = new FormData(e.target);
  const row = [
    form.get("vinylId"),
    form.get("trackNum"),
    form.get("trackName"),
    form.get("genre")
  ];

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ sheet: "Tracks", row })
  });

  alert("Track added!");
  e.target.reset();
  loadTracks();
});

// ---------- SEARCH ----------

document.getElementById("searchInput").addEventListener("input", () => {
  const q = document.getElementById("searchInput").value.toLowerCase();

  const vinylMatches = vinylCache.filter(r =>
    r.join(" ").toLowerCase().includes(q)
  );

  const trackMatches = trackCache.filter(r =>
    r.join(" ").toLowerCase().includes(q)
  );

  renderSearch(vinylMatches, trackMatches);
});

function renderSearch(vinyls, tracks) {
  const div = document.getElementById("searchResults");

  div.innerHTML = `
    <h3>Vinyls</h3>
    ${vinyls.map(r => `<p>${r[1]} – ${r[2]}</p>`).join("") || "<p>No vinyls found.</p>"}

    <h3>Tracks</h3>
    ${tracks.map(r => `<p>${r[2]} (${r[3]})</p>`).join("") || "<p>No tracks found.</p>"}
  `;
}

// ---------- INITIAL LOAD ----------

loadVinyls();
loadTracks();

