import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import "./productPage.css";
import { useCart } from "../context/CartContext";
import { fetchProductById, resolveImageUrl, optimizeCloudinaryUrl } from "../services/api";

function getYouTubeEmbedUrl(value) {
  let raw = String(value || "").trim();
  if (!raw) return "";

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return `https://www.youtube.com/embed/${raw}`;
  }

  if (!/^https?:\/\//i.test(raw)) {
    raw = "https://" + raw;
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = url.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) {
        return `https://www.youtube.com/embed/${parts[1]}`;
      }
      if (parts[0] === "shorts" && parts[1]) {
        return `https://www.youtube.com/embed/${parts[1]}`;
      }
      if (parts[0] === "v" && parts[1]) {
        return `https://www.youtube.com/embed/${parts[1]}`;
      }
    }
  } catch {
    return "";
  }

  return "";
}

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

  const youtubeEmbedUrl = getYouTubeEmbedUrl(product.youtubeVideoUrl);

  return (
    <section className="product-page">
      <div className="product-container">

        <div className="product-image">
          {product.imageUrl ? (
            <div className="image-frame">
              <img src={optimizeCloudinaryUrl(resolveImageUrl(product.imageUrl), 900)} alt={product.name} loading="lazy" />
            </div>
          ) : (
            <div className="image-placeholder">{product.name}</div>
          )}
        </div>

        <div className="product-details">
          <h1>{product.name}</h1>
          <p className="product-price">
            {product.salePrice !== null && product.salePrice < product.basePrice ? (
              <>
                <span className="product-base-price">Rs {product.basePrice.toLocaleString()}</span>
                <span className="product-sale-price"> Rs {product.price.toLocaleString()}</span>
              </>
            ) : (
              <>Rs {product.price.toLocaleString()}</>
            )}
          </p>

          <p className="product-category">
            {(product.categoryName || product.category || "uncategorized").replace(/-/g, " ").toUpperCase()}
          </p>

          <p className="product-description">
            {product.description || "Premium luxury hookah designed for ultimate performance and style."}
          </p>

          {youtubeEmbedUrl ? (
            <div className="product-video-section">
              <h3>Watch Product Video</h3>
              <div className="product-video-frame">
                <iframe
                  src={youtubeEmbedUrl}
                  title={`${product.name} product video`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}

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