// CHANGE THIS to your Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbxv32yAHJtL5dXMmCZO3tJ5yyKnG9eitlHzmReE2QjDPd6fIGGJgQmBPa9aba94g4C0pg/exec";

let vinylCache = [];
let trackCache = [];

// ---------------- NAVIGATION ----------------

document.querySelectorAll(".bottom-nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;
    if (!page) return; // prevents crashes if a button has no data-page

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("page-" + page).classList.add("active");
  });
});

// ---------------- HELPERS ----------------

function extractYear(value) {
  if (!value) return "";
  return String(value).slice(0, 4);
}

// ---------------- LOAD VINYLS ----------------

async function loadVinyls() {
  const data = await fetch(API_URL + "?sheet=Vinyl Inventory").then(r => r.json());
  const rows = data.slice(1); // skip header
  vinylCache = rows;

  renderHome(rows);
  renderBrowse(rows);
}

// ---------------- LOAD TRACKS ----------------

async function loadTracks() {
  const data = await fetch(API_URL + "?sheet=Tracks").then(r => r.json());
  const rows = data.slice(1);
  trackCache = rows;

  renderTracks(rows);
}

// ---------------- HOME PAGE ----------------

function renderHome(rows) {
  const total = rows.length;
  const value = rows.reduce((t, r) => t + Number(r[5] || 0), 0);

  document.getElementById("stats").innerHTML = `
    <p><strong>Vinyls:</strong> ${total}</p>
    <p><strong>Total Value:</strong> £${value}</p>
  `;
}

// ---------------- BROWSE PAGE ----------------
function extractYear(value) {
  if (!value) return "";

  // If it's a date string like "1905-07-04T00:00:00.000Z"
  if (typeof value === "string" && value.includes("-")) {
    return value.slice(0, 4);
  }

  // If it's a Date object
  if (value instanceof Date) {
    return value.getFullYear();
  }

  // If it's a number (e.g. 2001)
  return String(value).slice(0, 4);
}

function renderBrowse(rows) {
  const list = document.getElementById("browseList");
  list.innerHTML = "";

  rows
    .filter(r => r[1]) // remove empty rows
    .forEach(r => {
      const id        = r[0] || "";
      const artist    = r[1] || "";
      const album     = r[2] || "";
      const yearRaw   = r[3] || "";
      const format    = r[4] || "";
      const value     = r[5] || "";
      const notes     = r[6] || "";
      const dateAdded = r[7] || "";
      const editLink  = r[8] || "";

      const year = extractYear(yearRaw);

      const cleanDate = dateAdded
        ? new Date(dateAdded).toLocaleDateString("en-GB")
        : "";

      const div = document.createElement("div");
      div.className = "browse-item";

      div.innerHTML = `
        <strong>${artist}</strong> – ${album}<br>
        <span>Year: ${year} | Format: ${format} | Value: £${value}</span><br>
        <span>Notes: ${notes}</span><br>
        <span>Date Added: ${cleanDate}</span>
      `;

      list.appendChild(div);
    });
}

// ---------------- TRACKS PAGE ----------------

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

// ---------------- SEARCH PAGE ----------------

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
    ${vinyls.map(r => `
