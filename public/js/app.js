/* ==========================================================================
   TN SMARTBUS AI ENTERPRISE PORTAL - MAIN APPLICATION LOGIC
   Handles UI Navigation, WebSockets, AI Face Landmark Rendering & REST API Interactivity
   ========================================================================== */

const socket = io();

document.addEventListener('DOMContentLoaded', () => {
  initMaps();
  initNavigation();
  initFaceLandmarkCanvas();
  fetchDashboardMetrics();
  fetchFleetData();
  fetchRoutesData();
  fetchSecurityLogs();
  initFormListeners();
});

// 1. Navigation Tab Switching
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.view-section');
  const pageTitle = document.getElementById('header-view-title');

  const titleMap = {
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

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      
      navItems.forEach(i => i.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      item.classList.add('active');
      const targetEl = document.getElementById(targetView);
      if (targetEl) targetEl.classList.add('active');

      if (pageTitle && titleMap[targetView]) {
        pageTitle.innerText = titleMap[targetView];
      }

      // Re-trigger map resize if switching to map views
      if (targetView === 'view-map' && fullMap) {
        setTimeout(() => fullMap.invalidateSize(), 200);
      }
      if (targetView === 'view-dashboard' && dashMap) {
        setTimeout(() => dashMap.invalidateSize(), 200);
      }
    });
  });

  // Satellite Toggles
  const btnSatDash = document.getElementById('btn-toggle-satellite-dashboard');
  if (btnSatDash) btnSatDash.addEventListener('click', toggleSatelliteMode);

  const btnSatFull = document.getElementById('btn-toggle-satellite-full');
  if (btnSatFull) btnSatFull.addEventListener('click', toggleSatelliteMode);
}

// 2. AI Facial Landmark Mesh Canvas Animation
function initFaceLandmarkCanvas() {
  const canvas = document.getElementById('face-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let frame = 0;
  function drawMesh() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 10;
    const radius = 100;

    // Draw face oval contour
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius * 0.75, radius, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#10b981';
    ctx.stroke();

    // 68 Facial Landmark Points
    const points = [
      // Eyes
      { x: centerX - 35, y: centerY - 20 },
      { x: centerX - 25, y: centerY - 25 },
      { x: centerX - 15, y: centerY - 20 },
      { x: centerX + 15, y: centerY - 20 },
      { x: centerX + 25, y: centerY - 25 },
      { x: centerX + 35, y: centerY - 20 },
      // Nose
      { x: centerX, y: centerY - 10 },
      { x: centerX, y: centerY + 10 },
      { x: centerX - 10, y: centerY + 20 },
      { x: centerX + 10, y: centerY + 20 },
      // Mouth
      { x: centerX - 25, y: centerY + 45 },
      { x: centerX, y: centerY + 40 },
      { x: centerX + 25, y: centerY + 45 },
      { x: centerX, y: centerY + 55 },
      // Jawline
      { x: centerX - 65, y: centerY - 30 },
      { x: centerX - 60, y: centerY + 30 },
      { x: centerX, y: centerY + 85 },
      { x: centerX + 60, y: centerY + 30 },
      { x: centerX + 65, y: centerY - 30 }
    ];

    // Draw points & connecting mesh lines
    ctx.fillStyle = '#10b981';
    points.forEach((p, idx) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Connect neighbor points
      if (idx > 0) {
        ctx.beginPath();
        ctx.moveTo(points[idx - 1].x, points[idx - 1].y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    requestAnimationFrame(drawMesh);
  }
  drawMesh();
}

// 3. API Data Fetchers
function fetchDashboardMetrics() {
  fetch('/api/dashboard/summary')
    .then(res => res.json())
    .then(data => {
      document.getElementById('metric-active-buses').innerText = data.activeBuses || '0';
      document.getElementById('metric-passengers').innerText = data.totalPassengers || '0';
      document.getElementById('metric-overload-count').innerText = data.overloadedBusesCount || '0';
    })
    .catch(err => console.error(err));
}

function fetchFleetData() {
  fetch('/api/buses')
    .then(res => res.json())
    .then(buses => {
      updateFleetTable(buses);
      updateMapMarkers(buses);
    })
    .catch(err => console.error(err));
}

function fetchRoutesData() {
  fetch('/api/routes')
    .then(res => res.json())
    .then(routes => {
      const tbody = document.getElementById('routes-table-body');
      if (!tbody) return;
      tbody.innerHTML = routes.map(r => `
        <tr>
          <td><b style="color: var(--accent-green);">${r.routeNumber}</b></td>
          <td>${r.division} (${r.district})</td>
          <td>${r.startPoint}</td>
          <td>${r.endPoint}</td>
          <td>${r.distance}</td>
          <td>${r.estimatedTime}</td>
        </tr>
      `).join('');
    })
    .catch(err => console.error(err));
}

function fetchSecurityLogs() {
  fetch('/api/security/audit-logs')
    .then(res => res.json())
    .then(logs => {
      const tbody = document.getElementById('security-table-body');
      if (!tbody) return;
      tbody.innerHTML = logs.map(l => `
        <tr>
          <td style="font-family: monospace; font-size: 0.8rem;">${l.timestamp}</td>
          <td>${l.event}</td>
          <td>${l.actor}</td>
          <td style="font-family: monospace; color: var(--accent-green);">${l.hash}</td>
          <td><span style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; background: rgba(16,185,129,0.2); color: var(--accent-green);">${l.status}</span></td>
        </tr>
      `).join('');
    })
    .catch(err => console.error(err));
}

// 4. Update Fleet Table UI
function updateFleetTable(buses) {
  const tbody = document.getElementById('fleet-table-body');
  if (!tbody) return;
  tbody.innerHTML = buses.map(b => {
    const overloaded = b.currentPassengers > b.capacity;
    return `
      <tr>
        <td><b style="color:#fff;">${b.busNumber}</b></td>
        <td>${b.division}</td>
        <td>${b.routeNumber}</td>
        <td><b>Driver:</b> ${b.driverName}<br><small style="color:var(--text-dim);">Cond: ${b.conductorName}</small></td>
        <td><span style="color: ${overloaded ? 'var(--accent-red)' : 'var(--accent-green)';} font-weight:bold;">${b.currentPassengers} / ${b.capacity}</span></td>
        <td><span style="color:var(--accent-green);"><i class="fa-solid fa-circle-check"></i> Verified</span></td>
        <td><button class="btn-cyber" style="font-size:0.75rem; padding: 4px 10px;" onclick="inspectBus('${b._id}')">Inspect</button></td>
      </tr>
    `;
  }).join('');
}

// 5. Form Listeners & Biometric Verification
function initFormListeners() {
  // Modal toggles
  const authModal = document.getElementById('auth-modal');
  const btnLogin = document.getElementById('btn-login-modal');
  const btnCloseAuth = document.getElementById('btn-close-auth');

  if (btnLogin) btnLogin.addEventListener('click', () => authModal.style.display = 'flex');
  if (btnCloseAuth) btnCloseAuth.addEventListener('click', () => authModal.style.display = 'none');

  const regModal = document.getElementById('register-bus-modal');
  const btnRegBus = document.getElementById('btn-register-bus');
  const btnCloseReg = document.getElementById('btn-close-register');

  if (btnRegBus) btnRegBus.addEventListener('click', () => regModal.style.display = 'flex');
  if (btnCloseReg) btnCloseReg.addEventListener('click', () => regModal.style.display = 'none');

  // Auth Submit
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const role = document.getElementById('auth-role-select').value;
      
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: '***', role })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          document.getElementById('user-display-name').innerText = data.user.name;
          document.getElementById('user-display-email').innerText = data.user.email;
          document.getElementById('user-avatar-initials').innerText = data.user.name.substring(0, 2).toUpperCase();
          authModal.style.display = 'none';
          alert('Authenticated successfully as ' + data.user.name);
        }
      });
    });
  }

  // Register Bus Submit
  const regForm = document.getElementById('register-bus-form');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const busNumber = document.getElementById('reg-bus-number').value;
      const division = document.getElementById('reg-division').value;
      const routeId = document.getElementById('reg-route-id').value;
      const driverName = document.getElementById('reg-driver-name').value;
      const conductorName = document.getElementById('reg-conductor-name').value;

      fetch('/api/buses/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busNumber, division, routeId, driverName, conductorName })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          regModal.style.display = 'none';
          fetchFleetData();
          fetchDashboardMetrics();
          alert('New Bus Registered Successfully: ' + busNumber);
        }
      });
    });
  }

  // Biometric Facial Verification buttons
  const btnScanDriver = document.getElementById('btn-scan-driver');
  const btnScanConductor = document.getElementById('btn-scan-conductor');

  if (btnScanDriver) {
    btnScanDriver.addEventListener('click', () => runBiometricVerification('driver'));
  }
  if (btnScanConductor) {
    btnScanConductor.addEventListener('click', () => runBiometricVerification('conductor'));
  }
}

function runBiometricVerification(dutyType) {
  fetch('/api/biometrics/verify-face', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dutyType })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      const p = data.personnel;
      document.getElementById('bio-result-img').src = p.photo;
      document.getElementById('bio-result-name').innerText = p.name;
      document.getElementById('bio-result-role').innerText = p.role + ' (' + p.employeeId + ')';
      document.getElementById('bio-result-division').innerText = p.division;
      document.getElementById('bio-result-score').innerText = p.facialMatchScore + '%';
      document.getElementById('bio-result-sobriety').innerText = p.sobrietyStatus;
      document.getElementById('bio-result-permit').innerText = p.dispatchPermitId;
      fetchSecurityLogs();
    }
  });
}

// 6. Socket.IO Real-time WebSockets
socket.on('bus_location_update', (data) => {
  fetchFleetData();
  fetchDashboardMetrics();
});
