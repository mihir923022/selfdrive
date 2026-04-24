// ========== CONFIG ==========
const API = '/api';

// ========== STATE ==========
let currentUser = null;
let currentToken = null;
let currentPage = 'home';
let adminTab = 'bookings';

// ========== INIT ==========
(function init() {
  const saved = localStorage.getItem('rr_token');
  const savedUser = localStorage.getItem('rr_user');
  if (saved && savedUser) {
    currentToken = saved;
    currentUser = JSON.parse(savedUser);
  }
  renderNav();
  showPage('home');
})();

// ========== AUTH HELPERS ==========
function authHeaders(isFormData = false) {
  const h = { Authorization: `Bearer ${currentToken}` };
  if (!isFormData) h['Content-Type'] = 'application/json';
  return h;
}

function isLoggedIn() { return !!currentToken; }
function isAdmin() { return currentUser?.role === 'admin'; }

function logout() {
  currentToken = null; currentUser = null;
  localStorage.removeItem('rr_token');
  localStorage.removeItem('rr_user');
  renderNav();
  showPage('home');
  toast('Logged out successfully.', 'info');
}

// ========== NAV ==========
function renderNav() {
  const el = document.getElementById('navAuth');
  if (!isLoggedIn()) {
    el.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="showPage('login')">Login</button>
      <button class="btn btn-primary btn-sm" onclick="showPage('register')">Register</button>`;
  } else {
    el.innerHTML = `
      <span style="color:var(--muted);font-size:0.85rem">Hi, ${currentUser.name.split(' ')[0]}</span>
      ${isAdmin() ? `<button class="btn btn-ghost btn-sm" onclick="showPage('admin')">Admin</button>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="showPage('my-bookings')">My Bookings</button>
      <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>`;
  }
}

// ========== ROUTER ==========
function showPage(page, data = {}) {
  currentPage = page;
  const root = document.getElementById('appRoot');
  switch (page) {
    case 'home':         renderHome(root); break;
    case 'vehicles':     renderVehicles(root); break;
    case 'login':        renderLogin(root); break;
    case 'register':     renderRegister(root); break;
    case 'book':         renderBooking(root, data); break;
    case 'my-bookings':  renderMyBookings(root); break;
    case 'admin':        renderAdmin(root); break;
    default:             renderHome(root);
  }
}

// ========== HOME ==========
function renderHome(root) {
  root.innerHTML = `
    <div class="page">
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-tag">🚗 India's Premium Vehicle Rental</div>
        <h1>Rent Any Ride,<br/><em>Anywhere in India</em></h1>
        <p>Cars, bikes, scooters, SUVs — all in one place. Book instantly, pay securely via UPI.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" onclick="showPage('vehicles')">Browse Vehicles</button>
          ${!isLoggedIn() ? `<button class="btn btn-outline" onclick="showPage('register')">Create Account</button>` : ''}
        </div>
        <div class="search-bar">
          <select id="heroType"><option value="">All Types</option><option>car</option><option>bike</option><option>suv</option><option>van</option><option>scooter</option></select>
          <input id="heroLoc" type="text" placeholder="City (Mumbai, Goa...)" />
          <button class="btn btn-primary" onclick="heroSearch()">Search</button>
        </div>
        <div class="stats">
          <div class="stat"><div class="num">50+</div><div class="lbl">Vehicles</div></div>
          <div class="stat"><div class="num">12</div><div class="lbl">Cities</div></div>
          <div class="stat"><div class="num">UPI</div><div class="lbl">Secure Payment</div></div>
        </div>
      </section>
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Featured <span>Vehicles</span></h2>
          <button class="btn btn-outline btn-sm" onclick="showPage('vehicles')">View All →</button>
        </div>
        <div id="featuredGrid" class="vehicle-grid"><div class="loader"><div class="spinner"></div></div></div>
      </section>
    </div>`;
  loadFeaturedVehicles();
}

function heroSearch() {
  const type = document.getElementById('heroType').value;
  const loc = document.getElementById('heroLoc').value;
  showPage('vehicles', { type, location: loc });
}

async function loadFeaturedVehicles() {
  const grid = document.getElementById('featuredGrid');
  try {
    const res = await fetch(`${API}/vehicles`);
    const vehicles = await res.json();
    const featured = vehicles.slice(0, 6);
    if (featured.length === 0) { grid.innerHTML = '<p style="color:var(--muted)">No vehicles available.</p>'; return; }
    grid.innerHTML = featured.map(v => vehicleCardHTML(v)).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--red)">Failed to load vehicles.</p>';
  }
}

// ========== VEHICLES ==========
function renderVehicles(root, filters = {}) {
  root.innerHTML = `
    <div class="page">
      <section class="section">
        <h2 class="section-title" style="margin-bottom:1.5rem">Browse <span>Vehicles</span></h2>
        <div class="filter-bar">
          <select id="fType" onchange="applyFilters()">
            <option value="">All Types</option>
            <option>car</option><option>bike</option><option>suv</option><option>van</option><option>scooter</option>
          </select>
          <select id="fFuel" onchange="applyFilters()">
            <option value="">All Fuel</option>
            <option>petrol</option><option>diesel</option><option>electric</option><option>hybrid</option>
          </select>
          <input id="fLoc" type="text" placeholder="Filter by city..." oninput="applyFilters()" />
        </div>
        <div id="vehicleGrid" class="vehicle-grid"><div class="loader"><div class="spinner"></div></div></div>
      </section>
    </div>`;
  if (filters.type) document.getElementById('fType').value = filters.type;
  if (filters.location) document.getElementById('fLoc').value = filters.location;
  applyFilters();
}

async function applyFilters() {
  const grid = document.getElementById('vehicleGrid');
  if (!grid) return;
  const type = document.getElementById('fType')?.value;
  const fuel_type = document.getElementById('fFuel')?.value;
  const location = document.getElementById('fLoc')?.value;

  let url = `${API}/vehicles?`;
  if (type) url += `type=${type}&`;
  if (fuel_type) url += `fuel_type=${fuel_type}&`;
  if (location) url += `location=${encodeURIComponent(location)}&`;

  grid.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const res = await fetch(url);
    const vehicles = await res.json();
    if (vehicles.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="icon">🚗</div><h3>No vehicles found</h3><p>Try adjusting your filters.</p></div>`;
      return;
    }
    grid.innerHTML = vehicles.map(v => vehicleCardHTML(v)).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--red)">Failed to load vehicles.</p>';
  }
}

function vehicleCardHTML(v) {
  return `
    <div class="vehicle-card">
      <img src="${v.image_url || 'https://via.placeholder.com/400x200?text=Vehicle'}" alt="${v.name}" onerror="this.src='https://via.placeholder.com/400x200?text=Vehicle'" />
      <div class="vehicle-info">
        <div class="vehicle-name">${v.name}</div>
        <div class="vehicle-brand">${v.brand || ''} · ${v.location || ''}</div>
        <div class="vehicle-meta">
          <span class="badge type">${v.type}</span>
          <span class="badge ${v.fuel_type === 'electric' ? 'fuel-electric' : ''}">${v.fuel_type}</span>
          <span class="badge">👥 ${v.seats} seats</span>
        </div>
        <div class="vehicle-price-row">
          <div class="vehicle-price">₹${Number(v.price_per_day).toLocaleString('en-IN')} <small>/day</small></div>
          <button class="btn btn-primary btn-sm" onclick="bookVehicle(${v.id})">Book Now</button>
        </div>
      </div>
    </div>`;
}

function bookVehicle(vehicleId) {
  if (!isLoggedIn()) { toast('Please login to book a vehicle.', 'info'); showPage('login'); return; }
  showPage('book', { vehicleId });
}

// ========== BOOKING ==========
async function renderBooking(root, { vehicleId }) {
  root.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;
  let vehicle;
  try {
    const res = await fetch(`${API}/vehicles/${vehicleId}`);
    vehicle = await res.json();
  } catch {
    root.innerHTML = '<p style="color:var(--red);padding:2rem">Failed to load vehicle.</p>';
    return;
  }

  root.innerHTML = `
    <div class="page">
      <section class="section" style="max-width:600px">
        <button class="btn btn-ghost btn-sm" onclick="showPage('vehicles')" style="margin-bottom:1.5rem">← Back</button>
        <h2 class="section-title" style="margin-bottom:1.5rem">Book <span>${vehicle.name}</span></h2>
        <div class="vehicle-card" style="margin-bottom:1.5rem">
          <img src="${vehicle.image_url}" alt="${vehicle.name}" style="height:160px" onerror="this.src='https://via.placeholder.com/600x160?text=Vehicle'" />
          <div class="vehicle-info">
            <div class="vehicle-name">${vehicle.name}</div>
            <div class="vehicle-brand">${vehicle.brand} · ${vehicle.location}</div>
            <div class="vehicle-meta">
              <span class="badge type">${vehicle.type}</span>
              <span class="badge">${vehicle.fuel_type}</span>
              <span class="badge">👥 ${vehicle.seats} seats</span>
            </div>
            <div class="vehicle-price">₹${Number(vehicle.price_per_day).toLocaleString('en-IN')} <small>/day</small></div>
          </div>
        </div>

        <div class="form-group">
          <label>Pickup Date</label>
          <input type="date" id="startDate" oninput="calcPrice(${vehicle.price_per_day})" min="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group">
          <label>Return Date</label>
          <input type="date" id="endDate" oninput="calcPrice(${vehicle.price_per_day})" />
        </div>
        <div class="form-group">
          <label>Pickup Location</label>
          <input type="text" id="pickupLocation" placeholder="Enter pickup address or city" />
        </div>

        <div class="form-group">
          <label>Driving Licence Photo <span style="color:var(--muted)">(Required — JPG/PNG/PDF, max 5MB)</span></label>
          <div class="upload-zone" onclick="document.getElementById('licenseInput').click()">
            <input type="file" id="licenseInput" accept=".jpg,.jpeg,.png,.pdf" onchange="previewLicense()" />
            <div class="upload-icon">🪪</div>
            <p>Click to upload your driving licence</p>
            <p style="font-size:0.75rem;margin-top:0.3rem">Front side preferred</p>
          </div>
          <div class="upload-preview" id="licensePreview"></div>
        </div>

        <div class="price-summary" id="priceSummary" style="display:none">
          <div class="price-row"><span>Days</span><span id="psDay">—</span></div>
          <div class="price-row"><span>Rate</span><span>₹${Number(vehicle.price_per_day).toLocaleString('en-IN')}/day</span></div>
          <div class="price-row total"><span>Total</span><span id="psTotal">—</span></div>
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:0.5rem" onclick="submitBooking(${vehicle.id})">Confirm Booking & Proceed to Payment</button>
      </section>
    </div>`;
}

function previewLicense() {
  const file = document.getElementById('licenseInput').files[0];
  const preview = document.getElementById('licensePreview');
  if (!file) return;
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => { preview.innerHTML = `<img src="${e.target.result}" alt="Licence preview" />`; };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `<p style="font-size:0.82rem;color:var(--green);margin-top:0.5rem">📄 ${file.name} selected</p>`;
  }
  document.querySelector('.upload-zone p').textContent = file.name;
}

function calcPrice(pricePerDay) {
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  const summary = document.getElementById('priceSummary');
  if (!start || !end) { summary.style.display = 'none'; return; }
  const days = Math.ceil((new Date(end) - new Date(start)) / 86400000);
  if (days <= 0) { summary.style.display = 'none'; return; }
  const total = days * pricePerDay;
  document.getElementById('psDay').textContent = days;
  document.getElementById('psTotal').textContent = `₹${Number(total).toLocaleString('en-IN')}`;
  summary.style.display = 'block';
}

async function submitBooking(vehicleId) {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const pickupLocation = document.getElementById('pickupLocation').value;
  const licenseFile = document.getElementById('licenseInput').files[0];

  if (!startDate || !endDate) return toast('Please select pickup and return dates.', 'error');
  if (new Date(endDate) <= new Date(startDate)) return toast('Return date must be after pickup date.', 'error');
  if (!licenseFile) return toast('Please upload your driving licence photo.', 'error');

  const fd = new FormData();
  fd.append('vehicle_id', vehicleId);
  fd.append('start_date', startDate);
  fd.append('end_date', endDate);
  fd.append('pickup_location', pickupLocation);
  fd.append('license_image', licenseFile);

  try {
    const res = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${currentToken}` },
      body: fd
    });
    const data = await res.json();
    if (!res.ok) return toast(data.message || 'Booking failed.', 'error');
    toast('Booking confirmed! Proceed to payment.', 'success');
    showPaymentModal(data.booking_id, data.total_price);
  } catch {
    toast('Server error. Please try again.', 'error');
  }
}

// ========== PAYMENT MODAL ==========
async function showPaymentModal(bookingId, totalPrice) {
  let settings = { qr_image: null, upi_id: 'rentride@upi' };
  try {
    const res = await fetch(`${API}/payment/settings`);
    if (res.ok) settings = await res.json();
  } catch {}

  const qrHTML = settings.qr_image
    ? `<img src="${settings.qr_image}" alt="Payment QR Code" />`
    : `<div class="qr-placeholder">
        <div style="text-align:center">
          <div style="font-size:3rem">📱</div>
          <div>QR not configured.<br/>Use UPI ID below.</div>
        </div>
       </div>`;

  openModal(`
    <h3 style="font-family:var(--font-head);font-size:1.3rem;margin-bottom:0.3rem">💳 Complete Payment</h3>
    <p style="font-size:0.85rem;color:var(--muted);margin-bottom:1rem">Booking #${bookingId} · Total: <strong style="color:var(--accent)">₹${Number(totalPrice).toLocaleString('en-IN')}</strong></p>
    
    <div class="qr-wrap">
      ${qrHTML}
      <p style="margin-top:1rem;font-size:0.88rem;color:var(--muted)">Scan QR or pay via UPI</p>
      <p style="font-size:1rem;font-weight:600;color:var(--text);margin-top:0.3rem">📲 ${settings.upi_id || 'rentride@upi'}</p>
      <p style="font-size:0.82rem;color:var(--muted);margin-top:0.3rem">Amount: <strong style="color:var(--accent)">₹${Number(totalPrice).toLocaleString('en-IN')}</strong></p>
    </div>

    <hr class="divider" />
    <p style="font-size:0.88rem;margin-bottom:0.8rem;color:var(--text);font-weight:500">After paying, upload your payment screenshot:</p>

    <div class="upload-zone" onclick="document.getElementById('paymentInput').click()">
      <input type="file" id="paymentInput" accept=".jpg,.jpeg,.png" onchange="previewPayment()" />
      <div class="upload-icon">📷</div>
      <p>Click to upload payment screenshot</p>
    </div>
    <div class="upload-preview" id="paymentPreview"></div>

    <div style="display:flex;gap:0.8rem;margin-top:1.5rem">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal()">Later (My Bookings)</button>
      <button class="btn btn-primary" style="flex:1" onclick="submitPaymentScreenshot(${bookingId})">Submit Payment Proof</button>
    </div>
  `);
}

function previewPayment() {
  const file = document.getElementById('paymentInput').files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('paymentPreview').innerHTML = `<img src="${e.target.result}" alt="Payment screenshot" style="margin-top:0.8rem" />`;
  };
  reader.readAsDataURL(file);
}

async function submitPaymentScreenshot(bookingId) {
  const file = document.getElementById('paymentInput').files[0];
  if (!file) return toast('Please upload your payment screenshot.', 'error');

  const fd = new FormData();
  fd.append('payment_screenshot', file);

  try {
    const res = await fetch(`${API}/bookings/${bookingId}/payment-screenshot`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${currentToken}` },
      body: fd
    });
    const data = await res.json();
    if (!res.ok) return toast(data.message || 'Upload failed.', 'error');
    closeModal();
    toast('Payment screenshot submitted! Admin will verify shortly.', 'success');
    showPage('my-bookings');
  } catch {
    toast('Server error.', 'error');
  }
}

// ========== MY BOOKINGS ==========
async function renderMyBookings(root) {
  if (!isLoggedIn()) { showPage('login'); return; }
  root.innerHTML = `<div class="page"><section class="section"><h2 class="section-title" style="margin-bottom:1.5rem">My <span>Bookings</span></h2><div class="loader"><div class="spinner"></div></div></section></div>`;

  try {
    const res = await fetch(`${API}/bookings/my`, { headers: authHeaders() });
    const bookings = await res.json();
    const section = root.querySelector('.section');

    if (!Array.isArray(bookings) || bookings.length === 0) {
      section.innerHTML = `
        <h2 class="section-title" style="margin-bottom:1.5rem">My <span>Bookings</span></h2>
        <div class="empty-state"><div class="icon">📋</div><h3>No bookings yet</h3><p>Browse vehicles and make your first booking.</p>
          <button class="btn btn-primary" style="margin-top:1rem" onclick="showPage('vehicles')">Browse Vehicles</button>
        </div>`;
      return;
    }

    section.innerHTML = `<h2 class="section-title" style="margin-bottom:1.5rem">My <span>Bookings</span></h2>` +
      bookings.map(b => `
        <div class="booking-card">
          <div class="booking-header">
            <div>
              <div class="booking-title">${b.vehicle_name}</div>
              <div class="booking-meta">${b.brand} · Booking #${b.id}</div>
            </div>
            <div style="display:flex;gap:0.5rem;flex-direction:column;align-items:flex-end">
              <span class="status-pill status-${b.status}">${b.status}</span>
              <span class="status-pill status-${b.payment_status}" style="font-size:0.7rem">${paymentStatusLabel(b.payment_status)}</span>
            </div>
          </div>
          <div class="info-row">
            <span>📅 ${b.start_date} → ${b.end_date}</span>
            <span>📍 ${b.pickup_location || 'Not specified'}</span>
          </div>
          <div class="info-row">
            <span>💰 Total: <strong style="color:var(--accent)">₹${Number(b.total_price).toLocaleString('en-IN')}</strong></span>
            ${b.license_image ? `<span>🪪 <a href="${b.license_image}" target="_blank" style="color:var(--accent)">View Licence</a></span>` : '<span style="color:var(--red)">🪪 No licence uploaded</span>'}
          </div>
          ${b.payment_status === 'unpaid' ? `
            <button class="btn btn-primary btn-sm" style="margin-top:0.8rem" onclick="reopenPayment(${b.id}, ${b.total_price})">💳 Pay Now</button>` : ''}
          ${b.payment_status === 'pending_verification' ? `
            <p style="font-size:0.82rem;color:var(--yellow);margin-top:0.5rem">⏳ Payment screenshot submitted — awaiting admin verification</p>` : ''}
          ${b.payment_status === 'paid' ? `
            <p style="font-size:0.82rem;color:var(--green);margin-top:0.5rem">✅ Payment verified by admin</p>` : ''}
        </div>`).join('');
  } catch {
    root.querySelector('.section').innerHTML += '<p style="color:var(--red)">Failed to load bookings.</p>';
  }
}

async function reopenPayment(bookingId, totalPrice) {
  showPaymentModal(bookingId, totalPrice);
}

function paymentStatusLabel(s) {
  return { unpaid: '💳 Unpaid', pending_verification: '⏳ Verifying Payment', paid: '✅ Paid' }[s] || s;
}

// ========== AUTH PAGES ==========
function renderLogin(root) {
  root.innerHTML = `
    <div class="page auth-wrap">
      <div class="auth-card">
        <div class="auth-title">Welcome Back</div>
        <div class="auth-sub">Sign in to your RentRide account</div>
        <div class="form-group"><label>Email</label><input type="email" id="loginEmail" placeholder="you@email.com" /></div>
        <div class="form-group"><label>Password</label><input type="password" id="loginPass" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()" /></div>
        <button class="btn btn-primary" style="width:100%" onclick="doLogin()">Sign In</button>
        <p style="text-align:center;margin-top:1.2rem;font-size:0.85rem;color:var(--muted)">
          Don't have an account? <a href="#" onclick="showPage('register')" style="color:var(--accent)">Register</a>
        </p>
      </div>
    </div>`;
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;
  if (!email || !password) return toast('Please fill all fields.', 'error');
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return toast(data.message || 'Login failed.', 'error');
    currentToken = data.token; currentUser = data.user;
    localStorage.setItem('rr_token', data.token);
    localStorage.setItem('rr_user', JSON.stringify(data.user));
    renderNav();
    toast(`Welcome back, ${data.user.name}!`, 'success');
    showPage(isAdmin() ? 'admin' : 'home');
  } catch { toast('Server error.', 'error'); }
}

function renderRegister(root) {
  root.innerHTML = `
    <div class="page auth-wrap">
      <div class="auth-card">
        <div class="auth-title">Create Account</div>
        <div class="auth-sub">Join RentRide — free, quick, easy</div>
        <div class="form-group"><label>Full Name</label><input type="text" id="regName" placeholder="Rahul Sharma" /></div>
        <div class="form-group"><label>Email</label><input type="email" id="regEmail" placeholder="you@email.com" /></div>
        <div class="form-group"><label>Password</label><input type="password" id="regPass" placeholder="Min 6 characters" /></div>
        <button class="btn btn-primary" style="width:100%" onclick="doRegister()">Create Account</button>
        <p style="text-align:center;margin-top:1.2rem;font-size:0.85rem;color:var(--muted)">
          Already have an account? <a href="#" onclick="showPage('login')" style="color:var(--accent)">Login</a>
        </p>
      </div>
    </div>`;
}

async function doRegister() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPass').value;
  if (!name || !email || !password) return toast('Please fill all fields.', 'error');
  if (password.length < 6) return toast('Password must be at least 6 characters.', 'error');
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) return toast(data.message || 'Registration failed.', 'error');
    toast('Account created! Please login.', 'success');
    showPage('login');
  } catch { toast('Server error.', 'error'); }
}

// ========== ADMIN PANEL ==========
function renderAdmin(root) {
  if (!isAdmin()) { toast('Admin access required.', 'error'); showPage('home'); return; }
  root.innerHTML = `
    <div class="page">
      <section class="section">
        <h2 class="section-title" style="margin-bottom:1.5rem">Admin <span>Dashboard</span></h2>
        <div class="admin-tabs">
          <button class="tab-btn ${adminTab==='bookings'?'active':''}" onclick="switchAdminTab('bookings')">📋 Bookings</button>
          <button class="tab-btn ${adminTab==='vehicles'?'active':''}" onclick="switchAdminTab('vehicles')">🚗 Vehicles</button>
          <button class="tab-btn ${adminTab==='users'?'active':''}" onclick="switchAdminTab('users')">👥 Users</button>
          <button class="tab-btn ${adminTab==='payment'?'active':''}" onclick="switchAdminTab('payment')">💳 Payment QR</button>
        </div>
        <div id="adminTabContent"><div class="loader"><div class="spinner"></div></div></div>
      </section>
    </div>`;
  loadAdminTab(adminTab);
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('adminTabContent').innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  loadAdminTab(tab);
}

async function loadAdminTab(tab) {
  switch (tab) {
    case 'bookings': await loadAdminBookings(); break;
    case 'vehicles': await loadAdminVehicles(); break;
    case 'users':    await loadAdminUsers(); break;
    case 'payment':  await loadPaymentSettings(); break;
  }
}

// ── Admin: Bookings ──
async function loadAdminBookings() {
  const c = document.getElementById('adminTabContent');
  try {
    const res = await fetch(`${API}/bookings`, { headers: authHeaders() });
    const bookings = await res.json();
    if (!Array.isArray(bookings) || bookings.length === 0) {
      c.innerHTML = '<div class="empty-state"><div class="icon">📋</div><h3>No bookings yet</h3></div>'; return;
    }
    c.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>ID</th><th>User</th><th>Vehicle</th><th>Dates</th><th>Total</th>
            <th>Licence</th><th>Payment</th><th>Screenshot</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
          ${bookings.map(b => `
            <tr>
              <td>#${b.id}</td>
              <td><div>${b.user_name}</div><div style="color:var(--muted);font-size:0.75rem">${b.user_email}</div></td>
              <td>${b.vehicle_name}<br/><span style="color:var(--muted);font-size:0.75rem">${b.brand}</span></td>
              <td style="font-size:0.82rem">${b.start_date}<br/>→ ${b.end_date}</td>
              <td style="color:var(--accent);font-weight:600">₹${Number(b.total_price).toLocaleString('en-IN')}</td>
              <td>${b.license_image
                ? `<img class="license-thumb" src="${b.license_image}" onclick="viewImage('${b.license_image}','Driving Licence')" title="View Licence" />`
                : '<span style="color:var(--red);font-size:0.75rem">Not uploaded</span>'}</td>
              <td><span class="status-pill status-${b.payment_status}" style="font-size:0.72rem">${b.payment_status}</span></td>
              <td>${b.payment_screenshot
                ? `<img class="screenshot-thumb" src="${b.payment_screenshot}" onclick="viewImage('${b.payment_screenshot}','Payment Screenshot')" title="View Screenshot" />`
                : '<span style="color:var(--muted);font-size:0.75rem">None</span>'}</td>
              <td><span class="status-pill status-${b.status}">${b.status}</span></td>
              <td>
                <div style="display:flex;flex-direction:column;gap:0.4rem">
                  <select class="filter-bar" style="padding:0.3rem;font-size:0.78rem;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text)" id="bstat_${b.id}" onchange="updateBookingStatus(${b.id})">
                    <option ${b.status==='pending'?'selected':''}>pending</option>
                    <option ${b.status==='confirmed'?'selected':''}>confirmed</option>
                    <option ${b.status==='cancelled'?'selected':''}>cancelled</option>
                    <option ${b.status==='completed'?'selected':''}>completed</option>
                  </select>
                  <select style="padding:0.3rem;font-size:0.78rem;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text)" id="bpay_${b.id}" onchange="updatePaymentStatus(${b.id})">
                    <option value="unpaid" ${b.payment_status==='unpaid'?'selected':''}>unpaid</option>
                    <option value="pending_verification" ${b.payment_status==='pending_verification'?'selected':''}>pending verification</option>
                    <option value="paid" ${b.payment_status==='paid'?'selected':''}>paid</option>
                  </select>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) {
    c.innerHTML = `<p style="color:var(--red)">Failed to load bookings: ${e.message}</p>`;
  }
}

async function updateBookingStatus(id) {
  const status = document.getElementById(`bstat_${id}`).value;
  try {
    const res = await fetch(`${API}/bookings/${id}/status`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) return toast(data.message, 'error');
    toast('Booking status updated.', 'success');
  } catch { toast('Update failed.', 'error'); }
}

async function updatePaymentStatus(id) {
  const payment_status = document.getElementById(`bpay_${id}`).value;
  try {
    const res = await fetch(`${API}/bookings/${id}/status`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ payment_status })
    });
    const data = await res.json();
    if (!res.ok) return toast(data.message, 'error');
    toast('Payment status updated.', 'success');
  } catch { toast('Update failed.', 'error'); }
}

// ── Admin: Vehicles ──
async function loadAdminVehicles() {
  const c = document.getElementById('adminTabContent');
  try {
    const res = await fetch(`${API}/vehicles`);
    const vehicles = await res.json();
    c.innerHTML = `
      <button class="btn btn-primary btn-sm" style="margin-bottom:1rem" onclick="showAddVehicleForm()">+ Add Vehicle</button>
      <div id="addVehicleForm" style="display:none"></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Image</th><th>Name</th><th>Type</th><th>Location</th><th>Price/Day</th><th>Available</th><th>Actions</th></tr></thead>
          <tbody>
          ${vehicles.map(v => `
            <tr>
              <td><img src="${v.image_url}" style="width:60px;height:40px;object-fit:cover;border-radius:4px" onerror="this.src='https://via.placeholder.com/60x40'" /></td>
              <td>${v.name}<br/><span style="color:var(--muted);font-size:0.75rem">${v.brand||''}</span></td>
              <td><span class="badge type">${v.type}</span></td>
              <td>${v.location||''}</td>
              <td style="color:var(--accent)">₹${Number(v.price_per_day).toLocaleString('en-IN')}</td>
              <td><span class="status-pill ${v.availability?'status-confirmed':'status-cancelled'}">${v.availability?'Yes':'No'}</span></td>
              <td>
                <button class="btn btn-sm btn-outline" onclick="toggleAvailability(${v.id},${v.availability},${JSON.stringify(v).replace(/"/g,'&quot;')})">
                  ${v.availability ? 'Disable' : 'Enable'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteVehicle(${v.id})" style="margin-left:0.4rem">Delete</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch { c.innerHTML = '<p style="color:var(--red)">Failed to load vehicles.</p>'; }
}

function showAddVehicleForm() {
  const f = document.getElementById('addVehicleForm');
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
  f.innerHTML = `
    <div class="booking-card" style="margin-bottom:1rem">
      <h4 style="font-family:var(--font-head);margin-bottom:1rem">Add New Vehicle</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem">
        <div class="form-group"><label>Name</label><input id="vn" type="text" placeholder="Swift Dzire" /></div>
        <div class="form-group"><label>Brand</label><input id="vb" type="text" placeholder="Maruti Suzuki" /></div>
        <div class="form-group"><label>Type</label>
          <select id="vt"><option>car</option><option>bike</option><option>suv</option><option>van</option><option>scooter</option></select>
        </div>
        <div class="form-group"><label>Fuel</label>
          <select id="vf"><option>petrol</option><option>diesel</option><option>electric</option><option>hybrid</option></select>
        </div>
        <div class="form-group"><label>Seats</label><input id="vs" type="number" value="5" /></div>
        <div class="form-group"><label>Price/Day (₹)</label><input id="vp" type="number" placeholder="1200" /></div>
        <div class="form-group"><label>Location</label><input id="vl" type="text" placeholder="Mumbai" /></div>
        <div class="form-group"><label>Image URL</label><input id="vi" type="text" placeholder="https://..." /></div>
      </div>
      <div class="form-group"><label>Description</label><textarea id="vd" placeholder="Vehicle description..."></textarea></div>
      <button class="btn btn-primary" onclick="addVehicle()">Add Vehicle</button>
    </div>`;
}

async function addVehicle() {
  const body = {
    name: document.getElementById('vn').value,
    brand: document.getElementById('vb').value,
    type: document.getElementById('vt').value,
    fuel_type: document.getElementById('vf').value,
    seats: document.getElementById('vs').value,
    price_per_day: document.getElementById('vp').value,
    location: document.getElementById('vl').value,
    image_url: document.getElementById('vi').value,
    description: document.getElementById('vd').value
  };
  if (!body.name || !body.price_per_day) return toast('Name and price are required.', 'error');
  try {
    const res = await fetch(`${API}/vehicles`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return toast(data.message, 'error');
    toast('Vehicle added.', 'success');
    loadAdminVehicles();
  } catch { toast('Failed.', 'error'); }
}

async function toggleAvailability(id, current, v) {
  try {
    const res = await fetch(`${API}/vehicles/${id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ ...v, availability: current ? 0 : 1 })
    });
    if (!res.ok) return toast('Update failed.', 'error');
    toast('Vehicle availability updated.', 'success');
    loadAdminVehicles();
  } catch { toast('Failed.', 'error'); }
}

async function deleteVehicle(id) {
  if (!confirm('Delete this vehicle? This cannot be undone.')) return;
  try {
    const res = await fetch(`${API}/vehicles/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) return toast('Delete failed.', 'error');
    toast('Vehicle deleted.', 'success');
    loadAdminVehicles();
  } catch { toast('Failed.', 'error'); }
}

// ── Admin: Users ──
async function loadAdminUsers() {
  const c = document.getElementById('adminTabContent');
  try {
    const res = await fetch(`${API}/users`, { headers: authHeaders() });
    const users = await res.json();
    c.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
          ${users.map(u => `
            <tr>
              <td>#${u.id}</td>
              <td>${u.name}</td>
              <td>${u.email}</td>
              <td><span class="badge ${u.role==='admin'?'type':''}">${u.role}</span></td>
              <td style="font-size:0.8rem;color:var(--muted)">${new Date(u.created_at).toLocaleDateString('en-IN')}</td>
              <td>${u.role !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">Delete</button>` : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch { c.innerHTML = '<p style="color:var(--red)">Failed to load users.</p>'; }
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  try {
    const res = await fetch(`${API}/users/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) return toast('Delete failed.', 'error');
    toast('User deleted.', 'success');
    loadAdminUsers();
  } catch { toast('Failed.', 'error'); }
}

// ── Admin: Payment QR Settings ──
async function loadPaymentSettings() {
  const c = document.getElementById('adminTabContent');
  let settings = { qr_image: null, upi_id: '' };
  try {
    const res = await fetch(`${API}/payment/settings`, { headers: authHeaders() });
    if (res.ok) settings = await res.json();
  } catch {}

  c.innerHTML = `
    <div class="booking-card" style="max-width:500px">
      <h3 style="font-family:var(--font-head);font-size:1.2rem;margin-bottom:1.5rem">💳 Payment QR Settings</h3>
      
      <p style="font-size:0.85rem;color:var(--muted);margin-bottom:1rem">Current QR Code:</p>
      <div class="qr-wrap" style="margin-bottom:1.5rem">
        ${settings.qr_image
          ? `<img src="${settings.qr_image}" alt="Payment QR" id="currentQR" />`
          : `<div class="qr-placeholder"><div style="text-align:center"><div style="font-size:2rem">📱</div><div>No QR uploaded</div></div></div>`}
        <p style="margin-top:0.8rem;color:var(--muted);font-size:0.85rem">UPI ID: <strong style="color:var(--text)">${settings.upi_id || 'Not set'}</strong></p>
      </div>

      <hr class="divider" />
      <h4 style="font-family:var(--font-head);margin-bottom:1rem">Update Payment Settings</h4>

      <div class="form-group">
        <label>New QR Code Image (JPG/PNG, max 2MB)</label>
        <div class="upload-zone" onclick="document.getElementById('adminQRInput').click()">
          <input type="file" id="adminQRInput" accept=".jpg,.jpeg,.png" onchange="previewAdminQR()" />
          <div class="upload-icon">📱</div>
          <p>Click to upload new QR code</p>
        </div>
        <div class="upload-preview" id="adminQRPreview"></div>
      </div>

      <div class="form-group">
        <label>UPI ID</label>
        <input type="text" id="adminUPIId" placeholder="yourname@upi" value="${settings.upi_id || ''}" />
      </div>

      <button class="btn btn-primary" onclick="savePaymentSettings()">Save Payment Settings</button>
    </div>`;
}

function previewAdminQR() {
  const file = document.getElementById('adminQRInput').files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('adminQRPreview').innerHTML = `<img src="${e.target.result}" alt="QR Preview" style="margin-top:0.8rem;width:180px;height:180px;object-fit:contain;border-radius:8px;border:1px solid var(--border)" />`;
  };
  reader.readAsDataURL(file);
  document.querySelector('#adminTabContent .upload-zone p').textContent = file.name;
}

async function savePaymentSettings() {
  const upi_id = document.getElementById('adminUPIId').value;
  const qrFile = document.getElementById('adminQRInput').files[0];

  if (!upi_id && !qrFile) return toast('Please provide UPI ID or QR code image.', 'error');

  const fd = new FormData();
  if (upi_id) fd.append('upi_id', upi_id);
  if (qrFile) fd.append('qr_image', qrFile);

  try {
    const res = await fetch(`${API}/payment/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${currentToken}` },
      body: fd
    });
    const data = await res.json();
    if (!res.ok) return toast(data.message || 'Save failed.', 'error');
    toast('Payment settings updated successfully!', 'success');
    loadPaymentSettings();
  } catch { toast('Server error.', 'error'); }
}

// ========== IMAGE VIEWER ==========
function viewImage(src, title) {
  openModal(`
    <div style="text-align:center">
      <h3 style="font-family:var(--font-head);margin-bottom:1rem">${title}</h3>
      <img src="${src}" alt="${title}" style="max-width:100%;max-height:60vh;border-radius:8px;border:1px solid var(--border)" />
      <br/>
      <a href="${src}" target="_blank" class="btn btn-outline btn-sm" style="margin-top:1rem">Open Full Size ↗</a>
      <button class="btn btn-ghost btn-sm" style="margin-top:1rem;margin-left:0.5rem" onclick="closeModal()">Close</button>
    </div>`);
}

// ========== MODAL ==========
function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ========== TOAST ==========
let toastTimer;
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 4000);
}
