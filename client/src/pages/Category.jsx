import { useParams } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import products from "../data/products";
import { useSearchParams } from "react-router-dom";

function Category() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim().toLowerCase() || "";

  const filteredProducts = products.filter(
    (product) =>
      product.category === category &&
      (!search ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search))
  );

  return (
    <section className="products-section">
      <div className="products-container">
        <h1 className="products-title">
          {category.replace(/-/g, " ").toUpperCase()}
        </h1>

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
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