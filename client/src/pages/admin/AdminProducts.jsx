import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  clearAdminToken,
  createAdminCategory,
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminCategory,
  extractApiError,
  fetchAdminCategories,
  fetchAdminMe,
  fetchAdminProducts,
  getAdminToken,
  updateAdminProduct,
} from "../../services/api";
import "./admin.css";

const INITIAL_PRODUCT_FORM = {
  name: "",
  description: "",
  price: "",
  sale_price: "",
  sku: "",
  stock_qty: "0",
  status: "draft",
  image_url: "",
  category_id: "",
};

function AdminProducts() {
  const navigate = useNavigate();
  const token = getAdminToken();

  const [admin, setAdmin] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState(INITIAL_PRODUCT_FORM);

  const [categoryName, setCategoryName] = useState("");
  const [categoryStatus, setCategoryStatus] = useState("active");

  useEffect(() => {
    if (!token) return;

    const bootstrap = async () => {
      try {
        setLoading(true);
        const [adminMe, adminCategories, adminProducts] = await Promise.all([
          fetchAdminMe(token),
          fetchAdminCategories(token),
          fetchAdminProducts(token),
        ]);

        setAdmin(adminMe);
        setCategories(adminCategories);
        setProducts(adminProducts);

        if (adminCategories.length > 0) {
          setProductForm((prev) => ({
            ...prev,
            category_id: String(adminCategories[0].id),
          }));
        }
      } catch (err) {
        setError(extractApiError(err, "Unable to load admin dashboard."));
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (
        searchText &&
        !product.name.toLowerCase().includes(searchText.toLowerCase()) &&
        !(product.sku || "").toLowerCase().includes(searchText.toLowerCase())
      ) {
        return false;
      }

      if (statusFilter !== "all" && product.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "all" && String(product.categoryId) !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [products, searchText, statusFilter, categoryFilter]);

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      ...INITIAL_PRODUCT_FORM,
      category_id: categories.length ? String(categories[0].id) : "",
    });
  };

  const refreshProducts = async () => {
    const data = await fetchAdminProducts(token);
    setProducts(data);
  };

  const refreshCategories = async () => {
    const data = await fetchAdminCategories(token);
    setCategories(data);
    return data;
  };

  const handleProductInput = (event) => {
    const { name, value } = event.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!productForm.name.trim()) {
      setError("Product name is required.");
      return;
    }

    try {
      setSavingProduct(true);
      const payload = {
        ...productForm,
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        sku: productForm.sku.trim(),
        image_url: productForm.image_url.trim(),
        price: Number(productForm.price),
        sale_price: productForm.sale_price === "" ? null : Number(productForm.sale_price),
        stock_qty: Number(productForm.stock_qty),
        category_id: Number(productForm.category_id),
      };

      if (editingProductId) {
        await updateAdminProduct(token, editingProductId, payload);
        setSuccess("Product updated.");
      } else {
        await createAdminProduct(token, payload);
        setSuccess("Product created.");
      }

      await refreshProducts();
      resetProductForm();
    } catch (err) {
      setError(extractApiError(err, "Unable to save product."));
    } finally {
      setSavingProduct(false);
    }
  };

  const editProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: String(product.basePrice ?? product.price ?? ""),
      sale_price: product.salePrice === null ? "" : String(product.salePrice),
      sku: product.sku || "",
      stock_qty: String(product.stockQty || 0),
      status: product.status || "draft",
      image_url: product.imageUrl || "",
      category_id: String(product.categoryId || ""),
    });
  };

  const removeProduct = async (productId) => {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteAdminProduct(token, productId);
      setSuccess("Product deleted.");
      await refreshProducts();

      if (editingProductId === productId) {
        resetProductForm();
      }
    } catch (err) {
      setError(extractApiError(err, "Unable to delete product."));
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!categoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSavingCategory(true);
      await createAdminCategory(token, {
        name: categoryName.trim(),
        status: categoryStatus,
      });

      const updatedCategories = await refreshCategories();
      setCategoryName("");
      setCategoryStatus("active");
      setSuccess("Category created.");

      if (!productForm.category_id && updatedCategories.length) {
        setProductForm((prev) => ({ ...prev, category_id: String(updatedCategories[0].id) }));
      }
    } catch (err) {
      setError(extractApiError(err, "Unable to create category."));
    } finally {
      setSavingCategory(false);
    }
  };

  const removeCategory = async (category) => {
    const confirmed = window.confirm(`Delete category \"${category.name}\"?`);
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteAdminCategory(token, category.id);
      const updatedCategories = await refreshCategories();
      setSuccess("Category deleted.");

      if (String(productForm.category_id) === String(category.id)) {
        setProductForm((prev) => ({
          ...prev,
          category_id: updatedCategories.length ? String(updatedCategories[0].id) : "",
        }));
      }

      if (String(categoryFilter) === String(category.id)) {
        setCategoryFilter("all");
      }
    } catch (err) {
      setError(extractApiError(err, "Unable to delete category."));
    }
  };

  const logout = () => {
    clearAdminToken();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Product Management</h1>
          <p>
            {admin ? `${admin.name} (${admin.role})` : "Admin"} · Manage your product catalog, inventory, and orders from this secure dashboard.
          </p>
        </div>
        <button className="admin-ghost-btn" onClick={logout}>Log Out</button>
      </header>

      {loading ? <p className="admin-muted">Loading admin dashboard...</p> : null}
      {error ? <p className="admin-alert error">{error}</p> : null}
      {success ? <p className="admin-alert success">{success}</p> : null}

      {!loading && (
        <>
          <section className="admin-grid-two">
            <form className="admin-card" onSubmit={handleCategorySubmit}>
              <h2>Create Category</h2>

              <label>Category Name</label>
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Premium Hookahs"
              />

              <label>Status</label>
              <select value={categoryStatus} onChange={(e) => setCategoryStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button type="submit" className="admin-primary-btn" disabled={savingCategory}>
                {savingCategory ? "Creating..." : "Create Category"}
              </button>
            </form>

            <div className="admin-card">
              <h2>Categories</h2>
              {categories.length === 0 ? (
                <p className="admin-muted">No categories yet.</p>
              ) : (
                <ul className="admin-category-list">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <div>
                        <span>{category.name}</span>
                        <small>{category.slug}</small>
                      </div>
                      <button type="button" className="admin-ghost-btn admin-category-delete-btn" onClick={() => removeCategory(category)}>
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="admin-card admin-form-card">
            <h2>{editingProductId ? "Edit Product" : "Create Product"}</h2>
            <form className="admin-form-grid" onSubmit={handleProductSubmit}>
              <label>Name</label>
              <input name="name" value={productForm.name} onChange={handleProductInput} required />

              <label>Category</label>
              <select
                name="category_id"
                value={productForm.category_id}
                onChange={handleProductInput}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <label>Description</label>
              <textarea
                name="description"
                rows="3"
                value={productForm.description}
                onChange={handleProductInput}
                placeholder="Optional"
              />

              <div className="admin-grid-three">
                <div>
                  <label>Price</label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={handleProductInput}
                    required
                  />
                </div>
                <div>
                  <label>Sale Price</label>
                  <input
                    name="sale_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.sale_price}
                    onChange={handleProductInput}
                  />
                </div>
                <div>
                  <label>Stock Quantity</label>
                  <input
                    name="stock_qty"
                    type="number"
                    min="0"
                    value={productForm.stock_qty}
                    onChange={handleProductInput}
                    required
                  />
                </div>
              </div>

              <div className="admin-grid-three">
                <div>
                  <label>SKU</label>
                  <input name="sku" value={productForm.sku} onChange={handleProductInput} />
                </div>
                <div>
                  <label>Status</label>
                  <select name="status" value={productForm.status} onChange={handleProductInput}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label>Image URL</label>
                  <input
                    name="image_url"
                    value={productForm.image_url}
                    onChange={handleProductInput}
                    placeholder="/uploads/example.jpg"
                  />
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="submit" className="admin-primary-btn" disabled={savingProduct}>
                  {savingProduct ? "Saving..." : editingProductId ? "Update Product" : "Create Product"}
                </button>
                {editingProductId ? (
                  <button type="button" className="admin-ghost-btn" onClick={resetProductForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="admin-card">
            <div className="admin-products-head">
              <h2>Products</h2>
              <div className="admin-filters">
                <input
                  placeholder="Search name or SKU"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <p className="admin-muted">No products found.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name}</strong>
                          <small>{product.sku || "No SKU"}</small>
                        </td>
                        <td>{product.categoryName || "-"}</td>
                        <td>Rs {Number(product.price).toLocaleString()}</td>
                        <td>{product.stockQty}</td>
                        <td>{product.status}</td>
                        <td>
                          <div className="admin-row-actions">
                            <button type="button" onClick={() => editProduct(product)}>
                              Edit
                            </button>
                            <button type="button" onClick={() => removeProduct(product.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default AdminProducts;
