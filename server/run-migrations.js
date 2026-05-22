const fs = require('fs');
const path = require('path');
const db = require('./db');

// Wait a bit for the connection to establish
function waitForConnection(maxTries = 10) {
  return new Promise((resolve) => {
    let tries = 0;
    const check = () => {
      if (db && db.isConnected) {
        resolve();
      } else if (tries < maxTries) {
        tries++;
        setTimeout(check, 200);
      } else {
        resolve(); // proceed anyway, let queries fail if DB not ready
      }
    };
    check();
  });
}

async function run() {
  await waitForConnection();

  const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'init.sql'), 'utf8');
  const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);

  const promiseDb = db.promise();
  try {
    for (const stmt of statements) {
      await promiseDb.query(stmt);
      console.log('Ran:', stmt.split('\n')[0]);
    }
    console.log('Migrations completed');
  } catch (err) {
    console.error('Migration error', err);
  } finally {
    process.exit(0);
  }
}

run();
