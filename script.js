// ===============================
// AplaPune – Advanced Navigation
// ===============================

const MAPTILER_KEY = "KWO6K8xGWMGRZgSibjNN";

// ---------------- MAP INIT ----------------
const map = L.map("map", { zoomControl: false }).setView([18.5204, 73.8567], 12);

// Google-like map style (HYBRID – very realistic)
L.tileLayer(
  `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
  { maxZoom: 20 }
).addTo(map);

// Google-like zoom controls
L.control.zoom({ position: "bottomright" }).addTo(map);

// ---------------- SEARCH ----------------
const geocoder = L.Control.geocoder({
  defaultMarkGeocode: true,
  placeholder: "Search destination…",
  collapsed: false
}).addTo(map);

// ---------------- GLOBALS ----------------
let userLatLng = null;
let userMarker = null;
let routingControl = null;
let animatedRoute = null;

// ---------------- USER LOCATION ----------------
document.getElementById("locate-btn").onclick = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    userLatLng = L.latLng(pos.coords.latitude, pos.coords.longitude);

    if (userMarker) map.removeLayer(userMarker);

    userMarker = L.marker(userLatLng, {
      icon: L.divIcon({
        html: '<div class="user-icon">You</div>',
        className: ""
      })
    }).addTo(map).bindPopup("📍 You are here");

    map.flyTo(userLatLng, 15, { duration: 1.5 });
  });
};

// ---------------- ROUTE ANIMATION ----------------
function animateRoute(coords) {
  if (animatedRoute) map.removeLayer(animatedRoute);

  animatedRoute = L.polyline([], {
    color: "#1a73e8",
    weight: 6,
    opacity: 0.9
  }).addTo(map);

  let i = 0;
  const draw = setInterval(() => {
    animatedRoute.addLatLng(coords[i]);
    i++;
    if (i >= coords.length) clearInterval(draw);
  }, 35);
}

// ---------------- ROUTING FUNCTION ----------------
function routeTo(destination) {
  if (!userLatLng) {
    alert("Please enable location first");
    return;
  }

  if (routingControl) map.removeControl(routingControl);

  routingControl = L.Routing.control({
    waypoints: [userLatLng, destination],
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1"
    }),
    show: false,
    addWaypoints: false,
    createMarker: () => null
  })
    .on("routesfound", e => {
      const coords = e.routes[0].coordinates;

      map.flyToBounds(L.latLngBounds(coords), {
        padding: [60, 60],
        duration: 1.5
      });

      animateRoute(coords);
    })
    .addTo(map);
}

// ---------------- SEARCH EVENT ----------------
geocoder.on("markgeocode", e => {
  routeTo(e.geocode.center);
});

// ---------------- DEMO SIGNAL ----------------
const signal = L.marker([18.5196, 73.8553], {
  icon: L.divIcon({
    html: '<div class="signal-icon signal-red">🔴</div>',
    className: ""
  })
}).addTo(map).bindPopup("Signal – Demo");

signal.on("click", () => {
  routeTo(signal.getLatLng());
});
