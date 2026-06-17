-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/akbfvwqdupuyhbkijoah/sql/new

CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT DEFAULT '',
  price NUMERIC NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  note TEXT DEFAULT '',
  is_available BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  name TEXT DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  user_id BIGINT DEFAULT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_price NUMERIC NOT NULL,
  shipping_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT DEFAULT 'Pinkissed',
  logo_url TEXT DEFAULT 'Logo2.png',
  description TEXT DEFAULT 'Made To Match You',
  instagram TEXT DEFAULT 'pinkissedd_'
);

INSERT INTO settings (id, name, logo_url, description, instagram)
VALUES (1, 'Pinkissed', 'Logo2.png', 'Made To Match You', 'pinkissedd_')
ON CONFLICT (id) DO NOTHING;
