/* ==========================================================================
   TN SMARTBUS AI ENTERPRISE PORTAL - LEAFLET MAP MODULE
   Handles Esri World Imagery Satellite Toggles, Marker Updates & Route Polylines
   ========================================================================== */

let dashMap = null;
let fullMap = null;
let busMarkers = {};

// Tile Layers
const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
});

const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 18,
  attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

let isSatelliteActive = false;

function initMaps() {
  const chennaiCenter = [13.0827, 80.2707];

  // 1. Dashboard Map
  const dashEl = document.getElementById('dashboard-map');
  if (dashEl) {
    dashMap = L.map('dashboard-map', {
      center: chennaiCenter,
      zoom: 10,
      zoomControl: true
    });
    osmStandard.addTo(dashMap);
  }

  // 2. Full Satellite View Map
  const fullEl = document.getElementById('map-container');
  if (fullEl) {
    fullMap = L.map('map-container', {
      center: chennaiCenter,
      zoom: 9,
      zoomControl: true
    });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18
    }).addTo(fullMap);
  }
}

// Toggle Satellite Mode
function toggleSatelliteMode() {
  isSatelliteActive = !isSatelliteActive;
  if (dashMap) {
    if (isSatelliteActive) {
      dashMap.removeLayer(osmStandard);
      esriSatellite.addTo(dashMap);
    } else {
      dashMap.removeLayer(esriSatellite);
      osmStandard.addTo(dashMap);
    }
  }
}

// Custom Pulsing Bus Marker Icon
function createBusIcon(isOverloaded) {
  const color = isOverloaded ? '#ef4444' : '#10b981';
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid #ffffff;
        box-shadow: 0 0 15px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 16px;
      ">
        <i class="fa-solid fa-bus"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

// Render Bus Markers on Maps
function updateMapMarkers(buses) {
  if (!buses) return;

  buses.forEach(bus => {
    const lat = bus.latitude;
    const lng = bus.longitude;
    const isOverloaded = bus.currentPassengers > bus.capacity;
    const icon = createBusIcon(isOverloaded);

    const popupContent = `
      <div style="font-family: sans-serif; width: 220px;">
        <img src="${bus.busPhoto || '/images/mtc_bus.jpg'}" style="width:100%; height:110px; object-fit:cover; border-radius:8px; margin-bottom:8px;">
        <h4 style="margin:0; color:#111; font-size:1rem;">${bus.busNumber}</h4>
        <p style="margin:2px 0; font-size:0.78rem; color:#555;"><b>Division:</b> ${bus.division}</p>
        <p style="margin:2px 0; font-size:0.78rem; color:#555;"><b>Driver:</b> ${bus.driverName}</p>
        <p style="margin:2px 0; font-size:0.78rem; color:#555;"><b>Speed:</b> ${bus.speed} km/h</p>
        <p style="margin:2px 0; font-size:0.78rem; color:${isOverloaded ? '#dc2626' : '#059669'}; font-weight:bold;">
          Commuters: ${bus.currentPassengers} / ${bus.capacity}
        </p>
      </div>
    `;

    // Dashboard map marker
    if (dashMap) {
      if (busMarkers['dash_' + bus._id]) {
        busMarkers['dash_' + bus._id].setLatLng([lat, lng]);
      } else {
        const m = L.marker([lat, lng], { icon: icon }).addTo(dashMap);
        m.bindPopup(popupContent);
        busMarkers['dash_' + bus._id] = m;
      }
    }

    // Full map marker
    if (fullMap) {
      if (busMarkers['full_' + bus._id]) {
        busMarkers['full_' + bus._id].setLatLng([lat, lng]);
      } else {
        const m = L.marker([lat, lng], { icon: icon }).addTo(fullMap);
        m.bindPopup(popupContent);
        busMarkers['full_' + bus._id] = m;
      }
    }
  });
}
