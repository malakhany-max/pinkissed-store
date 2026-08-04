const API_URL = (window.location.hostname === 'malakhany-max.github.io' || window.location.hostname.endsWith('.github.io'))
  ? 'https://greg-marked-restaurants-retreat.trycloudflare.com'
  : window.location.origin;
const FALLBACK_PRODUCTS = [
  { id: 1, name: 'Heart Pin', label: 'Best Seller', price: 150, description: 'Cute heart shaped pin', image_url: 'images/products/heart-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 2, name: "Girl's Pin", label: 'New', price: 50, description: 'Sweet girly pin', image_url: 'images/products/girl-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 3, name: 'Star Pin Pack', label: 'Popular', price: 200, description: 'Shiny star pins pack', image_url: 'images/products/star-pin-pack.svg', note: 'In Stock', is_available: 1 },
  { id: 4, name: 'Bow Pin', label: 'Discount', price: 75, description: 'Love bow pin - girly style', image_url: 'images/products/bow-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 6, name: 'Cherry Pins', label: 'Limited', price: 120, description: 'Cherry shaped pins', image_url: 'images/products/cherry-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 7, name: 'Unicorn Pin', label: 'Special', price: 90, description: 'Magical unicorn pin', image_url: 'images/products/unicorn-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 8, name: 'Bear Pin', label: 'Cute', price: 85, description: 'Little bear pin', image_url: 'images/products/bear-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 9, name: 'Cat Pin Set', label: 'Cute', price: 160, description: 'Adorable cat pins set of 4', image_url: 'images/products/cat-pin-set.svg', note: 'In Stock', is_available: 1 },
  { id: 10, name: 'Butterfly Pin', label: 'New', price: 65, description: 'Beautiful butterfly pin', image_url: 'images/products/butterfly-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 11, name: 'Strawberry Pin', label: 'Sale', price: 55, description: 'Cute strawberry pin', image_url: 'images/products/strawberry-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 12, name: 'Moon Pin', label: 'Dreamy', price: 70, description: 'Crescent moon pin', image_url: 'images/products/moon-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 13, name: 'Sun Pin', label: 'Bright', price: 60, description: 'Sunshine pin', image_url: 'images/products/sun-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 14, name: 'Rainbow Pin Set', label: 'Colorful', price: 190, description: 'Rainbow pins set', image_url: 'images/products/rainbow-pin-set.svg', note: 'In Stock', is_available: 1 },
  { id: 15, name: 'Mermaid Pin', label: 'Ocean', price: 95, description: 'Mermaid pin', image_url: 'images/products/mermaid-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 16, name: 'Crown Pin', label: 'Royal', price: 80, description: 'Queen crown pin', image_url: 'images/products/crown-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 17, name: 'Flower Pin Set', label: 'New Drop', price: 180, description: 'Beautiful flower pins', image_url: 'images/products/flower-pin-set.svg', note: 'In Stock', is_available: 1 },
  { id: 18, name: 'Cloud Pin', label: 'Soft', price: 45, description: 'Fluffy cloud pin', image_url: 'images/products/cloud-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 19, name: 'Smiley Pin', label: 'Happy', price: 40, description: 'Happy smiley pin', image_url: 'images/products/smiley-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 20, name: 'Paw Pin', label: 'Cute', price: 60, description: 'Sweet paw print pin', image_url: 'images/products/paw-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 21, name: 'Rose Pin', label: 'Romantic', price: 85, description: 'Pretty rose pin', image_url: 'images/products/rose-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 22, name: 'Love Pin Set', label: 'Love', price: 130, description: 'Cute love pins set', image_url: 'images/products/love-pin-set.svg', note: 'In Stock', is_available: 1 },
  { id: 23, name: 'Dolphin Pin', label: 'Ocean', price: 70, description: 'Playful dolphin pin', image_url: 'images/products/dolphin-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 24, name: 'Fairy Pin', label: 'Magic', price: 100, description: 'Magical fairy pin', image_url: 'images/products/fairy-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 25, name: 'Peach Pin', label: 'Sweet', price: 65, description: 'Juicy peach pin', image_url: 'images/products/peach-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 26, name: 'Angel Pin', label: 'Sweet', price: 90, description: 'Sweet angel pin', image_url: 'images/products/angel-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 27, name: 'Flower Pin', label: 'Fresh', price: 55, description: 'Fresh flower pin', image_url: 'images/products/flower-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 28, name: 'Kawaii Pin', label: 'Kawaii', price: 75, description: 'Super kawaii pin', image_url: 'images/products/kawaii-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 29, name: 'Sparkle Pin', label: 'Shiny', price: 50, description: 'Sparkly pin', image_url: 'images/products/sparkle-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 30, name: 'Candy Pin', label: 'Sweet', price: 60, description: 'Yummy candy pin', image_url: 'images/products/candy-pin.svg', note: 'In Stock', is_available: 1 },
  { id: 31, name: 'Frog Pin', label: 'Cute', price: 65, description: 'Tiny frog pin', image_url: 'images/products/frog-pin.svg', note: 'In Stock', is_available: 1 }
];
let currentUser;
try { currentUser = JSON.parse(localStorage.getItem('user')); } catch { currentUser = null; }
let products = [];

/* Toast notifications */
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

/* Cart (localStorage) */
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

/* Auth UI */
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

/* Add to Cart (client-side) */
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

/* Load Products */
async function loadProducts() {
  const page = window.location.pathname.split('/').pop();

  async function getProducts() {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (Array.isArray(data) && data.length) return data;
    } catch (e) { console.warn('API unavailable, using fallback products:', e.message); }
    return FALLBACK_PRODUCTS;
  }

  if (page === 'index.html' || page === '') {
    const bs = document.getElementById('best-sellers-grid');
    const sg = document.getElementById('sale-products-grid');
    const data = await getProducts();
    products = data;
    const avail = data.filter(p => p.is_available == 1 || p.is_available === true);
    if (bs) renderProductGrid(avail.slice(0, 4), bs);
    if (sg) {
      const sale = avail.filter(p => p.label && (p.label.toLowerCase().includes('sale') || p.label.toLowerCase().includes('discount')));
      renderProductGrid(sale, sg);
      sg.parentElement.style.display = sale.length === 0 ? 'none' : 'block';
    }
    return;
  }

  const tg = productsGrid;
  if (!tg) return;
  const data = await getProducts();
  products = data;
  tg.innerHTML = '';
  const avail = data.filter(p => p.is_available == 1 || p.is_available === true);
  if (!avail.length) { if (emptyMessage) { emptyMessage.style.display = 'block'; emptyMessage.textContent = 'No products'; } return; }
  avail.forEach(p => {
    const c = document.createElement('div');
    c.className = 'product-card';
    c.onclick = () => window.location.href = `product.html?id=${p.id}`;
    c.innerHTML = `<div class="product-image"><img src="${p.image_url || 'Logo2.png'}" alt="${p.name}"></div><div class="product-body"><span class="product-label">${p.label || 'Pinkissed Pick'}</span><h4>${p.name}</h4><p>${p.description || ''}</p><div class="price-row"><div class="price">${p.price} LE</div><div class="small-note">${p.note || 'Available'}</div></div><div class="card-actions"><button onclick="event.stopPropagation(); window.location.href='product.html?id=${p.id}'">View</button><button class="add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image_url || ''}" onclick="event.stopPropagation(); addToCart(this)">Add to Cart</button></div></div>`;
    tg.appendChild(c);
  });
  if (emptyMessage) emptyMessage.style.display = 'none';
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

/* Mobile Menu */
if (menuToggle && navLinks) {
  const cm = document.getElementById("close-menu-btn");
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    navLinks.classList.toggle("open");
    menuToggle.textContent = navLinks.classList.contains("open") ? "\u2715" : "\u2630";
  });
  if (cm) cm.addEventListener("click", () => { navLinks.classList.remove("open"); menuToggle.textContent = "\u2630"; });
  document.querySelectorAll(".nav-links a").forEach(l => l.addEventListener("click", () => { navLinks.classList.remove("open"); menuToggle.textContent = "\u2630"; }));
  document.addEventListener("click", (e) => {
    if (navLinks.classList.contains("open") && !navLinks.contains(e.target) && e.target !== menuToggle) {
      navLinks.classList.remove("open");
      menuToggle.textContent = "\u2630";
    }
  });
}
