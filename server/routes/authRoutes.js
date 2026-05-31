const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { getTransporter, sendVerificationEmail } = require("../lib/mailer");

const router = express.Router();
let promiseDb = null;

function getPromiseDb() {
  if (!promiseDb && db && db.isConnected) {
    promiseDb = db.promise();
  }
  return promiseDb;
}

function hashCode(code) {
  const secret = process.env.CODE_HASH_SECRET || "dev-code-secret";
  return crypto.createHmac("sha256", secret).update(String(code)).digest("hex");
}

async function ensureTables() {
  const pdb = getPromiseDb();
  if (!pdb) {
    console.log('Skipping auth table initialization because DB is not connected');
    return;
  }

  await pdb.query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      verified_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pdb.query(`
    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      code_hash VARCHAR(191) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [verificationColumns] = await pdb.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'email_verification_codes'
    `
  );
  const verificationColumnNames = new Set(verificationColumns.map((row) => row.COLUMN_NAME));

  if (!verificationColumnNames.has('code_hash')) {
    await pdb.query(
      `ALTER TABLE email_verification_codes ADD COLUMN code_hash VARCHAR(191) NULL AFTER email`
    );

    if (verificationColumnNames.has('code')) {
      const [legacyRows] = await pdb.query(
        `SELECT email, code FROM email_verification_codes WHERE code_hash IS NULL AND code IS NOT NULL`
      );

      for (const row of legacyRows) {
        await pdb.query(
          `UPDATE email_verification_codes SET code_hash = ? WHERE email = ?`,
          [hashCode(row.code), row.email]
        );
      }
    }
  }

  if (verificationColumnNames.has('code')) {
    await pdb.query(
      `ALTER TABLE email_verification_codes MODIFY code VARCHAR(6) NULL DEFAULT NULL`
    ).catch(() => {});
  }

  const [userColumns] = await pdb.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'auth_users'
    `
  );
  const userColumnNames = new Set(userColumns.map((row) => row.COLUMN_NAME));

  if (userColumnNames.has('verified_at')) {
    await pdb.query(
      `ALTER TABLE auth_users MODIFY verified_at TIMESTAMP NULL DEFAULT NULL`
    ).catch(() => {});
  }
}

function generateCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

let tablesInitialized = false;

async function ensureTablesOnce() {
  if (tablesInitialized) return;
  tablesInitialized = true;
  
  try {
    await ensureTables();
    console.log("Auth tables initialized ✅");
  } catch (error) {
    console.error("Auth table initialization failed:", error);
    tablesInitialized = false; // allow retry
  }
}

router.post("/send-code", async (req, res) => {
  await ensureTablesOnce(); // Ensure tables before handling request
  const email = String((req.body && req.body.email) || "").trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const transporter = await getTransporter();
  console.log("[auth/send-code] request for:", email, "dbConnected:", !!(db && db.isConnected), "transporter:", !!transporter);

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      const pdb = getPromiseDb();
      if (pdb) {
        try {
          await pdb.query(
            `
            INSERT INTO email_verification_codes (email, code_hash, expires_at)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
              code_hash = VALUES(code_hash),
              expires_at = VALUES(expires_at),
              created_at = CURRENT_TIMESTAMP
          `,
            [email, hashCode(code), expiresAt]
          );
        } catch (dbErr) {
          console.error("DB insert failed for verification code:", dbErr && dbErr.message ? dbErr.message : dbErr);
          return res.status(500).json({ message: "Failed to store verification code." });
        }
      } else {
        return res.status(503).json({ message: "Database unavailable; cannot generate verification codes." });
      }

    console.log("[auth/send-code] after db write, sending email (transporter):", !!transporter);
    if (transporter) {
      try {
        const result = await sendVerificationEmail({ to: email, code });
        if (result.previewUrl) {
          console.log(`[MAIL PREVIEW] ${result.previewUrl}`);
        }
      } catch (mailErr) {
        console.warn("transporter.sendMail failed or timed out:", mailErr && mailErr.message ? mailErr.message : mailErr);
        console.log(`[DEV EMAIL-FALLBACK] Verification code for ${email}: ${code}`);
      }
    } else {
      console.log(`[DEV EMAIL] Verification code for ${email}: ${code}`);
    }

    console.log("[auth/send-code] responding to client for:", email);

    return res.json({
      message: transporter
        ? "Verification code sent to your email."
        : "Verification code generated. Check server logs in development.",
    });
  } catch (error) {
    console.error("send-code error:", error && error.message ? error.message : error);
    return res.status(500).json({ message: "Failed to send verification code.", error: String(error) });
  }
});

router.post("/verify-code", async (req, res) => {
  const email = String((req.body && req.body.email) || "").trim().toLowerCase();
  const code = String((req.body && req.body.code) || "").trim();

  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required." });
  }

  try {
    const pdb = getPromiseDb();
    if (!pdb) {
      return res.status(503).json({ message: "Database unavailable; cannot verify code." });
    }

    const [rows] = await pdb.query(
      "SELECT code_hash, expires_at FROM email_verification_codes WHERE email = ? LIMIT 1",
      [email]
    );
    const record = rows[0];

    if (!record) return res.status(400).json({ message: "Verification code not found." });

    const providedHash = hashCode(code);
    if (record.code_hash !== providedHash) return res.status(400).json({ message: "Invalid verification code." });

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: "Verification code has expired." });
    }

    try {
      await pdb.query(
        `
            INSERT INTO auth_users (email)
            VALUES (?)
            ON DUPLICATE KEY UPDATE verified_at = CURRENT_TIMESTAMP
          `,
        [email]
      );

      await pdb.query("DELETE FROM email_verification_codes WHERE email = ?", [email]);
    } catch (dbErr) {
      console.error("DB update/delete failed after verification:", dbErr && dbErr.message ? dbErr.message : dbErr);
      return res.status(500).json({ message: "Failed to finalize verification." });
    }

    return res.json({
      message: "Email verified successfully.",
      user: {
        email,
        verified: true,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to verify code.", error: String(error) });
  }
});

module.exports = router;