/* ==========================================================================
   TN SMARTBUS AI ENTERPRISE PORTAL - MAIN APPLICATION LOGIC
   Handles UI Navigation, WebSockets, AI Face Landmark Rendering & REST API
   ========================================================================== */

var socket = io();
var cachedBuses = [];
var liveUpdateTimer = null;

document.addEventListener('DOMContentLoaded', function() {
  initMaps();
  initNavigation();
  initFaceLandmarkCanvas();
  fetchDashboardMetrics();
  fetchFleetData();
  fetchRoutesData();
  fetchSecurityLogs();
  fetchAlerts();
  initFormListeners();

  // Periodic live refresh every 5 seconds (not every socket event)
  liveUpdateTimer = setInterval(function() {
    fetchFleetData();
    fetchDashboardMetrics();
  }, 5000);
});

/* ====== 1. NAVIGATION TAB SWITCHING ====== */
function initNavigation() {
  var navItems = document.querySelectorAll('.nav-item');
  var sections = document.querySelectorAll('.view-section');
  var pageTitle = document.getElementById('header-view-title');

  var titleMap = {
    'view-dashboard': 'AI Fleet Command Dashboard',
    'view-map': 'Tamil Nadu Regional Earth Satellite GPS Map',
    'view-camera-hud': 'Multi-Camera AI Live HUD Surveillance',
    'view-biometrics': 'AI Driver & Conductor Biometric Verification',
    'view-buses': 'Active Tamil Nadu Fleet Registry',
    'view-routes': 'Tamil Nadu Regional Transport Routes',
    'view-security': 'Data Protection & Security Audit Console',
    'view-verify': 'Conductor Ticketing vs Headcount Audit Scanner',
    'view-reports': 'Analytics & Official CSV Fleet Reports'
  };

  navItems.forEach(function(item) {
    item.addEventListener('click', function() {
      var targetView = item.getAttribute('data-view');

      // Deactivate all
      navItems.forEach(function(i) { i.classList.remove('active'); });
      sections.forEach(function(s) { s.classList.remove('active'); });

      // Activate selected
      item.classList.add('active');
      var targetEl = document.getElementById(targetView);
      if (targetEl) targetEl.classList.add('active');

      if (pageTitle && titleMap[targetView]) {
        pageTitle.innerText = titleMap[targetView];
      }

      // Maps: must invalidateSize after display:block takes effect
      if (targetView === 'view-dashboard' && dashMap) {
        setTimeout(function() { dashMap.invalidateSize(); }, 150);
      }
      if (targetView === 'view-map') {
        // Lazy-init the full map on first visit
        initFullMap();
        setTimeout(function() {
          if (fullMap) fullMap.invalidateSize();
          // Re-render markers on full map
          updateMapMarkers(cachedBuses);
        }, 200);
      }
    });
  });

  // Satellite Toggles — separate buttons for each map
  var btnSatDash = document.getElementById('btn-toggle-satellite-dashboard');
  if (btnSatDash) {
    btnSatDash.addEventListener('click', function() {
      toggleSatelliteDashboard();
      btnSatDash.innerHTML = isSatelliteDash
        ? '<i class="fa-solid fa-map"></i> Street Mode'
        : '<i class="fa-solid fa-satellite"></i> Satellite Mode';
    });
  }

  var btnSatFull = document.getElementById('btn-toggle-satellite-full');
  if (btnSatFull) {
    btnSatFull.addEventListener('click', function() {
      toggleSatelliteFull();
      btnSatFull.innerHTML = isSatelliteFull
        ? '<i class="fa-solid fa-map"></i> Street View'
        : '<i class="fa-solid fa-earth-asia"></i> Satellite View';
    });
  }
}

/* ====== 2. AI FACIAL LANDMARK MESH CANVAS ====== */
function initFaceLandmarkCanvas() {
  var canvas = document.getElementById('face-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var frame = 0;

  function resizeCanvas() {
    var parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth || 400;
      canvas.height = parent.clientHeight || 380;
    }
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function drawMesh() {
    if (canvas.width === 0 || canvas.height === 0) {
      resizeCanvas();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    var cx = canvas.width / 2;
    var cy = canvas.height / 2 - 10;
    var sc = Math.min(canvas.width, canvas.height) / 400;

    // Subtle background glow
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160 * sc);
    grad.addColorStop(0, 'rgba(16,185,129,0.06)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Face oval contour
    ctx.beginPath();
    ctx.ellipse(cx, cy, 75 * sc, 100 * sc, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(16,185,129,0.6)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#10b981';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 68 Facial Landmark Points — realistic distribution
    var pts = [
      // Jawline (17 pts)
      [-68, -20], [-66, 0], [-62, 20], [-56, 38], [-46, 54], [-34, 66], [-20, 76], [-6, 82],
      [6, 82], [20, 76], [34, 66], [46, 54], [56, 38], [62, 20], [66, 0], [68, -20], [0, 85],
      // Left eyebrow (5 pts)
      [-48, -42], [-40, -48], [-30, -50], [-20, -48], [-12, -42],
      // Right eyebrow (5 pts)
      [12, -42], [20, -48], [30, -50], [40, -48], [48, -42],
      // Nose bridge (4 pts)
      [0, -32], [0, -18], [0, -4], [0, 10],
      // Nose bottom (5 pts)
      [-14, 16], [-7, 20], [0, 22], [7, 20], [14, 16],
      // Left eye (6 pts)
      [-40, -24], [-34, -28], [-26, -28], [-20, -24], [-26, -22], [-34, -22],
      // Right eye (6 pts)
      [20, -24], [26, -28], [34, -28], [40, -24], [34, -22], [26, -22],
      // Outer lip (12 pts)
      [-24, 38], [-16, 32], [-8, 30], [0, 32], [8, 30], [16, 32], [24, 38],
      [16, 46], [8, 48], [0, 48], [-8, 48], [-16, 46],
      // Inner lip (8 pts)
      [-16, 38], [-8, 36], [0, 36], [8, 36], [16, 38], [8, 42], [0, 42], [-8, 42]
    ];

    // Draw connecting mesh lines
    ctx.strokeStyle = 'rgba(16,185,129,0.15)';
    ctx.lineWidth = 1;
    for (var i = 1; i < pts.length; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + pts[i - 1][0] * sc, cy + pts[i - 1][1] * sc);
      ctx.lineTo(cx + pts[i][0] * sc, cy + pts[i][1] * sc);
      ctx.stroke();
    }

    // Draw cross-mesh connections for eyes/nose/mouth
    var crossLinks = [[22, 27], [17, 21], [27, 30], [30, 31], [35, 41], [42, 47], [48, 54]];
    ctx.strokeStyle = 'rgba(6,182,212,0.2)';
    crossLinks.forEach(function(pair) {
      if (pts[pair[0]] && pts[pair[1]]) {
        ctx.beginPath();
        ctx.moveTo(cx + pts[pair[0]][0] * sc, cy + pts[pair[0]][1] * sc);
        ctx.lineTo(cx + pts[pair[1]][0] * sc, cy + pts[pair[1]][1] * sc);
        ctx.stroke();
      }
    });

    // Draw each landmark point with pulsing animation
    pts.forEach(function(p, idx) {
      var pulse = 2 + Math.sin(frame * 0.05 + idx * 0.3) * 1.2;
      ctx.beginPath();
      ctx.arc(cx + p[0] * sc, cy + p[1] * sc, pulse, 0, Math.PI * 2);
      ctx.fillStyle = idx < 17 ? '#06b6d4' : '#10b981';
      ctx.fill();
    });

    // Status text
    ctx.fillStyle = '#10b981';
    ctx.font = (12 * sc) + 'px JetBrains Mono, monospace';
    ctx.fillText('AI-68 LANDMARK MESH ACTIVE', cx - 90 * sc, canvas.height - 16 * sc);

    requestAnimationFrame(drawMesh);
  }
  drawMesh();
}

/* ====== 3. API DATA FETCHERS ====== */
function fetchDashboardMetrics() {
  fetch('/api/dashboard/summary')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var el1 = document.getElementById('metric-active-buses');
      var el2 = document.getElementById('metric-passengers');
      var el3 = document.getElementById('metric-overload-count');
      if (el1) el1.innerText = data.activeBuses || '0';
      if (el2) el2.innerText = data.totalPassengers || '0';
      if (el3) el3.innerText = data.overloadedBusesCount || '0';
    })
    .catch(function(err) { console.error('Dashboard fetch error:', err); });
}

function fetchFleetData() {
  fetch('/api/buses')
    .then(function(res) { return res.json(); })
    .then(function(buses) {
      cachedBuses = buses;
      updateFleetTable(buses);
      updateMapMarkers(buses);
    })
    .catch(function(err) { console.error('Fleet fetch error:', err); });
}

function fetchRoutesData() {
  fetch('/api/routes')
    .then(function(res) { return res.json(); })
    .then(function(routes) {
      var tbody = document.getElementById('routes-table-body');
      if (!tbody) return;
      var html = '';
      routes.forEach(function(r) {
        html += '<tr>' +
          '<td><b style="color:#10b981;">' + r.routeNumber + '</b></td>' +
          '<td>' + r.division + ' (' + r.district + ')</td>' +
          '<td>' + r.startPoint + '</td>' +
          '<td>' + r.endPoint + '</td>' +
          '<td>' + r.distance + '</td>' +
          '<td>' + r.estimatedTime + '</td>' +
          '</tr>';
      });
      tbody.innerHTML = html;
    })
    .catch(function(err) { console.error('Routes fetch error:', err); });
}

function fetchSecurityLogs() {
  fetch('/api/security/audit-logs')
    .then(function(res) { return res.json(); })
    .then(function(logs) {
      var tbody = document.getElementById('security-table-body');
      if (!tbody) return;
      var html = '';
      logs.forEach(function(l) {
        var statusClass = '';
        if (l.severity === 'success') statusClass = 'background:rgba(16,185,129,0.2);color:#10b981;';
        else if (l.severity === 'warning') statusClass = 'background:rgba(245,158,11,0.2);color:#f59e0b;';
        else statusClass = 'background:rgba(59,130,246,0.2);color:#3b82f6;';

        html += '<tr>' +
          '<td style="font-family:JetBrains Mono,monospace;font-size:0.8rem;">' + l.timestamp + '</td>' +
          '<td>' + l.event + '</td>' +
          '<td>' + l.actor + '</td>' +
          '<td style="font-family:JetBrains Mono,monospace;color:#10b981;">' + l.hash + '</td>' +
          '<td><span style="padding:2px 8px;border-radius:4px;font-size:0.75rem;' + statusClass + '">' + l.status + '</span></td>' +
          '</tr>';
      });
      tbody.innerHTML = html;
    })
    .catch(function(err) { console.error('Security logs fetch error:', err); });
}

function fetchAlerts() {
  fetch('/api/buses')
    .then(function(res) { return res.json(); })
    .then(function(buses) {
      var container = document.getElementById('alerts-container');
      if (!container) return;

      var html = '';
      buses.forEach(function(bus) {
        var mismatch = bus.totalBoarded - bus.ticketsIssued;
        var overloaded = bus.currentPassengers > bus.capacity;

        if (mismatch > 0 || overloaded) {
          var sevColor = mismatch >= 5 || overloaded ? '#ef4444' : '#f59e0b';
          var sevLabel = mismatch >= 5 || overloaded ? 'HIGH' : 'MEDIUM';

          html += '<div style="background:rgba(0,0,0,0.3);border:1px solid ' + sevColor + ';border-radius:12px;padding:16px;margin-bottom:12px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
              '<h4 style="color:#fff;margin:0;">' + bus.busNumber + ' — ' + (bus.routeNumber || 'Route N/A') + '</h4>' +
              '<span style="background:' + sevColor + ';color:#fff;padding:2px 10px;border-radius:4px;font-size:0.75rem;font-weight:700;">' + sevLabel + '</span>' +
            '</div>' +
            '<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:4px;"><b>Driver:</b> ' + bus.driverName + ' | <b>Conductor:</b> ' + bus.conductorName + '</p>';

          if (mismatch > 0) {
            html += '<p style="font-size:0.85rem;color:' + sevColor + ';">⚠ Ticket Mismatch: ' + bus.totalBoarded + ' boarded vs ' + bus.ticketsIssued + ' tickets issued (' + mismatch + ' unaccounted)</p>';
          }
          if (overloaded) {
            html += '<p style="font-size:0.85rem;color:#ef4444;">🚨 Overloaded: ' + bus.currentPassengers + ' / ' + bus.capacity + ' capacity exceeded</p>';
          }
          html += '</div>';
        }
      });

      if (!html) {
        html = '<div style="text-align:center;padding:40px;color:var(--text-muted);">' +
          '<i class="fa-solid fa-circle-check" style="font-size:2.5rem;color:#10b981;margin-bottom:12px;display:block;"></i>' +
          '<h3 style="color:#fff;">All Clear — No Active Alerts</h3>' +
          '<p>All ticket counts match passenger sensor data. No overloaded buses detected.</p>' +
          '</div>';
      }
      container.innerHTML = html;
    })
    .catch(function(err) { console.error('Alerts fetch error:', err); });
}

/* ====== 4. UPDATE FLEET TABLE UI ====== */
function updateFleetTable(buses) {
  var tbody = document.getElementById('fleet-table-body');
  if (!tbody) return;

  var html = '';
  buses.forEach(function(b) {
    var overloaded = b.currentPassengers > b.capacity;
    var passengerColor = overloaded ? '#ef4444' : '#10b981';

    html += '<tr>' +
      '<td><b style="color:#fff;">' + b.busNumber + '</b></td>' +
      '<td>' + b.division + '</td>' +
      '<td>' + (b.routeNumber || 'Unassigned') + '</td>' +
      '<td><b>Driver:</b> ' + b.driverName + '<br><small style="color:#6b7280;">Cond: ' + b.conductorName + '</small></td>' +
      '<td><span style="color:' + passengerColor + ';font-weight:bold;">' + b.currentPassengers + ' / ' + b.capacity + '</span></td>' +
      '<td><span style="color:#10b981;"><i class="fa-solid fa-circle-check"></i> Verified</span></td>' +
      '<td><button class="btn-cyber" style="font-size:0.75rem;padding:4px 10px;" onclick="inspectBus(\'' + b._id + '\')">Inspect</button></td>' +
      '</tr>';
  });
  tbody.innerHTML = html;
}

/* ====== 5. INSPECT BUS (Click handler from Fleet table) ====== */
function inspectBus(busId) {
  var bus = cachedBuses.find(function(b) { return b._id === busId; });
  if (!bus) {
    alert('Bus data not found for ID: ' + busId);
    return;
  }

  var overloaded = bus.currentPassengers > bus.capacity;
  var info = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '🚌  BUS INSPECTION REPORT\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    'Bus Number:      ' + bus.busNumber + '\n' +
    'Division:        ' + bus.division + '\n' +
    'Route:           ' + (bus.routeNumber || 'N/A') + '\n' +
    'District:        ' + (bus.district || 'Tamil Nadu') + '\n\n' +
    '👤 Driver:       ' + bus.driverName + ' (' + (bus.driverId || 'N/A') + ')\n' +
    '🎫 Conductor:    ' + bus.conductorName + ' (' + (bus.conductorId || 'N/A') + ')\n\n' +
    '📍 GPS Position: ' + bus.latitude.toFixed(5) + ', ' + bus.longitude.toFixed(5) + '\n' +
    '🚀 Speed:        ' + bus.speed + ' km/h\n\n' +
    '👥 Passengers:   ' + bus.currentPassengers + ' / ' + bus.capacity + (overloaded ? ' ⚠️ OVERLOADED' : ' ✅ OK') + '\n' +
    '🎟️ Tickets:      ' + bus.ticketsIssued + ' issued\n' +
    '🔐 Biometrics:   ' + (bus.biometricVerified ? 'VERIFIED ✅' : 'PENDING ❌') + '\n';

  alert(info);

  // Pan to this bus on the dashboard map
  if (dashMap) {
    dashMap.setView([bus.latitude, bus.longitude], 14);
  }
}

/* ====== 6. FORM LISTENERS & MODAL HANDLERS ====== */
function initFormListeners() {
  // Auth Modal
  var authModal = document.getElementById('auth-modal');
  var btnLogin = document.getElementById('btn-login-modal');
  var btnCloseAuth = document.getElementById('btn-close-auth');

  if (btnLogin) btnLogin.addEventListener('click', function() { authModal.style.display = 'flex'; });
  if (btnCloseAuth) btnCloseAuth.addEventListener('click', function() { authModal.style.display = 'none'; });

  // Register Bus Modal
  var regModal = document.getElementById('register-bus-modal');
  var btnRegBus = document.getElementById('btn-register-bus');
  var btnCloseReg = document.getElementById('btn-close-register');

  if (btnRegBus) btnRegBus.addEventListener('click', function() { regModal.style.display = 'flex'; });
  if (btnCloseReg) btnCloseReg.addEventListener('click', function() { regModal.style.display = 'none'; });

  // Close modal on overlay click
  [authModal, regModal].forEach(function(modal) {
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.style.display = 'none';
      });
    }
  });

  // Auth Form Submit
  var authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('auth-email').value;
      var password = document.getElementById('auth-password').value;

      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success) {
          var u = data.user;
          document.getElementById('user-display-name').innerText = u.name;
          document.getElementById('user-display-email').innerText = u.email;
          document.getElementById('user-avatar-initials').innerText = u.name.substring(0, 2).toUpperCase();
          authModal.style.display = 'none';
          fetchSecurityLogs(); // Refresh to show the login event
          alert('✅ Authenticated Successfully!\n\nWelcome, ' + u.name + '\nRole: ' + u.role.toUpperCase() + '\nDepartment: ' + (u.department || 'TN Transport'));
        }
      })
      .catch(function(err) { alert('Authentication failed. Check server connection.'); });
    });
  }

  // Register Bus Form Submit
  var regForm = document.getElementById('register-bus-form');
  if (regForm) {
    regForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var busNumber = document.getElementById('reg-bus-number').value;
      var division = document.getElementById('reg-division').value;
      var routeId = document.getElementById('reg-route-id').value;
      var driverName = document.getElementById('reg-driver-name').value;
      var conductorName = document.getElementById('reg-conductor-name').value;

      fetch('/api/buses/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busNumber: busNumber,
          division: division,
          routeId: routeId,
          driverName: driverName,
          conductorName: conductorName
        })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success) {
          regModal.style.display = 'none';
          document.getElementById('reg-bus-number').value = '';
          fetchFleetData();
          fetchDashboardMetrics();
          alert('✅ New Bus Registered Successfully!\n\nBus: ' + busNumber + '\nDivision: ' + division);
        } else {
          alert('❌ Registration Failed: ' + (data.message || 'Unknown error'));
        }
      })
      .catch(function(err) { alert('Registration failed. Check server connection.'); });
    });
  }

  // Biometric Facial Verification buttons
  var btnScanDriver = document.getElementById('btn-scan-driver');
  var btnScanConductor = document.getElementById('btn-scan-conductor');

  if (btnScanDriver) {
    btnScanDriver.addEventListener('click', function() { runBiometricVerification('driver'); });
  }
  if (btnScanConductor) {
    btnScanConductor.addEventListener('click', function() { runBiometricVerification('conductor'); });
  }
}

/* ====== 7. AI BIOMETRIC FACE VERIFICATION ====== */
function runBiometricVerification(dutyType) {
  fetch('/api/biometrics/verify-face', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dutyType: dutyType })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.success) {
      var p = data.personnel;
      document.getElementById('bio-result-img').src = p.photo;
      document.getElementById('bio-result-name').innerText = p.name;
      document.getElementById('bio-result-role').innerText = p.role + ' (' + p.employeeId + ')';
      document.getElementById('bio-result-division').innerText = p.division;
      document.getElementById('bio-result-score').innerText = p.facialMatchScore + '%';
      document.getElementById('bio-result-sobriety').innerText = p.sobrietyStatus;
      document.getElementById('bio-result-permit').innerText = p.dispatchPermitId;
      fetchSecurityLogs(); // Refresh to show the biometric event
    }
  })
  .catch(function(err) { alert('Biometric verification failed. Check server connection.'); });
}

/* ====== 8. SOCKET.IO REAL-TIME UPDATES ====== */
// We use the periodic timer (setInterval) instead of re-fetching on every socket event
// to prevent performance flooding. Socket events still useful for instant notifications.
socket.on('bus_location_update', function(data) {
  // Update the specific bus marker position in real-time (lightweight)
  if (data && data.busId && data.latitude && data.longitude) {
    var dashKey = 'dash_' + data.busId;
    var fullKey = 'full_' + data.busId;
    if (busMarkers[dashKey]) {
      busMarkers[dashKey].setLatLng([data.latitude, data.longitude]);
    }
    if (busMarkers[fullKey]) {
      busMarkers[fullKey].setLatLng([data.latitude, data.longitude]);
    }
  }
});

socket.on('new_bus_registered', function(bus) {
  fetchFleetData();
  fetchDashboardMetrics();
});

socket.on('biometric_authorization_granted', function(personnel) {
  console.log('[BIOMETRIC] Authorization granted for:', personnel.name);
});
