import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import Hero from "../components/layout/Hero";
import { fetchCategories, fetchProducts } from "../services/api";

function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [categoryRows, productRows] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
        ]);

        setCategories(categoryRows);
        setProducts(productRows);
      } catch {
        setError("Unable to load products right now.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const productsByCategory = useMemo(() => {
    const map = new Map();
    for (const product of products) {
      if (!product.category) continue;
      if (!map.has(product.category)) map.set(product.category, []);
      map.get(product.category).push(product);
    }
    return map;
  }, [products]);

  const renderSection = (category) => {
    const filtered = productsByCategory.get(category.slug) || [];
    if (!filtered.length) return null;

    return (
      <section className="products-section" key={category.id}>
        <div className="products-container">
          <h2 className="products-title">{category.name.toUpperCase()}</h2>

          <div className="products-grid">
            {filtered.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Link to={`/category/${category.slug}`}>
              <button className="view-btn">VIEW ALL</button>
            </Link>
          </div>
        </div>
      </section>
    );
  };

  return (
    <>
      <Hero />

      {loading ? (
        <section className="products-section">
          <div className="products-container">
            <h2 className="products-title">Loading products...</h2>
          </div>
        </section>
      ) : null}

      {error ? (
        <section className="products-section">
          <div className="products-container">
            <div className="empty-state">
              <h3>Catalog unavailable</h3>
              <p>{error}</p>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && !error && categories.map(renderSection)}
    </>
  );
}

export default Home;
