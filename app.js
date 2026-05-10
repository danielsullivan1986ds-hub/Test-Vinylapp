// ---------------- CONFIG ----------------
const API_URL = "https://script.google.com/macros/s/AKfycbxv32yAHJtL5dXMmCZO3tJ5yyKnG9eitlHzmReE2QjDPd6fIGGJgQmBPa9aba94g4C0pg/exec";

let vinylCache = [];
let trackCache = [];

// ---------------- NAVIGATION ----------------

document.querySelectorAll(".bottom-nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;
    if (!page) return;

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("page-" + page).classList.add("active");
  });
});

// ---------------- HELPERS ----------------

function extractYear(value) {
  if (!value) return "";
  if (typeof value === "string" && value.includes("-")) return value.slice(0, 4);
  if (value instanceof Date) return value.getFullYear();
  return String(value).slice(0, 4);
}

// ---------------- LOAD VINYLS ----------------

async function loadVinyls() {
  const data = await fetch(API_URL + "?sheet=Vinyl Inventory").then(r => r.json());
  const rows = data.slice(1);
  vinylCache = rows;

  renderHome(rows);
  renderBrowse(rows);
  populateAlbumFilter();
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

function renderBrowse(rows) {
  const list = document.getElementById("browseList");
  list.innerHTML = "";

  rows
    .filter(r => r[1])
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
        <span>Date Added: ${cleanDate}</span><br>

        <button class="edit-btn" onclick="window.open('${editLink}', '_blank')">Edit</button>
        <button class="delete-btn" onclick="confirmDelete('${id}')">Delete</button>
      `;

      list.appendChild(div);
    });
}




// ---------------- TRACKS PAGE ----------------

function populateAlbumFilter() {
  const select = document.getElementById("albumFilter");
  if (!select) return;

  select.innerHTML = `<option value="">All Albums</option>`;

  vinylCache.forEach(r => {
    const id = r[0];
    const artist = r[1];
    const album = r[2];

    const option = document.createElement("option");
    option.value = id;
    option.textContent = `${artist} – ${album}`;
    select.appendChild(option);
  });
}

function renderTracks(rows) {
  document.getElementById("trackList").innerHTML =
    rows.map(r => {
      const vinylId = r[0];
      const trackNum = r[1];
      const trackName = r[2];
      const genre = r[3];

      const vinyl = vinylCache.find(v => v[0] == vinylId);
      const artist = vinyl ? vinyl[1] : "";
      const album = vinyl ? vinyl[2] : "";

      return `
        <div class="browse-item">
          <strong>${artist}</strong> – ${album}<br>
          Track ${trackNum}: ${trackName}<br>
          Genre: ${genre}
        </div>
      `;
    }).join("");
}

document.getElementById("albumFilter").addEventListener("change", () => {
  const selected = document.getElementById("albumFilter").value;

  if (!selected) {
    renderTracks(trackCache);
    return;
  }

  const filtered = trackCache.filter(r => r[0] == selected);
  renderTracks(filtered);
});

async function addTrack() {
  const vinylId = document.getElementById("albumFilter").value;
  if (!vinylId) {
    alert("Select an album first");
    return;
  }

  const trackNum = document.getElementById("newTrackNum").value;
  const trackName = document.getElementById("newTrackName").value;
  const genre = document.getElementById("newTrackGenre").value;

  if (!trackNum || !trackName || !genre) {
    alert("Fill all fields");
    return;
  }

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      sheet: "Tracks",
      row: [vinylId, trackNum, trackName, genre]
    })
  });

  alert("Track added!");

  document.getElementById("newTrackNum").value = "";
  document.getElementById("newTrackName").value = "";
  document.getElementById("newTrackGenre").value = "";

  loadTracks();
}

["newTrackNum", "newTrackName", "newTrackGenre"].forEach(id => {
  document.getElementById(id).addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTrack();
    }
  });
});

// ---------------- INITIAL LOAD ----------------

loadVinyls();
loadTracks();
