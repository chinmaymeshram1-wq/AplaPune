// ===============================
// AplaPune - Smart Traffic Map
// Backend JS (Leaflet + MapTiler)
// ===============================

// 🔑 Your MapTiler API Key
const MAPTILER_KEY = "KWO6K8xGWMGRZgSibjNN";

// 🗺️ Initialize the map centered on Pune
var map = L.map("map").setView([18.5204, 73.8567], 12);

// 🗺️ Add MapTiler layer
L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, {
  attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> contributors',
}).addTo(map);

// 📍 Show user's real-time location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      L.marker([lat, lon], {
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
          iconSize: [35, 35],
        }),
      })
        .addTo(map)
        .bindPopup("📍 You are here")
        .openPopup();

      map.setView([lat, lon], 14);
    },
    () => {
      alert("⚠️ Location permission denied. Showing Pune map.");
    }
  );
} else {
  alert("❌ Geolocation is not supported by your browser.");
}

// 🚦 Create 100+ random traffic signal markers
const totalSignals = 120;
const signals = [];

for (let i = 0; i < totalSignals; i++) {
  // Randomize location near Pune
  let lat = 18.5 + Math.random() * 0.1; // ~ Pune range
  let lon = 73.8 + Math.random() * 0.1;

  // Start with a random state (red or green)
  let isGreen = Math.random() > 0.5;

  let icon = L.icon({
    iconUrl: isGreen
      ? "https://cdn-icons-png.flaticon.com/512/483/483947.png" // green light
      : "https://cdn-icons-png.flaticon.com/512/483/483920.png", // red light
    iconSize: [28, 28],
  });

  let marker = L.marker([lat, lon], { icon }).addTo(map);
  marker.signalState = isGreen;

  signals.push(marker);

  // Auto change signal state randomly (10–15 sec)
  setInterval(() => {
    marker.signalState = !marker.signalState;
    marker.setIcon(
      L.icon({
        iconUrl: marker.signalState
          ? "https://cdn-icons-png.flaticon.com/512/483/483947.png"
          : "https://cdn-icons-png.flaticon.com/512/483/483920.png",
        iconSize: [28, 28],
      })
    );
  }, 10000 + Math.random() * 5000); // 10–15 seconds
}

// 🟢🔴 Optional Legend
const legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
  const div = L.DomUtil.create("div", "info legend");
  div.innerHTML = `
    <h4>Signal Legend</h4>
    <p>🟢 Green: Go</p>
    <p>🔴 Red: Stop</p>
  `;
  div.style.background = "white";
  div.style.padding = "8px";
  div.style.borderRadius = "8px";
  div.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  return div;
};
legend.addTo(map);
