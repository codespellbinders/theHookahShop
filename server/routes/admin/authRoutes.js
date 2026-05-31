const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../../db");
const { authenticateAdmin } = require("../../middleware/adminAuth");
const { signAdminToken } = require("../../lib/adminToken");

const router = express.Router();

let promiseDb = null;

function getPromiseDb() {
  if (!promiseDb && db && db.isConnected) {
    promiseDb = db.promise();
  }
  return promiseDb;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 8;
}

router.post("/bootstrap-super-admin", async (req, res) => {
  const setupKey = process.env.ADMIN_SETUP_KEY;
  const providedSetupKey = req.headers["x-setup-key"];

  if (setupKey && providedSetupKey !== setupKey) {
    return res.status(403).json({ message: "Invalid setup key." });
  }

  const name = String((req.body && req.body.name) || "").trim();
  const email = normalizeEmail(req.body && req.body.email);
  const password = req.body && req.body.password;

  if (!name || !email || !validatePassword(password)) {
    return res.status(400).json({
      message: "Name, email, and password (min 8 chars) are required.",
    });
  }

  try {
    const pdb = getPromiseDb();
    if (!pdb) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const [roleRows] = await pdb.query(
      "SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1"
    );
    if (!roleRows[0]) {
      return res.status(500).json({
        message: "Roles not initialized. Run migrations first.",
      });
    }

    const superAdminRoleId = roleRows[0].id;

    const [existingSuperAdminRows] = await pdb.query(
      `
      SELECT au.id
      FROM admin_users au
      INNER JOIN roles r ON r.id = au.role_id
      WHERE r.name = 'super_admin'
      LIMIT 1
      `
    );

    if (existingSuperAdminRows[0]) {
      return res.status(409).json({ message: "Super admin already exists." });
    }

    const [existingEmailRows] = await pdb.query(
      "SELECT id FROM admin_users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingEmailRows[0]) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [insertResult] = await pdb.query(
      `
      INSERT INTO admin_users (name, email, password_hash, role_id)
      VALUES (?, ?, ?, ?)
      `,
      [name, email, passwordHash, superAdminRoleId]
    );

    return res.status(201).json({
      message: "Super admin created successfully.",
      admin: {
        id: insertResult.insertId,
        name,
        email,
        role: "super_admin",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create super admin.", error: String(error) });
  }
});

router.post("/login", async (req, res) => {
  const email = normalizeEmail(req.body && req.body.email);
  const password = (req.body && req.body.password) || "";

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const pdb = getPromiseDb();
    if (!pdb) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const [rows] = await pdb.query(
      `
      SELECT au.id, au.name, au.email, au.password_hash, au.is_active, r.name AS role
      FROM admin_users au
      INNER JOIN roles r ON r.id = au.role_id
      WHERE au.email = ?
      LIMIT 1
      `,
      [email]
    );

    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!admin.is_active) {
      return res.status(403).json({ message: "Admin account is inactive." });
    }

    const passwordMatched = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatched) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = signAdminToken(admin);

    return res.json({
      message: "Login successful.",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login.", error: String(error) });
  }
});

router.get("/me", authenticateAdmin, async (req, res) => {
  const pdb = getPromiseDb();
  if (!pdb) {
    return res.status(503).json({ message: "Database unavailable." });
  }

  try {
    const [rows] = await pdb.query(
      `
      SELECT au.id, au.name, au.email, au.is_active, r.name AS role
      FROM admin_users au
      INNER JOIN roles r ON r.id = au.role_id
      WHERE au.id = ?
      LIMIT 1
      `,
      [req.admin.adminId]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Admin not found." });
    }

    return res.json({ admin: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch admin profile.", error: String(error) });
  }
});

module.exports = router;
