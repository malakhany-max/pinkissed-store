require('dotenv').config();
require('express-async-errors');
const express = require('express');
const https = require('https');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { z } = require('zod');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const JWT_SECRET = process.env.JWT_SECRET || 'pinkissed_jwt_s3cr3t_k3y_2026!';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@pinkissed.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Pinkissed2026!';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);
const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'https://pinkissed.com', 'https://www.pinkissed.com', 'http://192.168.100.5:3000', 'https://192.168.100.5:3443', 'https://cf85gxml-3000.uks1.devtunnels.ms'];

/* ───── Helpers ───── */
function loadJson(filename) {
  const p = path.join(__dirname, 'data', filename);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}
function saveJson(filename, data) {
  fs.writeFileSync(path.join(__dirname, 'data', filename), JSON.stringify(data, null, 2));
}
function logActivity(admin, action, details) {
  const logs = loadJson('activity.json');
  logs.unshift({ admin, action, details, ip: admin?.ip || '', timestamp: new Date().toISOString() });
  if (logs.length > 200) logs.length = 200;
  saveJson('activity.json', logs);
}

/* ───── Security Middleware ───── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
function isOriginAllowed(o) {
  if (!o) return true;
  if (ALLOWED_ORIGINS.includes(o)) return true;
  try { const u = new URL(o); if (u.hostname.endsWith('.trycloudflare.com') || u.hostname.endsWith('.devtunnels.ms') || u.hostname.endsWith('.loca.lt')) return true; } catch {}
  return false;
}
app.use(cors({ origin: (o, cb) => { if (isOriginAllowed(o)) cb(null, true); else cb(new Error('Not allowed by CORS')); }, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

/* ───── Rate Limiting ───── */
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many attempts' } }));
app.use('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many attempts' } }));
app.use('/api/orders', rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many orders' } }));
app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 200 }));

/* ───── Directories ───── */
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

/* ───── Token Helpers ───── */
function getToken(req) {
  if (req.cookies?.token) return req.cookies.token;
  const a = req.headers.authorization;
  if (a?.startsWith('Bearer ')) return a.split(' ')[1];
  return null;
}
function setCookie(res, token, ms) {
  res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: ms, path: '/' });
}
function clearCookie(res) { res.clearCookie('token', { path: '/' }); }

/* ───── Auth Middleware ───── */
function verifyAdmin(req, res, next) {
  const t = getToken(req);
  if (!t) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const d = jwt.verify(t, JWT_SECRET);
    if (d.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.admin = d; next();
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}

function verifyUser(req, res, next) {
  const t = getToken(req);
  if (!t) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const d = jwt.verify(t, JWT_SECRET);
    if (d.role !== 'user') return res.status(403).json({ error: 'Forbidden' });
    req.user = d; next();
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}

/* ───── Zod Schemas ───── */
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const registerSchema = z.object({ name: z.string().trim().max(100).default(''), email: z.string().email(), phone: z.string().trim().max(20).default(''), password: z.string().min(6) });
const productSchema = z.object({ name: z.string().trim().min(1).max(200), price: z.number().min(0), label: z.string().trim().max(100).optional().default(''), note: z.string().trim().max(200).optional().default(''), description: z.string().trim().max(1000).optional().default(''), image_url: z.string().optional().default(''), is_available: z.boolean().optional().default(true) });
const orderSchema = z.object({ customer_name: z.string().trim().min(1).max(100), phone: z.string().trim().min(1).max(20), city: z.string().trim().max(100).optional().default(''), address: z.string().trim().max(500).optional().default(''), notes: z.string().trim().max(1000).optional().default(''), user_id: z.any().optional(), items: z.array(z.any()).min(1), total_price: z.number().min(0), shipping_cost: z.number().min(0).optional().default(0) });

function validate(schema, body) {
  const r = schema.safeParse(body);
  if (!r.success) return { error: 'Validation failed', details: r.error.errors };
  return r.data;
}

/* ═══════════════════════════════════════
   USER AUTH
   ═══════════════════════════════════════ */

app.post('/api/auth/register', async (req, res) => {
  const data = validate(registerSchema, req.body);
  if (data.error) return res.status(422).json(data);

  const existing = await db.getUserByEmail(data.email);
  if (existing !== null && existing) return res.status(400).json({ error: 'Email already registered' });
  if (existing === null) {
    const users = loadJson('users.json');
    if (users.find(u => u.email === data.email)) return res.status(400).json({ error: 'Email already registered' });
  }

  const user = { id: Date.now(), ...data, password: bcrypt.hashSync(data.password, 10), created_at: new Date().toISOString() };

  const created = await db.createUser(user);
  if (created !== null) {
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    setCookie(res, token, 7 * 24 * 60 * 60 * 1000);
    return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  }

  const users = loadJson('users.json');
  users.push(user); saveJson('users.json', users);
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  setCookie(res, token, 7 * 24 * 60 * 60 * 1000);
  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/login', async (req, res) => {
  const data = validate(loginSchema, req.body);
  if (data.error) return res.status(422).json(data);

  let user = await db.getUserByEmail(data.email);
  if (user === null) {
    const users = loadJson('users.json');
    user = users.find(u => u.email === data.email);
  }
  if (!user || !bcrypt.compareSync(data.password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  setCookie(res, token, 7 * 24 * 60 * 60 * 1000);
  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, phone: user.phone } });
});

app.post('/api/auth/logout', (req, res) => { clearCookie(res); res.json({ success: true }); });

/* ═══════════════════════════════════════
   ADMIN AUTH
   ═══════════════════════════════════════ */

app.post('/api/admin/login', (req, res) => {
  const data = validate(loginSchema, req.body);
  if (data.error) return res.status(422).json(data);
  if (data.email !== ADMIN_EMAIL || !bcrypt.compareSync(data.password, ADMIN_PASSWORD_HASH)) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ email: data.email, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
  setCookie(res, token, 2 * 60 * 60 * 1000);
  res.json({ success: true, token, message: 'Login successful' });
});

app.post('/api/admin/logout', verifyAdmin, (req, res) => { clearCookie(res); res.json({ success: true }); });

/* ═══════════════════════════════════════
   PRODUCTS
   ═══════════════════════════════════════ */

app.get('/api/products', async (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  const fromDb = await db.getAllProducts();
  if (fromDb !== null) return res.json(fromDb);
  res.json(loadJson('products.json').filter(p => p.is_available == 1 || p.is_available === true));
});

app.get('/api/admin/products', verifyAdmin, async (req, res) => {
  const fromDb = await db.getAllProducts();
  if (fromDb !== null) return res.json(fromDb);
  res.json(loadJson('products.json'));
});

app.post('/api/admin/products', verifyAdmin, async (req, res) => {
  const data = validate(productSchema, req.body);
  if (data.error) return res.status(422).json(data);
  const product = { id: Date.now(), ...data };

  const created = await db.createProduct(product);
  if (created !== null) { logActivity(req.admin, 'create_product', `Added "${product.name}" (${product.price} LE)`); return res.json({ success: true, product: created }); }

  const products = loadJson('products.json');
  products.push(product); saveJson('products.json', products);
  logActivity(req.admin, 'create_product', `Added "${product.name}" (${product.price} LE)`);
  res.json({ success: true, product });
});

app.put('/api/admin/products/:id', verifyAdmin, async (req, res) => {
  const data = validate(productSchema, req.body);
  if (data.error) return res.status(422).json(data);

  const updated = await db.updateProduct(req.params.id, data);
  if (updated !== null) { logActivity(req.admin, 'update_product', `Updated product #${req.params.id} → "${data.name}"`); return res.json({ success: true, product: updated }); }

  const products = loadJson('products.json');
  const idx = products.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const old = products[idx];
  products[idx] = { ...old, ...data };
  saveJson('products.json', products);
  logActivity(req.admin, 'update_product', `Updated "${old.name}" → "${data.name}"`);
  res.json({ success: true, product: products[idx] });
});

app.delete('/api/admin/products/:id', verifyAdmin, async (req, res) => {
  const products = loadJson('products.json');
  const p = products.find(x => x.id == req.params.id);
  const deleted = await db.deleteProduct(req.params.id);
  if (deleted !== null) { logActivity(req.admin, 'delete_product', `Deleted product #${req.params.id} ${p ? '"'+p.name+'"' : ''}`); return res.json({ success: true }); }

  saveJson('products.json', loadJson('products.json').filter(x => x.id != req.params.id));
  logActivity(req.admin, 'delete_product', `Deleted product #${req.params.id} ${p ? '"'+p.name+'"' : ''}`);
  res.json({ success: true });
});

/* ═══════════════════════════════════════
   SETTINGS
   ═══════════════════════════════════════ */

app.get('/api/settings', async (req, res) => {
  const fromDb = await db.getSettings();
  if (fromDb !== null) return res.json(fromDb);
  const s = loadJson('settings.json');
  res.json(s[0] || { name: 'Pinkissed', logo_url: 'Logo2.png', description: 'Made To Match You', instagram: 'pinkissedd_' });
});

app.put('/api/admin/settings', verifyAdmin, async (req, res) => {
  const { name, logo_url, description, instagram, shipping_cost } = req.body;
  const updated = await db.updateSettings({ name: name || '', logo_url: logo_url || '', description: description || '', instagram: instagram || '', shipping_cost: Number(shipping_cost) || 50 });
  if (updated !== null) { logActivity(req.admin, 'update_settings', `Site name: "${name}", shipping: ${shipping_cost} LE`); return res.json({ success: true }); }
  saveJson('settings.json', [{ name, logo_url, description, instagram, shipping_cost }]);
  logActivity(req.admin, 'update_settings', `Site name: "${name}", shipping: ${shipping_cost} LE`);
  res.json({ success: true });
});

/* ═══════════════════════════════════════
   CART → Client-side (localStorage)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   ORDERS
   ═══════════════════════════════════════ */

app.get('/api/orders', verifyAdmin, async (req, res) => {
  const fromDb = await db.getAllOrders();
  if (fromDb !== null) return res.json(fromDb);
  res.json(loadJson('orders.json').sort((a, b) => b.created_at - a.created_at));
});

app.post('/api/orders', verifyUser, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ error: 'Admins cannot place orders' });
  const data = validate(orderSchema, req.body);
  if (data.error) return res.status(422).json(data);
  const order = { id: Date.now(), ...data, user_id: req.user.id, status: 'pending', seen: 0, created_at: new Date().toISOString() };

  const created = await db.createOrder(order);
  if (created !== null) return res.json({ success: true, order: created });

  const orders = loadJson('orders.json');
  orders.push(order); saveJson('orders.json', orders);
  res.json({ success: true, order });
});

app.get('/api/orders/my', verifyUser, async (req, res) => {
  const uid = req.user.id;
  const fromDb = await db.getAllOrders();
  if (fromDb !== null) return res.json(fromDb.filter(o => o.user_id == uid));
  const orders = loadJson('orders.json').filter(o => o.user_id == uid);
  res.json(orders.sort((a, b) => b.created_at - a.created_at));
});

app.put('/api/admin/orders/:id', verifyAdmin, async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'shipped', 'delivered', 'cancelled'];
  if (!status?.trim() || !valid.includes(status.trim())) return res.status(422).json({ error: 'Invalid status. Valid: ' + valid.join(', ') });

  const updated = await db.updateOrderStatus(req.params.id, status.trim());
  if (updated !== null) { logActivity(req.admin, 'update_order', `Order #${req.params.id} → ${status.trim()}`); return res.json({ success: true, order: updated }); }

  const orders = loadJson('orders.json');
  const idx = orders.findIndex(o => o.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  orders[idx].status = status.trim();
  saveJson('orders.json', orders);
  logActivity(req.admin, 'update_order', `Order #${req.params.id} → ${status.trim()}`);
  res.json({ success: true, order: orders[idx] });
});

/* ═══════════════════════════════════════
   ADMIN NOTIFICATIONS
   ═══════════════════════════════════════ */

app.get('/api/admin/notifications', verifyAdmin, async (req, res) => {
  const fromDb = await db.getUnseenOrders();
  if (fromDb !== null) return res.json(fromDb);
  res.json(loadJson('orders.json').filter(o => !o.seen));
});

app.get('/api/admin/notifications/count', verifyAdmin, async (req, res) => {
  const fromDb = await db.getUnseenOrders();
  if (fromDb !== null) return res.json({ count: fromDb.length });
  const unseen = loadJson('orders.json').filter(o => !o.seen);
  res.json({ count: unseen.length });
});

app.put('/api/admin/notifications/mark-seen', verifyAdmin, async (req, res) => {
  const done = await db.markAllOrdersSeen();
  if (done !== null) return res.json({ success: true });
  const orders = loadJson('orders.json');
  orders.forEach(o => o.seen = true);
  saveJson('orders.json', orders);
  res.json({ success: true });
});

/* ═══════════════════════════════════════
    ADMIN ACTIVITY LOG
    ═══════════════════════════════════════ */

app.get('/api/admin/activity', verifyAdmin, (req, res) => {
  res.json(loadJson('activity.json'));
});

/* ═══════════════════════════════════════
    ADMIN USERS
    ═══════════════════════════════════════ */

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  const fromDb = await db.getAllUsers?.();
  if (fromDb !== null) return res.json(fromDb.map(u => { const { password, ...safe } = u; return safe; }));
  const users = loadJson('users.json');
  res.json(users.map(u => { const { password, ...safe } = u; return safe; }));
});

/* ═══════════════════════════════════════
   IMAGE UPLOAD
   ═══════════════════════════════════════ */

app.post('/api/upload', verifyAdmin, (req, res) => {
  if (!req.body.image) return res.status(400).json({ error: 'No image' });
  if (req.body.image.length > 1000000) return res.status(413).json({ error: 'Image too large' });
  const filename = `product_${Date.now()}.png`;
  fs.writeFileSync(path.join(__dirname, 'uploads', filename), Buffer.from(req.body.image, 'base64'));
  res.json({ url: `/uploads/${filename}` });
});

/* ═══════════════════════════════════════
   FRONTEND
   ═══════════════════════════════════════ */

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

/* ═══════════════════════════════════════
   GLOBAL ERROR HANDLER
   ═══════════════════════════════════════ */

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message || err);
  if (err.message === 'Not allowed by CORS') return res.status(403).json({ error: 'Origin not allowed' });
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

/* ═══════════════════════════════════════
   START
   ═══════════════════════════════════════ */

/* ───── Seed DB from JSON on first run ───── */
try {
  db.seedFromJson('products.json', 'products');
  db.seedFromJson('users.json', 'users');
  db.seedFromJson('orders.json', 'orders');
} catch (e) { /* ignore if json files missing */ }

app.listen(PORT, () => {
  console.log(`\n✅ HTTP  → http://localhost:${PORT}`);
  console.log(`🔐 Admin: ${ADMIN_EMAIL}`);
  console.log(`🗄️  Storage: SQLite (store.db)`);
});

/* ───── HTTPS (self-signed cert for local/phone testing) ───── */
const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  try {
    const httpsOpts = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
    https.createServer(httpsOpts, app).listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS → https://192.168.100.5:${HTTPS_PORT}`);
      console.log(`⚠️  Self-signed cert — accept browser warning on first visit`);
    });
  } catch (e) {
    console.error(`❌ HTTPS server failed: ${e.message}`);
  }
}
