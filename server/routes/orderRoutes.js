const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

let promiseDb = null;

function getPromiseDb() {
  if (!promiseDb && db && db.isConnected) {
    promiseDb = db.promise();
  }
  return promiseDb;
}

async function ensureOrdersTable() {
  if (!db || !db.isConnected) {
    console.log('Skipping orders table check because DB is not connected');
    return;
  }
  const pdb = getPromiseDb();
  if (!pdb) {
    console.log('Cannot create orders table: DB promise not available');
    return;
  }
  await pdb.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191),
      phone VARCHAR(50),
      email VARCHAR(191),
      address TEXT,
      city VARCHAR(100),
      total_amount DECIMAL(12,2),
      payment_method VARCHAR(50),
      payment_proof VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

let tablesInitialized = false;

async function ensureOrdersTableOnce() {
  if (tablesInitialized) return;
  tablesInitialized = true;
  
  try {
    await ensureOrdersTable();
    console.log("Orders table initialized ✅");
  } catch (error) {
    console.error("Orders table initialization failed:", error);
    tablesInitialized = false; // allow retry
  }
}

ensureOrdersTableOnce().catch((err) => console.error('Orders table init failed on startup', err));

router.post("/", upload.single("payment_proof"), async (req, res) => {
  await ensureOrdersTableOnce(); // Ensure table before handling request
  const { name, phone, email, address, city, total_amount, payment_method } = req.body;
  const payment_proof = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO orders 
    (name, phone, email, address, city, total_amount, payment_method, payment_proof, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
  `;

  db.query(
    sql,
    [name, phone, email, address, city, total_amount, payment_method, payment_proof],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Order placed ✅" });
    }
  );
});

module.exports = router;