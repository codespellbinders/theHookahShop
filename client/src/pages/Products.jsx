import { useEffect, useState } from "react";
import ProductCard from "../components/product/ProductCard";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../services/api";

function Products() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim() || "";
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const rows = await fetchProducts(search ? { q: search } : {});
        setVisibleProducts(rows);
      } catch {
        setError("Unable to load products.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [search]);

  return (
    <section className="products-section">
      <div className="products-container">
        <h1 className="section-title">ALL PRODUCTS</h1>

        {loading && <p className="muted-message">Loading products...</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="products-grid">
          {!loading && !error && visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {!loading && !error && visibleProducts.length === 0 && (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Try a different search term or browse the categories above.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Products;