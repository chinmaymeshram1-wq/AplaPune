// ----------------------------
// AplaPune prototype script.js
// ----------------------------

// Your MapTiler key
const MAPTILER_KEY = "KWO6K8xGWMGRZgSibjNN";

// Initialize map centered on Pune
const map = L.map("map").setView([18.5204, 73.8567], 12);

// MapTiler tile layer (Google-like streets style)
L.tileLayer(
  `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
  {
    attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> contributors',
    maxZoom: 20,
  }
).addTo(map);

// Geocoder (search bar)
const geocoder = L.Control.geocoder({
  defaultMarkGeocode: true,
  placeholder: "Search place in Pune...",
  showResultIcons: true,
  collapsed: false,
}).addTo(map);

// Routing control (OSRM)
let routingControl = null;

// In-memory structures
let userMarker = null;
let userLatLng = null;
const signals = [];
const SIGNAL_COUNT = 120;
const densityCircles = []; // for traffic density overlays
const crowdMarkers = []; // for crowd hotspots

// DOM element
const statusEl = document.getElementById("status");

// ---------------- Utility functions ----------------

function makeSignalIcon(isGreen) {
  const className = "signal-icon " + (isGreen ? "signal-green" : "signal-red");
  const emoji = isGreen ? "🟢" : "🔴";
  return L.divIcon({
    html: `<div class="${className}" title="Signal">${emoji}</div>`,
    className: "",
  });
}

function makeCountdownIcon(remaining, isGreen) {
  const cls = isGreen
    ? "countdown-label countdown-green"
    : "countdown-label countdown-red";
  return L.divIcon({
    html: `<div class="${cls}">${remaining}</div>`,
    className: "countdown-marker",
    iconSize: [30, 18],
    iconAnchor: [15, -10], // below the main circle
  });
}

// Random Pune lat/lng within bounding box
function randomPuneLatLng() {
  const latMin = 18.42,
    latMax = 18.62;
  const lonMin = 73.75,
    lonMax = 73.95;
  const lat = latMin + Math.random() * (latMax - latMin);
  const lon = lonMin + Math.random() * (lonMax - lonMin);
  return L.latLng(lat, lon);
}

// Random int inclusive
function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// ---------------- Create signals + density ----------------

for (let i = 0; i < SIGNAL_COUNT; i++) {
  const latlng = randomPuneLatLng();
  const isGreen = Math.random() > 0.5;
  const initialRemaining = randInt(10, 20);

  const marker = L.marker(latlng, { icon: makeSignalIcon(isGreen) }).addTo(map);
  marker.signalState = isGreen;
  marker.signalId = i + 1;
  marker.remaining = initialRemaining;

  // Simulated traffic density (1 = low, 2 = medium, 3 = high)
  const densityLevel = randInt(1, 3);
  marker.densityLevel = densityLevel;

  let fillColor;
  if (densityLevel === 1) fillColor = "rgba(46, 204, 113, 0.35)"; // green
  else if (densityLevel === 2)
    fillColor = "rgba(241, 196, 15, 0.45)"; // yellow
  else fillColor = "rgba(231, 76, 60, 0.55)"; // red

  const densityCircle = L.circle(latlng, {
    radius: 80,
    color: "transparent",
    fillColor: fillColor,
    fillOpacity: 0.8,
  });
  marker.densityCircle = densityCircle;
  densityCircles.push(densityCircle);

  // Countdown label marker (not always visible)
  const countdownMarker = L.marker(latlng, {
    icon: makeCountdownIcon(marker.remaining, marker.signalState),
    interactive: false,
  });
  marker.countdownMarker = countdownMarker;

  marker.bindPopup(
    `<b>Signal ${marker.signalId}</b><br>` +
      `Status: ${marker.signalState ? "🟢 GREEN" : "🔴 RED"}<br>` +
      `Traffic level: ${
        densityLevel === 1 ? "Low" : densityLevel === 2 ? "Medium" : "High"
      }<br>` +
      `<span id="popup-time-${marker.signalId}">${marker.remaining}</span>s`
  );

  marker.on("click", () => {
    if (userLatLng) {
      routeTo(userLatLng, marker.getLatLng());
    } else {
      alert(
        "Allow location (click 'Show my location') to route to this signal."
      );
    }
  });

  signals.push(marker);

  if (map.getZoom() >= 15) {
    countdownMarker.addTo(map);
  }
}

// ---------------- Crowd hotspots ----------------

const crowdPlaces = [
  { name: "Market Area 1", latlng: L.latLng(18.52, 73.84) },
  { name: "Mall Zone 2", latlng: L.latLng(18.53, 73.87) },
  { name: "Bus Stand Hub", latlng: L.latLng(18.5, 73.86) },
];

crowdPlaces.forEach((place) => {
  const m = L.marker(place.latlng, {
    icon: L.divIcon({
      html: '<div style="background:#8e44ad;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:14px;">👥</div>',
      className: "",
    }),
  }).bindPopup(`<b>${place.name}</b><br>Crowd hotspot (demo)`);

  crowdMarkers.push(m);
});

// ---------------- Legend ----------------

const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
  const div = L.DomUtil.create("div", "info legend");
  div.innerHTML =
    `<b>Legend</b><br>` +
    `🟢 Green: Go<br>` +
    `🔴 Red: Stop<br>` +
    `<span style="font-size:12px;">Zoom in (≥15) to view timers</span>`;
  return div;
};
legend.addTo(map);

// ---------------- Geocoder events ----------------

geocoder.on("markgeocode", function (e) {
  const center = e.geocode.center;
  map.setView(center, 15);
  if (userLatLng) {
    routeTo(userLatLng, center);
  } else {
    statusEl.textContent =
      "Search selected. Click 'Show my location' to route from your position.";
  }
});

// ---------------- User location ----------------

function locateUser() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported.");
    return;
  }
  statusEl.textContent = "Locating…";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      userLatLng = L.latLng(lat, lon);

      if (userMarker) map.removeLayer(userMarker);

      const userIcon = L.divIcon({
        html: '<div class="user-icon">You</div>',
        className: "",
      });

      userMarker = L.marker(userLatLng, { icon: userIcon })
        .addTo(map)
        .bindPopup("📍 You are here")
        .openPopup();

      map.setView(userLatLng, 14);
      statusEl.textContent = "Location found";
    },
    (err) => {
      console.error(err);
      alert("Could not get location: " + err.message);
      statusEl.textContent = "Location denied/unavailable";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ---------------- Routing ----------------

function routeTo(originLatLng, destLatLng) {
  if (routingControl) {
    map.removeControl(routingControl);
  }
  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(originLatLng.lat, originLatLng.lng),
      L.latLng(destLatLng.lat, destLatLng.lng),
    ],
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1",
    }),
    show: true,
    addWaypoints: false,
    routeWhileDragging: false,
    draggableWaypoints: false,
    fitSelectedRoute: true,
    createMarker: function () {
      return null;
    },
  }).addTo(map);
}

// ---------------- Nearest signal ----------------

function findNearestSignal() {
  if (!userLatLng) {
    alert("Click 'Show my location' first.");
    return;
  }
  let minDist = Infinity;
  let nearest = null;
  signals.forEach((sig) => {
    const d = userLatLng.distanceTo(sig.getLatLng());
    if (d < minDist) {
      minDist = d;
      nearest = sig;
    }
  });
  if (nearest) {
    nearest.openPopup();
    map.setView(nearest.getLatLng(), 15);
    routeTo(userLatLng, nearest.getLatLng());
  } else {
    alert("No signals found.");
  }
}

// Buttons
document
  .getElementById("locate-btn")
  .addEventListener("click", () => locateUser());
document
  .getElementById("nearest-signal-btn")
  .addEventListener("click", () => findNearestSignal());

// ---------------- Countdown + toggle logic ----------------

function tickAllSignals() {
  const showTimers = map.getZoom() >= 15;

  signals.forEach((marker) => {
    marker.remaining = Math.max(
      0,
      (marker.remaining === undefined ? randInt(10, 20) : marker.remaining) - 1
    );

    if (marker.remaining <= 0) {
      marker.signalState = !marker.signalState;
      marker.remaining = randInt(10, 20);
      marker.setIcon(makeSignalIcon(marker.signalState));
    }

    const popupContent =
      `<b>Signal ${marker.signalId}</b><br>` +
      `Status: ${marker.signalState ? "🟢 GREEN" : "🔴 RED"}<br>` +
      `Traffic level: ${
        marker.densityLevel === 1
          ? "Low"
          : marker.densityLevel === 2
          ? "Medium"
          : "High"
      }<br>` +
      `<span id="popup-time-${marker.signalId}">${marker.remaining}</span>s`;
    marker.setPopupContent(popupContent);

    const cm = marker.countdownMarker;
    if (cm) {
      const newIcon = makeCountdownIcon(marker.remaining, marker.signalState);
      cm.setIcon(newIcon);

      if (showTimers) {
        if (!map.hasLayer(cm)) cm.addTo(map);
      } else {
        if (map.hasLayer(cm)) map.removeLayer(cm);
      }
    }
  });
}

setInterval(tickAllSignals, 1000);

map.on("zoomend", () => {
  const showTimers = map.getZoom() >= 15;
  signals.forEach((marker) => {
    const cm = marker.countdownMarker;
    if (!cm) return;
    if (showTimers) {
      if (!map.hasLayer(cm)) cm.addTo(map);
    } else {
      if (map.hasLayer(cm)) map.removeLayer(cm);
    }
  });
});

// ---------------- View modes via chips ----------------

const chips = document.querySelectorAll(".chip");

function setActiveChip(mode) {
  chips.forEach((c) => c.classList.remove("chip-active"));
  const active = document.querySelector(`.chip[data-mode="${mode}"]`);
  if (active) active.classList.add("chip-active");
}

function showSignalsMode() {
  densityCircles.forEach((c) => {
    if (map.hasLayer(c)) map.removeLayer(c);
  });
  crowdMarkers.forEach((m) => {
    if (map.hasLayer(m)) map.removeLayer(m);
  });
}

function showDensityMode() {
  densityCircles.forEach((c) => {
    if (!map.hasLayer(c)) map.addLayer(c);
  });
  crowdMarkers.forEach((m) => {
    if (map.hasLayer(m)) map.removeLayer(m);
  });
}

function showCrowdMode() {
  densityCircles.forEach((c) => {
    if (map.hasLayer(c)) map.removeLayer(c);
  });
  crowdMarkers.forEach((m) => {
    if (!map.hasLayer(m)) map.addLayer(m);
  });
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const mode = chip.dataset.mode;
    setActiveChip(mode);
    if (mode === "signals") showSignalsMode();
    else if (mode === "density") showDensityMode();
    else if (mode === "crowd") showCrowdMode();
  });
});

// default mode
setActiveChip("signals");
showSignalsMode();
