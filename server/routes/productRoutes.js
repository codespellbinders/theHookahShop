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

    const q = String(req.query.q || "").trim();
    const categorySlug = String(req.query.category || "").trim();
    const includeInactive = String(req.query.include_inactive || "").trim() === "1";

    const where = [];
    const params = [];

    if (!includeInactive) {
      where.push("p.status = 'active'");
      where.push("c.status = 'active'");
    }

    if (q) {
      where.push("(p.name LIKE ? OR p.sku LIKE ? OR c.name LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (categorySlug) {
      where.push("c.slug = ?");
      params.push(categorySlug);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pdb.query(
      `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.sale_price,
        p.sku,
        p.stock_qty,
        p.status,
        p.image_url,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.created_at,
        p.updated_at
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      ${whereSql}
      ORDER BY p.id DESC
      `,
      params
    );

    return res.json({ products: rows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products.", error: String(error) });
  }
});

router.get("/:id", async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  try {
    const pdb = getPromiseDb();
    if (!pdb) return res.status(503).json({ message: "Database unavailable." });

    const [rows] = await pdb.query(
      `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.sale_price,
        p.sku,
        p.stock_qty,
        p.status,
        p.image_url,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.created_at,
        p.updated_at
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?
      LIMIT 1
      `,
      [productId]
    );

    const product = rows[0];
    if (!product || product.status !== "active") {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.json({ product });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch product.", error: String(error) });
  }
});

module.exports = router;
