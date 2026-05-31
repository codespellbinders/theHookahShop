const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../db');
const bcrypt = require('bcryptjs');

async function run() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  const password = process.argv[3];
  const name = process.argv[4] ? String(process.argv[4]).trim() : '';

  if (!email || !password) {
    console.error('Usage: node reset_super_admin.js "email@example.com" "NewPassword123" ["Optional Name"]');
    process.exit(1);
  }

  const promiseDb = db.promise();

  try {
    const [rows] = await promiseDb.query(
      `
      SELECT au.id, au.name, au.email, r.name AS role
      FROM admin_users au
      INNER JOIN roles r ON r.id = au.role_id
      WHERE au.email = ? AND r.name = 'super_admin'
      LIMIT 1
      `,
      [email]
    );

    const admin = rows[0];
    if (!admin) {
      console.error('Super admin not found for that email.');
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 12);
    const nextName = name || admin.name;

    await promiseDb.query(
      'UPDATE admin_users SET name = ?, password_hash = ? WHERE id = ?',
      [nextName, hash, admin.id]
    );

    console.log(`Reset super admin ${email} (id ${admin.id}) successfully.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset super admin:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();