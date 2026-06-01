const fs = require('fs');
const path = require('path');
const db = require('./db');

function isIgnorableMigrationError(err) {
  return (
    err &&
    (
      err.code === 'ER_TABLE_EXISTS_ERROR' ||
      err.code === 'ER_DUP_KEYNAME' ||
      err.code === 'ER_DUP_ENTRY'
    )
  );
}

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

  const promiseDb = db.promise();
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    for (const fileName of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, fileName), 'utf8');
      const statements = sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);

      console.log(`Running migration file: ${fileName}`);
      for (const stmt of statements) {
        try {
          await promiseDb.query(stmt);
          console.log('Ran:', stmt.split('\n')[0]);
        } catch (err) {
          if (isIgnorableMigrationError(err)) {
            console.log('Skipped:', stmt.split('\n')[0], `(${err.code})`);
            continue;
          }
          throw err;
        }
      }
    }

    console.log('Migrations completed');
  } catch (err) {
    console.error('Migration error', err);
  } finally {
    process.exit(0);
  }
}

run();
