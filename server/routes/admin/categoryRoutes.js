const express = require("express");
const db = require("../../db");
const { authenticateAdmin } = require("../../middleware/adminAuth");
const { requirePermission } = require("../../middleware/rbac");

const router = express.Router();

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

async function buildUniqueCategorySlug(pdb, baseSlug) {
  const safeBase = baseSlug || `category-${Date.now()}`;
  let counter = 0;

  while (true) {
    const candidate = counter === 0 ? safeBase : `${safeBase}-${counter}`;
    const [rows] = await pdb.query(
      "SELECT id FROM categories WHERE slug = ? LIMIT 1",
      [candidate]
    );
    if (!rows[0]) return candidate;
    counter += 1;
  }
}

async function countChildCategories(pdb, categoryId) {
  const [rows] = await pdb.query(
    "SELECT COUNT(*) AS child_count FROM categories WHERE parent_category_id = ?",
    [categoryId]
  );

  return Number(rows?.[0]?.child_count || 0);
}

router.get(
  "/",
  authenticateAdmin,
  requirePermission("categories.read"),
  async (req, res) => {
    try {
      const pdb = getPromiseDb();
      if (!pdb) {
        return res.status(503).json({ message: "Database unavailable." });
      }

      const [rows] = await pdb.query(
        `
        SELECT
          c.id,
          c.name,
          c.slug,
          c.parent_category_id,
          parent.slug AS parent_category_slug,
          parent.name AS parent_category_name,
          c.status,
          c.created_at,
          c.updated_at
        FROM categories c
        LEFT JOIN categories parent ON parent.id = c.parent_category_id
        ORDER BY COALESCE(c.parent_category_id, c.id), c.name ASC
        `
      );

      return res.json({ categories: rows });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch categories.", error: String(error) });
    }
  }
);

router.post(
  "/",
  authenticateAdmin,
  requirePermission("products.create"),
  async (req, res) => {
    const name = String((req.body && req.body.name) || "").trim();
    const status = String((req.body && req.body.status) || "active").trim().toLowerCase();
    const rawParentCategoryId = req.body && req.body.parent_category_id;
    const parentCategoryId =
      rawParentCategoryId === "" || rawParentCategoryId === null || rawParentCategoryId === undefined
        ? null
        : Number.parseInt(rawParentCategoryId, 10);

    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be active or inactive." });
    }

    if (parentCategoryId !== null && (!Number.isInteger(parentCategoryId) || parentCategoryId <= 0)) {
      return res.status(400).json({ message: "Invalid parent category id." });
    }

    try {
      const pdb = getPromiseDb();
      if (!pdb) {
        return res.status(503).json({ message: "Database unavailable." });
      }

      if (parentCategoryId !== null) {
        const [parentRows] = await pdb.query(
          "SELECT id, name FROM categories WHERE id = ? LIMIT 1",
          [parentCategoryId]
        );

        if (!parentRows[0]) {
          return res.status(404).json({ message: "Parent category not found." });
        }
      }

      const slug = await buildUniqueCategorySlug(pdb, slugify(name));
      const [result] = await pdb.query(
        "INSERT INTO categories (name, slug, parent_category_id, status) VALUES (?, ?, ?, ?)",
        [name, slug, parentCategoryId, status]
      );

      return res.status(201).json({
        message: "Category created successfully.",
        category: {
          id: result.insertId,
          name,
          slug,
          parent_category_id: parentCategoryId,
          status,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to create category.", error: String(error) });
    }
  }
);

router.delete(
  "/:id",
  authenticateAdmin,
  requirePermission("categories.delete"),
  async (req, res) => {
    const categoryId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "Invalid category id." });
    }

    try {
      const pdb = getPromiseDb();
      if (!pdb) {
        return res.status(503).json({ message: "Database unavailable." });
      }

      const [categoryRows] = await pdb.query(
        "SELECT id, name FROM categories WHERE id = ? LIMIT 1",
        [categoryId]
      );

      const category = categoryRows[0];
      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }

      const [productRows] = await pdb.query(
        "SELECT COUNT(*) AS product_count FROM products WHERE category_id = ?",
        [categoryId]
      );

      const productCount = Number(productRows?.[0]?.product_count || 0);
      if (productCount > 0) {
        return res.status(409).json({
          message: `Cannot delete category because it is used by ${productCount} product${productCount === 1 ? "" : "s"}.`,
        });
      }

      const childCount = await countChildCategories(pdb, categoryId);
      if (childCount > 0) {
        return res.status(409).json({
          message: `Cannot delete category because it has ${childCount} subcategor${childCount === 1 ? "y" : "ies"}.`,
        });
      }

      await pdb.query("DELETE FROM categories WHERE id = ?", [categoryId]);

      return res.json({
        message: "Category deleted successfully.",
        category: { id: category.id, name: category.name },
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete category.", error: String(error) });
    }
  }
);

module.exports = router;
