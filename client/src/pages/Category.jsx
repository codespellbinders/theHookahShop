import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import { useSearchParams } from "react-router-dom";
import { fetchCategories, fetchProducts } from "../services/api";

function Category() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim() || "";

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [categoryRows, productRows] = await Promise.all([
          fetchCategories(),
          fetchProducts({ category, ...(search ? { q: search } : {}) }),
        ]);

        setCategories(categoryRows);
        setFilteredProducts(productRows);
      } catch {
        setError("Unable to load category products.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [category, search]);

  const categoryTitle = useMemo(() => {
    const match = categories.find((item) => item.slug === category);
    return match?.name || category.replace(/-/g, " ").toUpperCase();
  }, [categories, category]);

  return (
    <section className="products-section">
      <div className="products-container">
        <h1 className="products-title">{categoryTitle}</h1>

        {loading && <p className="muted-message">Loading category...</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="products-grid">
          {!loading && !error && filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="empty-state">
            <h3>No products found in this category</h3>
            <p>Use a different search term or choose another category.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Category;