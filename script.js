// ----------------------------
// AplaPune prototype script.js
// MapTiler key (replace if you want): provided by you
const MAPTILER_KEY = "KWO6K8xGWMGRZgSibjNN";

// Initialize map centered on Pune
const map = L.map("map").setView([18.5204, 73.8567], 12);

// MapTiler tile layer (Streets)
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

// Routing control variable (we'll create a control when routing)
// Use public OSRM service via leaflet-routing-machine (demo, not for production)
let routingControl = null;

// In-memory structures
let userMarker = null;
let userLatLng = null;
const signals = [];
const SIGNAL_COUNT = 120;

// Status element
const statusEl = document.getElementById("status");

// Utility: create a DivIcon for a signal
function makeSignalIcon(isGreen) {
  const className = "signal-icon " + (isGreen ? "signal-green" : "signal-red");
  const emoji = isGreen ? "🟢" : "🔴";
  return L.divIcon({
    html: `<div class="${className}" title="Signal">${emoji}</div>`,
    className: ""  // keep empty so only inner styles apply
  });
}

// Generate random coordinates within Pune approximate bounds
function randomPuneLatLng() {
  // Pune approx bounding box
  const latMin = 18.4200, latMax = 18.6200;
  const lonMin = 73.7500, lonMax = 73.9500;
  const lat = latMin + Math.random() * (latMax - latMin);
  const lon = lonMin + Math.random() * (lonMax - lonMin);
  return L.latLng(lat, lon);
}

// Create signal markers
for (let i = 0; i < SIGNAL_COUNT; i++) {
  const latlng = randomPuneLatLng();
  const isGreen = Math.random() > 0.5;
  const marker = L.marker(latlng, { icon: makeSignalIcon(isGreen) }).addTo(map);
  marker.signalState = isGreen; // custom property
  marker.signalId = "signal_" + i;
  marker.bindPopup(`<b>Signal ${i+1}</b><br>Status: ${isGreen ? "🟢 GREEN" : "🔴 RED" }<br>Click to route here.`);
  // on click, route user to that signal
  marker.on("click", () => {
    if (userLatLng) {
      routeTo(userLatLng, marker.getLatLng());
    } else {
      alert("Allow location (click 'Show my location') so we can route you to the signal.");
    }
  });

  // toggle each marker independently at random intervals 10-15s
  (function(m) {
    function toggle() {
      m.signalState = !m.signalState;
      m.setIcon(makeSignalIcon(m.signalState));
      // update popup content
      m.setPopupContent(`<b>Signal ${m.signalId}</b><br>Status: ${m.signalState ? "🟢 GREEN" : "🔴 RED"}<br>Click to route here.`);
      // schedule next toggle
      const next = 10000 + Math.random() * 5000; // 10-15s
      m._toggleTimer = setTimeout(toggle, next);
    }
    // initial timer
    const first = 10000 + Math.random() * 5000;
    m._toggleTimer = setTimeout(toggle, first);
  })(marker);

  signals.push(marker);
}

// Add legend control
const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
  const div = L.DomUtil.create("div", "info legend");
  div.innerHTML = `<b>Legend</b><br>🟢 Green: Go<br>🔴 Red: Stop<br><small>Click a signal to route to it</small>`;
  return div;
};
legend.addTo(map);

// Geocoder result handling: when user searches and geocoder marks a place,
// center map and route if user's location available.
geocoder.on('markgeocode', function(e) {
  const center = e.geocode.center;
  map.setView(center, 15);
  // if user exists, route
  if (userLatLng) {
    routeTo(userLatLng, center);
  } else {
    statusEl.textContent = "Search result selected; click 'Show my location' to route from your position.";
  }
});

// Request user location and show marker
async function locateUser() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported by your browser.");
    return;
  }
  statusEl.textContent = "Locating…";
  navigator.geolocation.getCurrentPosition(function (pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    userLatLng = L.latLng(lat, lon);
    if (userMarker) map.removeLayer(userMarker);

    // custom user icon
    const userIcon = L.divIcon({
      html: '<div class="user-icon">You</div>',
      className: ''
    });

    userMarker = L.marker(userLatLng, { icon: userIcon }).addTo(map).bindPopup("📍 You are here").openPopup();
    map.setView(userLatLng, 14);
    statusEl.textContent = "Location found";
  }, function (err) {
    console.error(err);
    alert("Could not get location: " + err.message);
    statusEl.textContent = "Location denied or unavailable";
  }, { enableHighAccuracy: true, timeout: 10000 });
}

// Route from origin to destination using OSRM and Leaflet Routing Machine
function routeTo(originLatLng, destLatLng) {
  // remove previous route
  if (routingControl) {
    map.removeControl(routingControl);
  }
  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(originLatLng.lat, originLatLng.lng),
      L.latLng(destLatLng.lat, destLatLng.lng)
    ],
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
    show: true,
    addWaypoints: false,
    routeWhileDragging: false,
    draggableWaypoints: false,
    fitSelectedRoute: true,
    createMarker: function() { return null; } // don't create default markers (we already have)
  }).addTo(map);
}

// Find nearest signal to user
function findNearestSignal() {
  if (!userLatLng) {
    alert("Please click 'Show my location' first.");
    return;
  }
  let minDist = Infinity;
  let nearest = null;
  signals.forEach(sig => {
    const d = userLatLng.distanceTo(sig.getLatLng()); // meters
    if (d < minDist) { minDist = d; nearest = sig; }
  });
  if (nearest) {
    // open popup and center
    nearest.openPopup();
    map.setView(nearest.getLatLng(), 15);
    // draw route
    routeTo(userLatLng, nearest.getLatLng());
  } else {
    alert("No signals found.");
  }
}

// Buttons
document.getElementById("locate-btn").addEventListener("click", () => locateUser());
document.getElementById("nearest-signal-btn").addEventListener("click", () => findNearestSignal());

// Optional: automatically attempt to locate on load (commented out to avoid auto prompts)
// locateUser();
