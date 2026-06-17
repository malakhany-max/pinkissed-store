const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'store.db');
let db = null;

try {
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initTables();
  console.log('[DB] SQLite initialized');
} catch (e) {
  console.warn('[DB] SQLite unavailable, falling back to JSON:', e.message);
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      label TEXT DEFAULT '',
      price REAL NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      note TEXT DEFAULT '',
      is_available INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT DEFAULT '',
      address TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      user_id INTEGER DEFAULT NULL,
      items TEXT DEFAULT '[]',
      total_price REAL NOT NULL,
      shipping_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      seen INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT 'Pinkissed',
      logo_url TEXT DEFAULT 'Logo2.png',
      description TEXT DEFAULT 'Made To Match You',
      instagram TEXT DEFAULT 'pinkissedd_',
    shipping_cost REAL DEFAULT 50
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin TEXT DEFAULT '',
      action TEXT DEFAULT '',
      details TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.prepare('INSERT OR IGNORE INTO settings (id, name) VALUES (1, \'Pinkissed\')').run();
  try { db.prepare("ALTER TABLE settings ADD COLUMN shipping_cost REAL DEFAULT 50").run(); } catch {}
}

/* ───── Products ───── */
function getAllProducts() {
  if (!db) return null;
  return db.prepare('SELECT * FROM products ORDER BY id').all();
}

function cleanProduct(p) {
  const c = { ...p };
  if (typeof c.is_available === 'boolean') c.is_available = Number(c.is_available);
  return c;
}

function createProduct(p) {
  if (!db) return null;
  const r = db.prepare('INSERT INTO products (id, name, label, price, description, image_url, note, is_available) VALUES (@id, @name, @label, @price, @description, @image_url, @note, @is_available)').run(cleanProduct(p));
  return db.prepare('SELECT * FROM products WHERE id = ?').get(r.lastInsertRowid);
}

function updateProduct(id, updates) {
  if (!db) return null;
  db.prepare('UPDATE products SET name=@name, label=@label, price=@price, description=@description, image_url=@image_url, note=@note, is_available=@is_available WHERE id=@id').run(cleanProduct({ id, ...updates }));
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

function deleteProduct(id) {
  if (!db) return null;
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return true;
}

/* ───── Users ───── */
function getUserByEmail(email) {
  if (!db) return null;
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
}

function createUser(user) {
  if (!db) return null;
  const r = db.prepare('INSERT INTO users (id, name, email, phone, password, created_at) VALUES (@id, @name, @email, @phone, @password, @created_at)').run(user);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(r.lastInsertRowid);
}

function getAllUsers() {
  if (!db) return null;
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
}

/* ───── Orders ───── */
function getAllOrders() {
  if (!db) return null;
  return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
}

function createOrder(order) {
  if (!db) return null;
  const o = { ...order, items: typeof order.items === 'string' ? order.items : JSON.stringify(order.items), seen: 0 };
  const r = db.prepare('INSERT INTO orders (id, customer_name, phone, city, address, notes, user_id, items, total_price, shipping_cost, status, seen, created_at) VALUES (@id, @customer_name, @phone, @city, @address, @notes, @user_id, @items, @total_price, @shipping_cost, @status, @seen, @created_at)').run(o);
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(r.lastInsertRowid);
}

function updateOrderStatus(id, status) {
  if (!db) return null;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

function getUnseenOrders() {
  if (!db) return null;
  return db.prepare('SELECT * FROM orders WHERE seen = 0').all();
}

function markAllOrdersSeen() {
  if (!db) return null;
  db.prepare('UPDATE orders SET seen = 1 WHERE seen = 0').run();
  return true;
}

/* ───── Settings ───── */
function getSettings() {
  if (!db) return null;
  return db.prepare('SELECT * FROM settings WHERE id = 1').get() || null;
}

function updateSettings(s) {
  if (!db) return null;
  db.prepare('UPDATE settings SET name=@name, logo_url=@logo_url, description=@description, instagram=@instagram, shipping_cost=@shipping_cost WHERE id=1').run(s);
  return db.prepare('SELECT * FROM settings WHERE id = 1').get();
}

/* ───── Migration helper ───── */
function seedFromJson(filename, table) {
  const p = path.join(__dirname, 'data', filename);
  if (!fs.existsSync(p)) return;
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  if (!data.length) return;
  const existing = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
  if (existing.c > 0) return;
  for (const row of data) {
    const clean = {};
    for (const [k, v] of Object.entries(row)) {
      clean[k] = Array.isArray(v) || (v && typeof v === 'object') ? JSON.stringify(v) : typeof v === 'boolean' ? Number(v) : v;
    }
    const cols = Object.keys(clean).join(',');
    const vals = Object.keys(clean).map(k => `@${k}`).join(',');
    db.prepare(`INSERT OR IGNORE INTO ${table} (${cols}) VALUES (${vals})`).run(clean);
  }
  console.log(`[DB] Seeded ${data.length} ${table} from JSON`);
}

/* ───── Cleanup ───── */
function close() {
  if (db) db.close();
}

module.exports = {
  getAllProducts, createProduct, updateProduct, deleteProduct,
  getUserByEmail, createUser, getAllUsers,
  getAllOrders, createOrder, updateOrderStatus, getUnseenOrders, markAllOrdersSeen,
  getSettings, updateSettings,
  seedFromJson, close
};
