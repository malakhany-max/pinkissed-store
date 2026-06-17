require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const DATA_DIR = path.join(__dirname, 'data');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function loadJson(filename) {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

async function migrate(table, filename) {
  const data = loadJson(filename);
  if (!data.length) {
    console.log(`  ${table}: no data, skipping`);
    return;
  }
  const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
  if (error) {
    console.error(`  ${table}: FAILED -`, error.message);
  } else {
    console.log(`  ${table}: ${data.length} records migrated`);
  }
}

async function run() {
  console.log('Migrating JSON → Supabase...\n');
  await migrate('products', 'products.json');
  await migrate('users', 'users.json');
  await migrate('orders', 'orders.json');
  const settings = loadJson('settings.json');
  if (settings.length) {
    const { error } = await supabase.from('settings').upsert(settings, { onConflict: 'id' });
    if (error) console.error(`  settings: FAILED -`, error.message);
    else console.log(`  settings: migrated`);
  } else {
    console.log('  settings: no file, default row will be used');
  }
  console.log('\nDone!');
}

run().catch(console.error);
