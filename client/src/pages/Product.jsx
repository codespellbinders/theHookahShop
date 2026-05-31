import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import "./productPage.css";
import { useCart } from "../context/CartContext";
import { fetchProductById, resolveImageUrl } from "../services/api";

function Product() {
  const { id } = useParams();
  const location = useLocation();
  const { addToCart, openCart } = useCart();

  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [error, setError] = useState("");

  useEffect(() => {
    if (product && Number(product.id) === Number(id)) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const row = await fetchProductById(id);
        setProduct(row);
      } catch {
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, product]);

  if (loading) {
    return <h2 style={{ color: "white", padding: "150px" }}>Loading product...</h2>;
  }

  if (!product || error) {
    return <h2 style={{ color: "white", padding: "150px" }}>Product not found</h2>;
  }

  return (
    <section className="product-page">
      <div className="product-container">

        <div className="product-image">
          <div className="image-placeholder">
            {product.imageUrl ? (
              <img src={resolveImageUrl(product.imageUrl)} alt={product.name} />
            ) : (
              product.name
            )}
          </div>
        </div>

        <div className="product-details">
          <h1>{product.name}</h1>
          <p className="product-price">
            Rs {product.price.toLocaleString()}
          </p>

          {product.salePrice !== null ? (
            <p className="product-base-price">Base Price: Rs {product.basePrice.toLocaleString()}</p>
          ) : null}

          <p className="product-category">
            {(product.categoryName || product.category || "uncategorized").replace(/-/g, " ").toUpperCase()}
          </p>

          <p className="product-description">
            {product.description || "Premium luxury hookah designed for ultimate performance and style."}
          </p>

          <div className="product-actions">

            <Link to="/products" className="secondary-action-btn">
              BACK TO PRODUCTS
            </Link>

            <button className="secondary-action-btn" onClick={() => addToCart(product)}>
              ADD TO CART
            </button>

            <Link to="/checkout" state={{ product }} className="add-to-cart-btn">
              BUY NOW
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Product;