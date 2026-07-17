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
  resolveImageUrl,
  optimizeCloudinaryUrl,
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
  youtube_video_url: "",
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
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryStatus, setCategoryStatus] = useState("active");
  const [categoryParentId, setCategoryParentId] = useState("");

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
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setEditingProductId(null);
    setSelectedImageFile(null);
    setImagePreviewUrl("");
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

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImageFile(file);

    if (file) {
      setImagePreviewUrl(URL.createObjectURL(file));
      return;
    }

    setImagePreviewUrl(productForm.image_url ? resolveImageUrl(productForm.image_url) : "");
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
      const payload = new FormData();
      payload.append("name", productForm.name.trim());
      payload.append("description", productForm.description.trim());
      payload.append("sku", productForm.sku.trim());
      payload.append("status", productForm.status);
      payload.append("price", String(Number(productForm.price)));
      payload.append(
        "sale_price",
        productForm.sale_price === "" ? "" : String(Number(productForm.sale_price))
      );
      payload.append("stock_qty", String(Number(productForm.stock_qty)));
      payload.append("category_id", String(Number(productForm.category_id)));
      if (productForm.youtube_video_url.trim()) {
        payload.append("youtube_video_url", productForm.youtube_video_url.trim());
      }

      if (selectedImageFile) {
        payload.append("image", selectedImageFile);
      } else if (productForm.image_url.trim()) {
        payload.append("image_url", productForm.image_url.trim());
      }

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
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setEditingProductId(product.id);
    setSelectedImageFile(null);
    setImagePreviewUrl(product.imageUrl ? resolveImageUrl(product.imageUrl) : "");
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: String(product.basePrice ?? product.price ?? ""),
      sale_price: product.salePrice === null ? "" : String(product.salePrice),
      sku: product.sku || "",
      stock_qty: String(product.stockQty || 0),
      status: product.status || "draft",
      image_url: product.imageUrl || "",
      youtube_video_url: product.youtubeVideoUrl || "",
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
        parent_category_id: categoryParentId ? Number(categoryParentId) : null,
      });

      const updatedCategories = await refreshCategories();
      setCategoryName("");
      setCategoryStatus("active");
      setCategoryParentId("");
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

              <label>Parent Category</label>
              <select value={categoryParentId} onChange={(e) => setCategoryParentId(e.target.value)}>
                <option value="">No parent category</option>
                {categories
                  .filter((category) => category.parentCategoryId === null)
                  .map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
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
                        {category.parentCategoryName ? <small>Parent: {category.parentCategoryName}</small> : null}
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
                  <label>Image</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageFileChange}
                  />
                </div>
              </div>

              <label>YouTube Video URL</label>
              <input
                name="youtube_video_url"
                value={productForm.youtube_video_url}
                onChange={handleProductInput}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <small className="admin-muted">
                Paste a YouTube watch link or youtu.be link. It will show on the product page.
              </small>

              {imagePreviewUrl ? (
                <div>
                  <label>Image Preview</label>
                  <img
                    src={optimizeCloudinaryUrl(imagePreviewUrl, 400)}
                    alt="Product preview"
                    loading="lazy"
                    style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px" }}
                  />
                </div>
              ) : null}

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
