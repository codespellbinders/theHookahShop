import ProductCard from "../components/product/ProductCard";
import products from "../data/products";
import { useSearchParams } from "react-router-dom";

function Products() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim().toLowerCase() || "";

  const visibleProducts = products.filter((product) => {
    if (!search) {
      return true;
    }

    return (
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search)
    );
  });

  return (
    <section className="products-section">
      <div className="products-container">
        <h1 className="products-title">ALL PRODUCTS</h1>

        <div className="products-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {visibleProducts.length === 0 && (
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