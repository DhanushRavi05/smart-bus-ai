/* ==========================================================================
   TN SMARTBUS AI ENTERPRISE PORTAL - LEAFLET MAP MODULE
   Handles Esri World Imagery Satellite Toggles, Marker Updates & Route Polylines
   ========================================================================== */

let dashMap = null;
let fullMap = null;
let busMarkers = {};
let dashOsmLayer = null;
let dashSatLayer = null;
let fullOsmLayer = null;
let fullSatLayer = null;
let isSatelliteDash = false;
let isSatelliteFull = false;
let dashInitialized = false;
let fullInitialized = false;

function createOsmLayer() {
  return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  });
}

function createSatLayer() {
  return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri'
  });
}

function initDashMap() {
  if (dashInitialized) return;
  const dashEl = document.getElementById('dashboard-map');
  if (!dashEl) return;

  const chennaiCenter = [11.1271, 78.6569]; // TN center

  dashMap = L.map('dashboard-map', {
    center: chennaiCenter,
    zoom: 7,
    zoomControl: true
  });

  dashOsmLayer = createOsmLayer();
  dashSatLayer = createSatLayer();
  dashOsmLayer.addTo(dashMap);
  dashInitialized = true;

  // Force resize after a tick
  setTimeout(function() { dashMap.invalidateSize(); }, 100);
}

function initFullMap() {
  if (fullInitialized) return;
  const fullEl = document.getElementById('map-container');
  if (!fullEl) return;

  const chennaiCenter = [11.1271, 78.6569];

  fullMap = L.map('map-container', {
    center: chennaiCenter,
    zoom: 7,
    zoomControl: true
  });

  fullOsmLayer = createOsmLayer();
  fullSatLayer = createSatLayer();
  fullSatLayer.addTo(fullMap); // Default satellite for full map
  isSatelliteFull = true;
  fullInitialized = true;

  setTimeout(function() { fullMap.invalidateSize(); }, 100);
}

function initMaps() {
  // Only init the dashboard map on load (it's visible)
  initDashMap();
  // Full map is deferred until the user navigates to it
}

// Toggle Satellite Mode for Dashboard Map
function toggleSatelliteDashboard() {
  if (!dashMap) return;
  isSatelliteDash = !isSatelliteDash;
  if (isSatelliteDash) {
    if (dashMap.hasLayer(dashOsmLayer)) dashMap.removeLayer(dashOsmLayer);
    if (!dashMap.hasLayer(dashSatLayer)) dashSatLayer.addTo(dashMap);
  } else {
    if (dashMap.hasLayer(dashSatLayer)) dashMap.removeLayer(dashSatLayer);
    if (!dashMap.hasLayer(dashOsmLayer)) dashOsmLayer.addTo(dashMap);
  }
}

// Toggle Satellite Mode for Full Map
function toggleSatelliteFull() {
  if (!fullMap) return;
  isSatelliteFull = !isSatelliteFull;
  if (isSatelliteFull) {
    if (fullMap.hasLayer(fullOsmLayer)) fullMap.removeLayer(fullOsmLayer);
    if (!fullMap.hasLayer(fullSatLayer)) fullSatLayer.addTo(fullMap);
  } else {
    if (fullMap.hasLayer(fullSatLayer)) fullMap.removeLayer(fullSatLayer);
    if (!fullMap.hasLayer(fullOsmLayer)) fullOsmLayer.addTo(fullMap);
  }
}

// Custom Pulsing Bus Marker Icon
function createBusIcon(isOverloaded) {
  var color = isOverloaded ? '#ef4444' : '#10b981';
  return L.divIcon({
    className: 'custom-bus-marker',
    html: '<div style="width:34px;height:34px;border-radius:50%;background:' + color + ';border:3px solid #fff;box-shadow:0 0 15px ' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;"><i class="fa-solid fa-bus"></i></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

// Render Bus Markers on Maps
function updateMapMarkers(buses) {
  if (!buses || !Array.isArray(buses)) return;

  buses.forEach(function(bus) {
    var lat = bus.latitude;
    var lng = bus.longitude;
    var isOverloaded = bus.currentPassengers > bus.capacity;
    var icon = createBusIcon(isOverloaded);
    var statusColor = isOverloaded ? '#dc2626' : '#059669';

    var popupContent = '<div style="font-family:Outfit,sans-serif;width:230px;">' +
      '<img src="' + (bus.busPhoto || '/images/mtc_bus.jpg') + '" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display=\'none\'">' +
      '<h4 style="margin:0;color:#111;font-size:1rem;">' + bus.busNumber + '</h4>' +
      '<p style="margin:2px 0;font-size:0.78rem;color:#555;"><b>Division:</b> ' + bus.division + '</p>' +
      '<p style="margin:2px 0;font-size:0.78rem;color:#555;"><b>Route:</b> ' + (bus.routeNumber || 'N/A') + '</p>' +
      '<p style="margin:2px 0;font-size:0.78rem;color:#555;"><b>Driver:</b> ' + bus.driverName + '</p>' +
      '<p style="margin:2px 0;font-size:0.78rem;color:#555;"><b>Speed:</b> ' + bus.speed + ' km/h</p>' +
      '<p style="margin:2px 0;font-size:0.78rem;color:' + statusColor + ';font-weight:bold;">Passengers: ' + bus.currentPassengers + ' / ' + bus.capacity + '</p>' +
      '</div>';

    // Dashboard map marker
    if (dashMap) {
      var dashKey = 'dash_' + bus._id;
      if (busMarkers[dashKey]) {
        busMarkers[dashKey].setLatLng([lat, lng]);
        busMarkers[dashKey].setPopupContent(popupContent);
      } else {
        var dm = L.marker([lat, lng], { icon: icon }).addTo(dashMap);
        dm.bindPopup(popupContent);
        busMarkers[dashKey] = dm;
      }
    }

    // Full map marker
    if (fullMap) {
      var fullKey = 'full_' + bus._id;
      if (busMarkers[fullKey]) {
        busMarkers[fullKey].setLatLng([lat, lng]);
        busMarkers[fullKey].setPopupContent(popupContent);
      } else {
        var fm = L.marker([lat, lng], { icon: icon }).addTo(fullMap);
        fm.bindPopup(popupContent);
        busMarkers[fullKey] = fm;
      }
    }
  });
}
