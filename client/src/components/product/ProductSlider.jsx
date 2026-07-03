import { useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import "./ProductSlider.css";

function ProductSlider({ products }) {
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = products.length;

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children);
    if (!children.length) return;

    const containerCenter = container.getBoundingClientRect().left + container.clientWidth / 2;
    let closestIndex = 0;
    let minDiff = Infinity;

    children.forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      const diff = Math.abs(containerCenter - childCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });

    setCurrentIndex(closestIndex);
  };

  const scrollToIndex = (index) => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children);
    const targetChild = children[index];
    if (targetChild) {
      targetChild.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setCurrentIndex(index);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  // Sync scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount to align
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [products]);

  if (!products || !products.length) return null;

  return (
    <div className="product-slider-wrapper">
      <div
        className="product-slider-container"
        ref={containerRef}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {total > 1 && (
        <div className="product-slider-controls">
          <button
            type="button"
            className="product-slider-btn"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous product"
          >
            &lt;
          </button>
          <span className="product-slider-fraction">
            {currentIndex + 1}/{total}
          </span>
          <button
            type="button"
            className="product-slider-btn"
            onClick={handleNext}
            disabled={currentIndex === total - 1}
            aria-label="Next product"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductSlider;
