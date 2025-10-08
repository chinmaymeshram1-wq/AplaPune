// ----------------------------
// AplaPune prototype script.js (with countdown labels outside circles)
// MAPTILER KEY: use your key
const MAPTILER_KEY = "KWO6K8xGWMGRZgSibjNN";

// Initialize map centered on Pune
const map = L.map("map").setView([18.5204, 73.8567], 12);

// MapTiler tile layer
L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, {
  attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> contributors',
  maxZoom: 20,
}).addTo(map);

// Controls: Geocoder (search)
const geocoder = L.Control.geocoder({
  defaultMarkGeocode: true,
  placeholder: "Search place in Pune...",
  showResultIcons: true,
  collapsed: false
}).addTo(map);

// Routing control variable
let routingControl = null;

// In-memory structures
let userMarker = null;
let userLatLng = null;
const signals = [];
const SIGNAL_COUNT = 120;

// Status element
const statusEl = document.getElementById("status");

// Create signal DivIcon (only circle emoji)
function makeSignalIcon(isGreen) {
  const className = "signal-icon " + (isGreen ? "signal-green" : "signal-red");
  const emoji = isGreen ? "🟢" : "🔴";
  return L.divIcon({
    html: `<div class="${className}" title="Signal">${emoji}</div>`,
    className: ""
  });
}

// Create countdown DivIcon (shows number)
function makeCountdownIcon(remaining, isGreen) {
  const cls = isGreen ? "countdown-label countdown-green" : "countdown-label countdown-red";
  return L.divIcon({
    html: `<div class="${cls}">${remaining}</div>`,
    className: "countdown-marker",
    iconSize: [30, 18],
    iconAnchor: [15, -10] // place below signal marker
  });
}

// Random Pune lat/lng within bounding box
function randomPuneLatLng() {
  const latMin = 18.4200, latMax = 18.6200;
  const lonMin = 73.7500, lonMax = 73.9500;
  const lat = latMin + Math.random() * (latMax - latMin);
  const lon = lonMin + Math.random() * (lonMax - lonMin);
  return L.latLng(lat, lon);
}

// Helper random int inclusive
function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// Create signals with associated countdown marker
for (let i = 0; i < SIGNAL_COUNT; i++) {
  const latlng = randomPuneLatLng();
  const isGreen = Math.random() > 0.5;
  const initialRemaining = randInt(10, 20);

  const marker = L.marker(latlng, { icon: makeSignalIcon(isGreen) }).addTo(map);
  marker.signalState = isGreen;
  marker.signalId = i + 1;
  marker.remaining = initialRemaining;

  // attach a separate marker for countdown label (positioned at same latlng)
  const countdownMarker = L.marker(latlng, {
    icon: makeCountdownIcon(marker.remaining, marker.signalState),
    interactive: false // click passes through to main marker
  });

  // store reference
  marker.countdownMarker = countdownMarker;

  // Popup content (updated later)
  marker.bindPopup(`<b>Signal ${marker.signalId}</b><br>Status: ${marker.signalState ? "🟢 GREEN" : "🔴 RED"}<br><span id="popup-time-${marker.signalId}">${marker.remaining}</span>s`);

  // On click, route from user to this signal (if user known)
  marker.on("click", () => {
    if (userLatLng) {
      routeTo(userLatLng, marker.getLatLng());
    } else {
      alert("Allow location (click 'Show my location') to route to this signal.");
    }
  });

  // add objects to signals list
  signals.push(marker);

  // Only add countdown marker to map if zoom >= 15 (we'll manage visibility later)
  if (map.getZoom() >= 15) {
    countdownMarker.addTo(map);
  }
}

// Legend control
const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
  const div = L.DomUtil.create("div", "info legend");
  div.innerHTML = `<b>Legend</b><br>🟢 Green: Go<br>🔴 Red: Stop<br><small>Zoom in (>=15) to view timers</small>`;
  return div;
};
legend.addTo(map);

// Geocoder handling: when user selects a place, center and route if user position known
geocoder.on('markgeocode', function(e) {
  const center = e.geocode.center;
  map.setView(center, 15);
  if (userLatLng) {
    routeTo(userLatLng, center);
  } else {
    statusEl.textContent = "Search selected. Click 'Show my location' to route from your position.";
  }
});

// Locate user
function locateUser() {
  if (!navigator.geolocation) { alert("Geolocation not supported."); return; }
  statusEl.textContent = "Locating…";
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    userLatLng = L.latLng(lat, lon);
    if (userMarker) map.removeLayer(userMarker);

    const userIcon = L.divIcon({
      html: '<div class="user-icon">You</div>',
      className: ''
    });

    userMarker = L.marker(userLatLng, { icon: userIcon }).addTo(map).bindPopup("📍 You are here").openPopup();
    map.setView(userLatLng, 14);
    statusEl.textContent = "Location found";
  }, err => {
    console.error(err);
    alert("Could not get location: " + err.message);
    statusEl.textContent = "Location denied/unavailable";
  }, { enableHighAccuracy: true, timeout: 10000 });
}

// Routing function using OSRM via leaflet-routing-machine
function routeTo(originLatLng, destLatLng) {
  if (routingControl) {
    map.removeControl(routingControl);
  }
  routingControl = L.Routing.control({
    waypoints: [L.latLng(originLatLng.lat, originLatLng.lng), L.latLng(destLatLng.lat, destLatLng.lng)],
    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
    show: true,
    addWaypoints: false,
    routeWhileDragging: false,
    draggableWaypoints: false,
    fitSelectedRoute: true,
    createMarker: function() { return null; }
  }).addTo(map);
}

// Find nearest signal to user
function findNearestSignal() {
  if (!userLatLng) { alert("Click 'Show my location' first."); return; }
  let minDist = Infinity, nearest = null;
  signals.forEach(sig => {
    const d = userLatLng.distanceTo(sig.getLatLng());
    if (d < minDist) { minDist = d; nearest = sig; }
  });
  if (nearest) {
    nearest.openPopup();
    map.setView(nearest.getLatLng(), 15);
    routeTo(userLatLng, nearest.getLatLng());
  } else alert("No signals found.");
}

// Buttons
document.getElementById("locate-btn").addEventListener("click", locateUser);
document.getElementById("nearest-signal-btn").addEventListener("click", findNearestSignal);

// --------- Countdown & toggle logic (single central timer) ----------

// Update function called every second
function tickAllSignals() {
  const showTimers = map.getZoom() >= 15;
  signals.forEach(marker => {
    // decrement remaining
    marker.remaining = Math.max(0, (marker.remaining === undefined ? randInt(10,20) : marker.remaining) - 1);

    // if remaining hits 0 toggle state & reset
    if (marker.remaining <= 0) {
      marker.signalState = !marker.signalState;
      marker.remaining = randInt(10, 20);
      // update the circle icon color
      marker.setIcon(makeSignalIcon(marker.signalState));
    }

    // update popup's time if open (and update popup content)
    const popupContent = `<b>Signal ${marker.signalId}</b><br>Status: ${marker.signalState ? "🟢 GREEN" : "🔴 RED"}<br><span id="popup-time-${marker.signalId}">${marker.remaining}</span>s`;
    marker.setPopupContent(popupContent);

    // manage countdown marker: update icon and visibility
    const cm = marker.countdownMarker;
    if (cm) {
      // update its icon html (color depends on signal)
      const newIcon = makeCountdownIcon(marker.remaining, marker.signalState);
      cm.setIcon(newIcon);

      // show or hide depending on zoom
      if (showTimers) {
        if (!map.hasLayer(cm)) {
          cm.addTo(map);
        }
      } else {
        if (map.hasLayer(cm)) {
          map.removeLayer(cm);
        }
      }
    }
  });
}

// Start ticking every 1s
setInterval(tickAllSignals, 1000);

// Also update label visibility when zoom changes (instant)
map.on('zoomend', () => {
  const showTimers = map.getZoom() >= 15;
  signals.forEach(marker => {
    const cm = marker.countdownMarker;
    if (!cm) return;
    if (showTimers) {
      if (!map.hasLayer(cm)) cm.addTo(map);
    } else {
      if (map.hasLayer(cm)) map.removeLayer(cm);
    }
  });
});
