const API_URL = (window.location.hostname === 'malakhany-max.github.io' || window.location.hostname.endsWith('.github.io'))
  ? 'https://pinkissed-api.loca.lt'
  : window.location.origin;
let currentUser;
try { currentUser = JSON.parse(localStorage.getItem('user')); } catch { currentUser = null; }
let products = [];

/* ───── Toast ───── */
function showToast(msg, type = 'success') {
  let ov = document.querySelector('.toast-overlay');
  if (!ov) { ov = document.createElement('div'); ov.className = 'toast-overlay'; document.body.appendChild(ov); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  ov.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 3000);
}

const productsGrid = document.getElementById("products-grid");
const bestSellersGrid = document.getElementById("best-sellers-grid");
const emptyMessage = document.getElementById("empty-message");
const authBtn = document.getElementById("auth-btn");
const authModal = document.getElementById("auth-modal");
const closeAuth = document.getElementById("close-auth");
const authForm = document.getElementById("auth-form");
const authMessage = document.getElementById("auth-message");
const authSwitchBtn = document.getElementById("auth-switch-btn");
const authModalTitle = document.getElementById("auth-modal-title");
const authSubmit = document.getElementById("auth-submit");
const authSwitchText = document.getElementById("auth-switch-text");
const authName = document.getElementById("auth-name");
const authPhone = document.getElementById("auth-phone");
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
let isLoginMode = true;

/* ───── Cart (localStorage) ───── */
function getCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}
function loadCartCount() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + i.quantity, 0);
  const btn = document.getElementById('cart-btn');
  const count = document.querySelector(".cart-count");
  if (total > 0 && btn && count) {
    btn.classList.add("has-items");
    count.textContent = total;
  } else if (btn && count) {
    btn.classList.remove("has-items");
    count.textContent = '0';
  }
}

/* ───── Auth UI ───── */
function updateAuthUI() {
  if (!authBtn) return;
  if (currentUser?.id) {
    authBtn.textContent = `Hi, ${currentUser.name || currentUser.email || 'User'}`;
    authBtn.classList.add("logged-in");
  } else {
    authBtn.textContent = 'Login';
    authBtn.classList.remove("logged-in");
  }
  loadCartCount();
}

if (authBtn) {
  authBtn.addEventListener("click", () => {
    if (currentUser?.id) {
      if (confirm('Logout?')) {
        currentUser = null;
        localStorage.removeItem('user');
        fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
        updateAuthUI();
      }
    } else if (authModal) {
      authModal.style.display = 'flex';
    }
  });
}

if (closeAuth && authModal) {
  closeAuth.addEventListener("click", () => { authModal.style.display = 'none'; });
}

if (authSwitchBtn) {
  authSwitchBtn.addEventListener("click", () => {
    isLoginMode = !isLoginMode;
    if (authModalTitle) authModalTitle.textContent = isLoginMode ? 'Login' : 'Sign Up';
    if (authSubmit) authSubmit.textContent = isLoginMode ? 'Login' : 'Sign Up';
    if (authSwitchText) authSwitchText.textContent = isLoginMode ? "Don't have an account?" : 'Already have an account?';
    if (authSwitchBtn) authSwitchBtn.textContent = isLoginMode ? 'Sign Up' : 'Login';
    if (authName) authName.style.display = isLoginMode ? 'none' : 'block';
    if (authPhone) authPhone.style.display = isLoginMode ? 'none' : 'block';
    if (authMessage) authMessage.textContent = '';
  });
}

if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const name = authName?.value || '';
    const phone = authPhone?.value || '';
    if (authMessage) authMessage.textContent = isLoginMode ? 'Logging in...' : 'Creating account...';

    try {
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
      const body = isLoginMode ? { email, password } : { email, password, name, phone };
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) { if (authMessage) authMessage.textContent = data.error; return; }

      if (isLoginMode) {
        currentUser = data.user;
      } else {
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          credentials: 'include', body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginData.success) currentUser = loginData.user;
      }
      if (currentUser) localStorage.setItem('user', JSON.stringify(currentUser));
      if (authModal) authModal.style.display = 'none';
      authForm.reset();
      updateAuthUI();
    } catch (err) {
      if (authMessage) authMessage.textContent = 'Error. Try again.';
    }
  });
}

/* ───── Add to Cart (client-side) ───── */
function addToCart(btn) {
  if (!currentUser?.id) {
    if (authModal) {
      authModal.style.display = 'flex';
      if (authMessage) authMessage.textContent = 'Please login to add items to cart';
    }
    return;
  }

  const cart = getCart();
  const existing = cart.find(i => String(i.product_id) === btn.dataset.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: Date.now(),
      product_id: btn.dataset.id,
      product_name: btn.dataset.name,
      product_price: Number(btn.dataset.price),
      product_image: btn.dataset.image,
      quantity: 1
    });
  }
  saveCart(cart);
  loadCartCount();
  showToast(`Added ${btn.dataset.name} to cart!`);
}

/* ───── Load Products ───── */
async function loadProducts() {
  const page = window.location.pathname.split('/').pop();

  if (page === 'index.html' || page === '') {
    const bs = document.getElementById('best-sellers-grid');
    const sg = document.getElementById('sale-products-grid');
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      if (res.ok && data) {
        products = data;
        const avail = data.filter(p => p.is_available == 1 || p.is_available === true);
        if (bs) renderProductGrid(avail.slice(0, 4), bs);
        if (sg) {
          const sale = avail.filter(p => p.label && (p.label.toLowerCase().includes('sale') || p.label.toLowerCase().includes('discount')));
          renderProductGrid(sale, sg);
          sg.parentElement.style.display = sale.length === 0 ? 'none' : 'block';
        }
      }
    } catch (e) { console.error(e); }
    return;
  }

  const tg = productsGrid;
  if (!tg) return;
  try {
    const res = await fetch(`${API_URL}/api/products`);
    const data = await res.json();
    if (!res.ok) { if (emptyMessage) { emptyMessage.style.display = 'block'; emptyMessage.textContent = 'Error loading products'; } return; }
    products = data;
    tg.innerHTML = '';
    if (!data.length) { if (emptyMessage) { emptyMessage.style.display = 'block'; emptyMessage.textContent = 'No products'; } return; }
    data.filter(p => p.is_available == 1 || p.is_available === true).forEach(p => {
      const c = document.createElement('div');
      c.className = 'product-card';
      c.onclick = () => window.location.href = `product.html?id=${p.id}`;
      c.innerHTML = `<div class="product-image"><img src="${p.image_url || 'Logo2.png'}" alt="${p.name}"></div><div class="product-body"><span class="product-label">${p.label || 'Pinkissed Pick'}</span><h4>${p.name}</h4><p>${p.description || ''}</p><div class="price-row"><div class="price">${p.price} LE</div><div class="small-note">${p.note || 'Available'}</div></div><div class="card-actions"><button onclick="event.stopPropagation(); window.location.href='product.html?id=${p.id}'">View</button><button class="add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image_url || ''}" onclick="event.stopPropagation(); addToCart(this)">Add to Cart</button></div></div>`;
      tg.appendChild(c);
    });
    if (emptyMessage) emptyMessage.style.display = 'none';
  } catch (e) { if (emptyMessage) { emptyMessage.style.display = 'block'; emptyMessage.textContent = 'Error loading products'; } }
}

function renderProductGrid(list, tg) {
  tg.innerHTML = '';
  list.forEach(p => {
    const c = document.createElement('div');
    c.className = 'product-card';
    c.onclick = () => window.location.href = `product.html?id=${p.id}`;
    c.innerHTML = `<div class="product-image"><img src="${p.image_url || 'Logo2.png'}" alt="${p.name}"></div><div class="product-body"><span class="product-label">${p.label || 'Pinkissed Pick'}</span><h4>${p.name}</h4><p>${p.description || ''}</p><div class="price-row"><div class="price">${p.price} LE</div><div class="small-note">${p.note || 'Available'}</div></div><div class="card-actions"><button onclick="event.stopPropagation(); window.location.href='product.html?id=${p.id}'">View</button><button class="add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image_url || ''}" onclick="event.stopPropagation(); addToCart(this)">Add to Cart</button></div></div>`;
    tg.appendChild(c);
  });
}

updateAuthUI();
loadProducts();

/* ───── Mobile Menu ───── */
if (menuToggle && navLinks) {
  const cm = document.getElementById("close-menu-btn");
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    navLinks.classList.toggle("open");
    menuToggle.textContent = navLinks.classList.contains("open") ? "✕" : "☰";
  });
  if (cm) cm.addEventListener("click", () => { navLinks.classList.remove("open"); menuToggle.textContent = "☰"; });
  document.querySelectorAll(".nav-links a").forEach(l => l.addEventListener("click", () => { navLinks.classList.remove("open"); menuToggle.textContent = "☰"; }));
  document.addEventListener("click", (e) => {
    if (navLinks.classList.contains("open") && !navLinks.contains(e.target) && e.target !== menuToggle) {
      navLinks.classList.remove("open");
      menuToggle.textContent = "☰";
    }
  });
}
