#!/usr/bin/env node
/**
 * Simple migration script: read data/store.json and upsert into Postgres JSONB table `store_data`.
 * Usage: set DATABASE_URL env var, then run `node scripts/migrate-to-postgres.js`.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('Missing DATABASE_URL environment variable');
    process.exit(1);
  }

  const dataPath = path.join(process.cwd(), 'data', 'store.json');
  if (!fs.existsSync(dataPath)) {
    console.error('No data/store.json found to migrate.');
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, 'utf8');
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) { console.error('Failed to parse store.json', e); process.exit(1); }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Create table if missing
  await client.query(`
    CREATE TABLE IF NOT EXISTS store_data (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL
    );
  `);

  // Upsert global
  const upsert = `INSERT INTO store_data (id, data) VALUES ($1, $2)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;`;

  await client.query(upsert, ['global', parsed]);

  console.log('Migration complete: store.json written to store_data (id=global)');
  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
