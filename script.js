/* Basic layout and styles */
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; padding: 0; font-family: Arial, sans-serif; background:#f4f6f8; }
header {
  background: #2c3e50;
  color: #fff;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
}
header h1 { margin: 0; font-size: 20px; }
#top-controls { display:flex; gap:8px; align-items:center; }
#top-controls button {
  background: #fff; color:#2c3e50; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
#top-controls button:hover { transform: translateY(-1px); }
#status { color:#fff; font-size:14px; margin-left:8px; }

/* Map occupies remainder */
#map { height: calc(100vh - 56px); width: 100%; }

/* Legend / info box */
.leaflet-control.info {
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  line-height: 1.4;
}

/* Signal marker styles using DivIcon classes */
.signal-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 16px;
  color: white;
  text-shadow: 0 1px 1px rgba(0,0,0,0.3);
  border: 2px solid rgba(0,0,0,0.1);
}
.signal-green { background: #2ecc71; }
.signal-red { background: #e74c3c; }

/* User marker icon style (if using CSS-based) */
.user-icon {
  display:inline-block;
  width:32px; height:32px;
  border-radius:50%;
  background:#1976d2;
  box-shadow:0 2px 6px rgba(0,0,0,0.3);
  color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold;
}

/* Responsive adjustments */
@media (max-width:600px) {
  header { padding:10px; flex-direction:column; gap:8px; align-items:flex-start; }
  #top-controls { width:100%; }
}
