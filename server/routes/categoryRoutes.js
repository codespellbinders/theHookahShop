const express = require("express");
const db = require("../db");

const router = express.Router();

let promiseDb = null;

function getPromiseDb() {
  if (!promiseDb && db && db.isConnected) {
    promiseDb = db.promise();
  }
  return promiseDb;
}

router.get("/", async (req, res) => {
  try {
    const pdb = getPromiseDb();
    if (!pdb) return res.status(503).json({ message: "Database unavailable." });

    const includeInactive = String(req.query.include_inactive || "").trim() === "1";

    const whereSql = includeInactive ? "" : "WHERE status = 'active'";

    const [rows] = await pdb.query(
      `
      SELECT id, name, slug, status, created_at, updated_at
      FROM categories
      ${whereSql}
      ORDER BY name ASC
      `
    );

    return res.json({ categories: rows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch categories.", error: String(error) });
  }
});

module.exports = router;
