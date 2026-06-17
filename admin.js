const API_URL = window.location.origin;
const authBox = document.getElementById("auth-box");
const adminPanel = document.getElementById("admin-panel");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const logoutBtn = document.getElementById("logout-btn");
const productForm = document.getElementById("product-form");
const productMessage = document.getElementById("product-message");
const adminProducts = document.getElementById("admin-products");
const resetBtn = document.getElementById("reset-btn");
const settingsForm = document.getElementById("settings-form");
const settingsMessage = document.getElementById("settings-message");
const ordersList = document.getElementById("orders-list");
const productIdInput = document.getElementById("product-id");
const nameInput = document.getElementById("name");
const labelInput = document.getElementById("label");
const priceInput = document.getElementById("price");
const noteInput = document.getElementById("note");
const descriptionInput = document.getElementById("description");
const imageInput = document.getElementById("image");
const isAvailableInput = document.getElementById("is-available");

async function checkSession() {
  try {
    const res = await fetch(`${API_URL}/api/admin/products`, { credentials: 'include' });
    if (!res.ok) throw new Error('Unauthorized');
    authBox.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    await Promise.all([loadAdminProducts(), loadSettings(), loadOrders()]);
  } catch (e) {
    authBox.classList.remove("hidden");
    adminPanel.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMessage.textContent = "Logging in...";
  try {
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: document.getElementById("email").value, password: document.getElementById("password").value })
    });
    const data = await res.json();
    if (!res.ok) { loginMessage.textContent = data.error || 'Login failed'; return; }
    loginMessage.textContent = "Logged in successfully";
    checkSession();
  } catch (err) { loginMessage.textContent = err.message; }
});

logoutBtn.addEventListener("click", async () => {
  await fetch(`${API_URL}/api/admin/logout`, { method: 'POST', credentials: 'include' });
  checkSession();
});

function previewImage(input) {
  const preview = document.getElementById('image-preview');
  if (input.files?.[0]) {
    const reader = new FileReader();
    reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
    reader.readAsDataURL(input.files[0]);
  } else { preview.style.display = 'none'; }
}

async function uploadImage(file) {
  const MAX_SIZE = 450000;
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  let base64 = dataUrl.split(',')[1];
  if (base64.length <= MAX_SIZE) {
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ image: base64 })
    });
    if (res.status === 401) throw new Error('Unauthorized');
    const d = await res.json();
    if (res.ok && d.url) return d.url;
    throw new Error(d.error || 'Upload failed');
  }

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  function resize(w, q) {
    const c = document.createElement('canvas');
    const ratio = Math.min(w / img.width, 1);
    c.width = Math.round(img.width * ratio);
    c.height = Math.round(img.height * ratio);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', q).split(',')[1];
  }

  let quality = 0.85;
  let width = 800;
  base64 = resize(width, quality);
  while (base64.length > MAX_SIZE && width > 200) {
    if (quality > 0.3) { quality -= 0.1; base64 = resize(width, quality); }
    else { width -= 100; quality = 0.85; base64 = resize(width, quality); }
  }
  if (base64.length > MAX_SIZE) throw new Error('Image too large even after compression');

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ image: base64 })
  });
  if (res.status === 401) throw new Error('Unauthorized');
  const d = await res.json();
  if (res.ok && d.url) return d.url;
  throw new Error(d.error || 'Upload failed');
}

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  productMessage.textContent = "Saving...";
  const clearPreview = () => {
    imageInput.value = '';
    const pv = document.getElementById('image-preview');
    if (pv) { pv.style.display = 'none'; pv.src = ''; }
  };
  try {
    let imageUrl = imageInput.files[0] ? await uploadImage(imageInput.files[0]) : null;
    const payload = { name: nameInput.value, label: labelInput.value, price: Number(priceInput.value), note: noteInput.value, description: descriptionInput.value, is_available: isAvailableInput.checked };
    if (imageUrl) payload.image_url = imageUrl;

    const id = productIdInput.value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/api/admin/products/${id}` : `${API_URL}/api/admin/products`;

    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(payload)
    });
    if (res.status === 401) { clearPreview(); checkSession(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed');
    productMessage.textContent = "Product saved successfully";
    productForm.reset(); productIdInput.value = ""; isAvailableInput.checked = true;
    clearPreview();
    loadAdminProducts();
  } catch (err) { productMessage.textContent = err.message; clearPreview(); }
});

resetBtn.addEventListener("click", () => {
  productForm.reset(); productIdInput.value = ""; isAvailableInput.checked = true;
  imageInput.value = '';
  const preview = document.getElementById('image-preview');
  if (preview) { preview.style.display = 'none'; preview.src = ''; }
  productMessage.textContent = '';
});

async function loadAdminProducts() {
  try {
    const res = await fetch(`${API_URL}/api/admin/products?t=${Date.now()}`, { credentials: 'include' });
    if (res.status === 401) { checkSession(); return; }
    const data = await res.json();
    if (!res.ok || !data.length) { adminProducts.innerHTML = `<p class="muted">No products</p>`; return; }
    adminProducts.innerHTML = "";
    data.forEach(p => {
      const item = document.createElement("div");
      item.className = "admin-product-item";
      item.innerHTML = `<img src="${p.image_url || 'Logo2.png'}" alt="${p.name}"><div><h4>${p.name}</h4><p>${p.description || ''}</p><p><strong>Price:</strong> ${p.price} LE</p><p><strong>Label:</strong> ${p.label || '-'}</p><p><strong>Note:</strong> ${p.note || '-'}</p><p><strong>Available:</strong> ${p.is_available == 1 || p.is_available === true ? 'Yes' : 'No'}</p></div><div class="admin-product-actions"><button class="small-btn edit-btn" data-id="${p.id}">Edit</button><button class="small-btn delete-btn" data-id="${p.id}">Delete</button></div>`;
      adminProducts.appendChild(item);
    });
    bindAdminActions(data);
  } catch (e) { adminProducts.innerHTML = `<p class="message">Error loading products</p>`; }
}

function bindAdminActions(products) {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = products.find(x => x.id == btn.dataset.id);
      if (!p) { console.warn('Edit: product not found', btn.dataset.id, 'in', products.length, 'products'); return; }
      productIdInput.value = p.id; nameInput.value = p.name || ''; labelInput.value = p.label || '';
      priceInput.value = p.price || ''; noteInput.value = p.note || ''; descriptionInput.value = p.description || '';
      isAvailableInput.checked = p.is_available == 1 || p.is_available === true;
      const preview = document.getElementById('image-preview');
      if (p.image_url) { preview.src = p.image_url; preview.style.display = 'block'; }
      else { preview.style.display = 'none'; preview.src = ''; }
      imageInput.value = '';
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Are you sure?")) return;
      const res = await fetch(`${API_URL}/api/admin/products/${btn.dataset.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.status === 401) { checkSession(); return; }
      loadAdminProducts();
    });
  });
}

settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  settingsMessage.textContent = "Saving...";
  try {
    const res = await fetch(`${API_URL}/api/admin/settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: document.getElementById("site-name").value, description: document.getElementById("site-desc").value, instagram: document.getElementById("instagram").value, shipping_cost: Number(document.getElementById("shipping-cost").value) || 50 })
    });
    if (res.status === 401) { checkSession(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed');
    settingsMessage.textContent = "Settings saved";
  } catch (err) { settingsMessage.textContent = err.message; }
});

async function loadSettings() {
  try {
    const res = await fetch(`${API_URL}/api/settings`);
    const data = await res.json();
    if (res.ok && data) {
      document.getElementById("site-name").value = data.name || '';
      document.getElementById("site-desc").value = data.description || '';
      document.getElementById("instagram").value = data.instagram || '';
      document.getElementById("shipping-cost").value = data.shipping_cost || 50;
    }
  } catch (e) { console.error(e); }
}

let notificationCount = 0;

async function loadOrders() {
  try {
    const res = await fetch(`${API_URL}/api/orders`);
    const data = await res.json();
    if (!res.ok || !data.length) { ordersList.innerHTML = `<p class="muted">No orders</p>`; return; }
    ordersList.innerHTML = "";
    notificationCount = 0;
    data.forEach(o => {
      const sc = o.status;
      const scClass = sc === 'completed' ? 'completed' : sc === 'cancelled' ? 'cancelled' : 'pending';
      let items = '';
      try { const arr = typeof o.items === 'string' ? JSON.parse(o.items) : o.items; if (Array.isArray(arr)) items = arr.map(i => `${i.product_name}×${i.quantity}`).join(', '); } catch {}
      const total = (o.total_price || 0) + (o.shipping_cost || 50);
      const div = document.createElement("div"); div.className = "order-item";
      const s = o.status;
      const actions = s === 'pending' ? `<button class="small-btn ship-btn" data-id="${o.id}">Ship</button><button class="small-btn cancel-btn" data-id="${o.id}">Cancel</button>`
        : s === 'shipped' ? `<button class="small-btn deliver-btn" data-id="${o.id}">Deliver</button><button class="small-btn cancel-btn" data-id="${o.id}">Cancel</button>`
        : s === 'delivered' ? `<span class="muted">Completed</span>`
        : `<span class="muted">${s}</span>`;
      div.innerHTML = `<div><h4>${o.customer_name}</h4><p><strong>Phone:</strong> ${o.phone}</p><p><strong>Products:</strong> ${items}</p><p><strong>Total:</strong> ${total} LE</p><p><strong>Status:</strong> <span class="status-badge ${scClass}">${o.status}</span></p></div><div class="order-actions">${actions}</div>`;
      ordersList.appendChild(div);
      if (!o.seen) notificationCount++;
    });
    updateNotificationBadge();
    lastNotifCount = notificationCount;
    bindOrderActions();
    loadAdminUsers();
  } catch { ordersList.innerHTML = `<p class="message">Error loading orders</p>`; }
}

function updateNotificationBadge() {
  const b = document.getElementById("notification-badge");
  if (b) { b.textContent = notificationCount; b.style.display = notificationCount > 0 ? "block" : "none"; }
}

function showToast(msg, type = 'success') {
  let ov = document.querySelector('.toast-overlay');
  if (!ov) { ov = document.createElement('div'); ov.className = 'toast-overlay'; document.body.appendChild(ov); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  ov.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 3000);
}

let lastNotifCount = 0;
async function pollNotifications() {
  try {
    const res = await fetch(`${API_URL}/api/admin/notifications/count`, { credentials: 'include' });
    if (res.status === 401) return;
    const data = await res.json();
    if (data.count > lastNotifCount && lastNotifCount !== 0) {
      showToast(`${data.count - lastNotifCount} new order(s) received!`, 'success');
    }
    if (data.count !== lastNotifCount) {
      notificationCount = data.count;
      updateNotificationBadge();
      lastNotifCount = data.count;
    }
  } catch {}
}

setInterval(pollNotifications, 15000);

function bindOrderActions() {
  const act = (sel, status) => {
    document.querySelectorAll(sel).forEach(btn => {
      btn.addEventListener("click", async () => {
        const r = await fetch(`${API_URL}/api/admin/orders/${btn.dataset.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status }) });
        if (r.ok) loadOrders();
      });
    });
  };
  act('.ship-btn', 'shipped');
  act('.deliver-btn', 'delivered');
  act('.cancel-btn', 'cancelled');
}

document.getElementById("orders-tab")?.addEventListener("click", async () => {
  try { await fetch(`${API_URL}/api/admin/notifications/mark-seen`, { method: 'PUT', credentials: 'include' }); } catch {}
  loadOrders();
});
document.getElementById("products-tab")?.addEventListener("click", () => {
  ["settings","orders","users"].forEach(id => { document.getElementById(id+"-tab")?.classList.remove("active"); document.getElementById(id+"-panel")?.classList.add("hidden"); });
  document.getElementById("products-tab")?.classList.add("active");
  document.getElementById("products-panel")?.classList.remove("hidden");
});
document.getElementById("settings-tab")?.addEventListener("click", () => {
  ["products","orders","users"].forEach(id => { document.getElementById(id+"-tab")?.classList.remove("active"); document.getElementById(id+"-panel")?.classList.add("hidden"); });
  document.getElementById("settings-tab")?.classList.add("active");
  document.getElementById("settings-panel")?.classList.remove("hidden");
});
document.getElementById("orders-tab")?.addEventListener("click", () => {
  document.getElementById("products-tab")?.classList.remove("active");
  document.getElementById("settings-tab")?.classList.remove("active");
  document.getElementById("users-tab")?.classList.remove("active");
  document.getElementById("orders-tab")?.classList.add("active");
  document.getElementById("products-panel")?.classList.add("hidden");
  document.getElementById("settings-panel")?.classList.add("hidden");
  document.getElementById("users-panel")?.classList.add("hidden");
  document.getElementById("orders-panel")?.classList.remove("hidden");
});
document.getElementById("users-tab")?.addEventListener("click", () => {
  ["products","settings","orders","activity"].forEach(id => { document.getElementById(id+"-tab")?.classList.remove("active"); document.getElementById(id+"-panel")?.classList.add("hidden"); });
  document.getElementById("users-tab")?.classList.add("active");
  document.getElementById("users-panel")?.classList.remove("hidden");
  loadAdminUsers();
});
document.getElementById("activity-tab")?.addEventListener("click", () => {
  ["products","settings","orders","users"].forEach(id => { document.getElementById(id+"-tab")?.classList.remove("active"); document.getElementById(id+"-panel")?.classList.add("hidden"); });
  document.getElementById("activity-tab")?.classList.add("active");
  document.getElementById("activity-panel")?.classList.remove("hidden");
  loadActivityLog();
});

async function loadActivityLog() {
  const list = document.getElementById("activity-list");
  if (!list) return;
  try {
    const res = await fetch(`${API_URL}/api/admin/activity`, { credentials: 'include' });
    if (res.status === 401) { checkSession(); return; }
    const data = await res.json();
    if (!res.ok || !data.length) { list.innerHTML = `<p class="muted">No activity recorded yet</p>`; return; }
    list.innerHTML = '';
    data.forEach(a => {
      const d = document.createElement("div");
      d.className = "order-item";
      d.innerHTML = `<div><small style="color:#a37588;">${new Date(a.timestamp).toLocaleString()}</small><p><strong>${a.admin?.email || a.admin || 'admin'}</strong> ${a.action}</p><p class="muted">${a.details}</p></div>`;
      list.appendChild(d);
    });
  } catch { list.innerHTML = `<p class="message">Error loading activity</p>`; }
}

async function loadAdminUsers() {
  const list = document.getElementById("users-list");
  if (!list) return;
  try {
    const res = await fetch(`${API_URL}/api/admin/users`, { credentials: 'include' });
    if (res.status === 401) { checkSession(); return; }
    const data = await res.json();
    if (!res.ok || !data.length) { list.innerHTML = `<p class="muted">No users</p>`; return; }
    list.innerHTML = '';
    data.forEach(u => {
      const d = document.createElement("div");
      d.className = "order-item";
      d.innerHTML = `<div><h4>${u.name || 'No name'}</h4><p><strong>Email:</strong> ${u.email}</p><p><strong>Phone:</strong> ${u.phone || '-'}</p><p><strong>Registered:</strong> ${new Date(u.created_at).toLocaleDateString()}</p></div>`;
      list.appendChild(d);
    });
  } catch { list.innerHTML = `<p class="message">Error loading users</p>`; }
}

checkSession();
