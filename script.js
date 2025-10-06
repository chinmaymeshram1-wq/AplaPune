// Initialize the map centered on Pune
var map = L.map('map').setView([18.5204, 73.8567], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Dummy traffic signals data
const signals = [
  { name: "Swargate Chowk", lat: 18.5010, lon: 73.8631, status: "RED" },
  { name: "Shivajinagar", lat: 18.5308, lon: 73.8476, status: "GREEN" },
  { name: "Katraj Chowk", lat: 18.4575, lon: 73.8667, status: "RED" },
  { name: "Deccan Gymkhana", lat: 18.5164, lon: 73.8411, status: "GREEN" }
];

// Add markers with red or green icons
signals.forEach(signal => {
  const color = signal.status === "RED" ? "🔴" : "🟢";
  L.marker([signal.lat, signal.lon])
    .addTo(map)
    .bindPopup(`<b>${signal.name}</b><br>Status: ${color} ${signal.status}`);
});
