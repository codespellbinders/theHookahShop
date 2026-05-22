const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const db = require("../db");

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
      verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pdb.query(`
    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      code VARCHAR(6) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

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

function sendMailWithTimeout(transporter, mailMessage, ms = 7000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        const err = new Error("sendMail timeout");
        err.code = "SENDMAIL_TIMEOUT";
        reject(err);
      }
    }, ms);

    transporter
      .sendMail(mailMessage)
      .then((info) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(info);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
  });
}

router.post("/send-code", async (req, res) => {
  await ensureTablesOnce(); // Ensure tables before handling request
  const email = String((req.body && req.body.email) || "").trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

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

    const mailMessage = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@thehookahshop.local",
      to: email,
      subject: "Your The Hookah Shop verification code",
      text: `Your 6-digit verification code is ${code}. It expires in 10 minutes.`,
    };

    console.log("[auth/send-code] after db write, sending email (transporter):", !!transporter);
    if (transporter) {
      try {
        await sendMailWithTimeout(transporter, mailMessage, 7000);
      } catch (mailErr) {
        console.warn("transporter.sendMail failed or timed out:", mailErr && mailErr.message ? mailErr.message : mailErr);
        // fallback to logging the code in development
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