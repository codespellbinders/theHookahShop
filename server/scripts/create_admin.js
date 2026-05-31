const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../db');
const bcrypt = require('bcryptjs');

async function run() {
  const name = process.argv[2];
  const email = (process.argv[3] || '').trim().toLowerCase();
  const password = process.argv[4];

  if (!name || !email || !password) {
    console.error('Usage: node create_admin.js "Name" "email@example.com" "Password123"');
    process.exit(1);
  }

  const promiseDb = db.promise();
  try {
    const [roleRows] = await promiseDb.query("SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1");
    if (!roleRows[0]) {
      console.error('super_admin role not found. Run migrations first.');
      process.exit(1);
    }
    const roleId = roleRows[0].id;

    const [existing] = await promiseDb.query('SELECT id FROM admin_users WHERE email = ? LIMIT 1', [email]);
    if (existing[0]) {
      console.error('Admin with that email already exists.');
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await promiseDb.query(
      'INSERT INTO admin_users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [name, email, hash, roleId]
    );

    console.log('Created admin with id', result.insertId);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
