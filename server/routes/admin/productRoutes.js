const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const db = require("../../db");
const { authenticateAdmin } = require("../../middleware/adminAuth");
const { requirePermission } = require("../../middleware/rbac");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "..", "uploads", "products");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext || ".jpg";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP, and GIF images are allowed."));
    }
    return cb(null, true);
  },
});

function uploadProductImage(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image size must be 5MB or smaller." });
    }

    return res.status(400).json({ message: error.message || "Invalid image upload." });
  });
}

let promiseDb = null;

function getPromiseDb() {
  if (!promiseDb && db && db.isConnected) {
    promiseDb = db.promise();
  }
  return promiseDb;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function buildUniqueProductSlug(pdb, baseSlug, productIdToExclude) {
  const safeBase = baseSlug || `product-${Date.now()}`;
  let counter = 0;

  while (true) {
    const candidate = counter === 0 ? safeBase : `${safeBase}-${counter}`;
    const params = [candidate];
    let sql = "SELECT id FROM products WHERE slug = ?";

    if (productIdToExclude) {
      sql += " AND id <> ?";
      params.push(productIdToExclude);
    }

    sql += " LIMIT 1";

    const [rows] = await pdb.query(sql, params);
    if (!rows[0]) return candidate;
    counter += 1;
  }
}

function normalizeProductInput(body, file) {
  const uploadedImageUrl = file ? `/uploads/products/${file.filename}` : null;
  return {
    name: String((body && body.name) || "").trim(),
    description: body && body.description ? String(body.description).trim() : null,
    price: body && body.price !== undefined ? Number(body.price) : NaN,
    salePrice:
      body && body.sale_price !== undefined && body.sale_price !== null && body.sale_price !== ""
        ? Number(body.sale_price)
        : null,
    sku: body && body.sku ? String(body.sku).trim() : null,
    stockQty: body && body.stock_qty !== undefined ? Number(body.stock_qty) : 0,
    status: String((body && body.status) || "draft").trim().toLowerCase(),
    imageUrl:
      uploadedImageUrl || (body && body.image_url ? String(body.image_url).trim() : null),
    categoryId: body && body.category_id !== undefined ? Number(body.category_id) : NaN,
  };
}

function validateProductInput(input) {
  if (!input.name) return "Product name is required.";
  if (!Number.isFinite(input.price) || input.price < 0) return "Valid product price is required.";
  if (input.salePrice !== null && (!Number.isFinite(input.salePrice) || input.salePrice < 0)) {
    return "Sale price must be a valid non-negative number.";
  }
  if (!Number.isInteger(input.stockQty) || input.stockQty < 0) return "Stock quantity must be a non-negative integer.";
  if (!Number.isInteger(input.categoryId) || input.categoryId <= 0) return "Valid category_id is required.";
  if (!["draft", "active", "inactive"].includes(input.status)) {
    return "Status must be one of: draft, active, inactive.";
  }
  return null;
}

router.get(
  "/",
  authenticateAdmin,
  requirePermission("products.read"),
  async (req, res) => {
    try {
      const pdb = getPromiseDb();
      if (!pdb) {
        return res.status(503).json({ message: "Database unavailable." });
      }

      const q = String(req.query.q || "").trim();
      const status = String(req.query.status || "").trim().toLowerCase();
      const categoryId = req.query.category_id ? Number(req.query.category_id) : null;

      const where = [];
      const params = [];

      if (q) {
        where.push("(p.name LIKE ? OR p.sku LIKE ?)");
        params.push(`%${q}%`, `%${q}%`);
      }

      if (["draft", "active", "inactive"].includes(status)) {
        where.push("p.status = ?");
        params.push(status);
      }

      if (Number.isInteger(categoryId) && categoryId > 0) {
        where.push("p.category_id = ?");
        params.push(categoryId);
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
  }
);

router.get(
  "/:id",
  authenticateAdmin,
  requirePermission("products.read"),
  async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    try {
      const pdb = getPromiseDb();
      if (!pdb) {
        return res.status(503).json({ message: "Database unavailable." });
      }

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
          p.created_at,
          p.updated_at
        FROM products p
        INNER JOIN categories c ON c.id = p.category_id
        WHERE p.id = ?
        LIMIT 1
        `,
        [productId]
      );

      if (!rows[0]) {
        return res.status(404).json({ message: "Product not found." });
      }

      return res.json({ product: rows[0] });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch product.", error: String(error) });
    }
  }
);

router.post(
  "/",
  authenticateAdmin,
  requirePermission("products.create"),
  uploadProductImage,
  async (req, res) => {
    const input = normalizeProductInput(req.body, req.file);
    const validationError = validateProductInput(input);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    try {
      const pdb = getPromiseDb();
      if (!pdb) {
        return res.status(503).json({ message: "Database unavailable." });
      }

      const [categoryRows] = await pdb.query(
        "SELECT id FROM categories WHERE id = ? LIMIT 1",
        [input.categoryId]
      );
      if (!categoryRows[0]) {
        return res.status(400).json({ message: "Category does not exist." });
      }

      const generatedSlug = await buildUniqueProductSlug(pdb, slugify(input.name));

      const [result] = await pdb.query(
        `
        INSERT INTO products
          (name, slug, description, price, sale_price, sku, stock_qty, status, image_url, category_id, created_by, updated_by)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          input.name,
          generatedSlug,
          input.description,
          input.price,
          input.salePrice,
          input.sku,
          input.stockQty,
          input.status,
          input.imageUrl,
          input.categoryId,
          req.admin.adminId,
          req.admin.adminId,
        ]
      );

      return res.status(201).json({
        message: "Product created successfully.",
        product: {
          id: result.insertId,
          name: input.name,
          slug: generatedSlug,
        },
      });
    } catch (error) {
      if (error && error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "SKU already exists." });
      }
      return res.status(500).json({ message: "Failed to create product.", error: String(error) });
    }
  }
);

router.put(
  "/:id",
  authenticateAdmin,
  requirePermission("products.update"),
  uploadProductImage,
  async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    const input = normalizeProductInput(req.body, req.file);
    const validationError = validateProductInput(input);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    try {
      const pdb = getPromiseDb();
      if (!pdb) {
        return res.status(503).json({ message: "Database unavailable." });
      }

      const [existingRows] = await pdb.query(
        "SELECT id FROM products WHERE id = ? LIMIT 1",
        [productId]
      );
      if (!existingRows[0]) {
        return res.status(404).json({ message: "Product not found." });
      }

      const [categoryRows] = await pdb.query(
        "SELECT id FROM categories WHERE id = ? LIMIT 1",
        [input.categoryId]
      );
      if (!categoryRows[0]) {
        return res.status(400).json({ message: "Category does not exist." });
      }

      const generatedSlug = await buildUniqueProductSlug(pdb, slugify(input.name), productId);

      await pdb.query(
        `
        UPDATE products
        SET
          name = ?,
          slug = ?,
          description = ?,
          price = ?,
          sale_price = ?,
          sku = ?,
          stock_qty = ?,
          status = ?,
          image_url = ?,
          category_id = ?,
          updated_by = ?
        WHERE id = ?
        `,
        [
          input.name,
          generatedSlug,
          input.description,
          input.price,
          input.salePrice,
          input.sku,
          input.stockQty,
          input.status,
          input.imageUrl,
          input.categoryId,
          req.admin.adminId,
          productId,
        ]
      );

      return res.json({
        message: "Product updated successfully.",
        product: {
          id: productId,
          name: input.name,
          slug: generatedSlug,
        },
      });
    } catch (error) {
      if (error && error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "SKU already exists." });
      }
      return res.status(500).json({ message: "Failed to update product.", error: String(error) });
    }
  }
);

router.delete(
  "/:id",
  authenticateAdmin,
  requirePermission("products.delete"),
  async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    try {
      const pdb = getPromiseDb();
      if (!pdb) {
        return res.status(503).json({ message: "Database unavailable." });
      }

      const [result] = await pdb.query("DELETE FROM products WHERE id = ?", [productId]);

      if (!result.affectedRows) {
        return res.status(404).json({ message: "Product not found." });
      }

      return res.json({ message: "Product deleted successfully." });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete product.", error: String(error) });
    }
  }
);

module.exports = router;
