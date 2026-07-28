import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import { fetchCategories, fetchProducts } from "../services/api";

function formatTitle(category) {
  return String(category?.name || category?.slug || "").toUpperCase();
}

function Category() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim() || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [categoryRows, productRows] = await Promise.all([fetchCategories(), fetchProducts()]);

        setCategories(categoryRows);
        setProducts(productRows);
      } catch {
        setError("Unable to load category products.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const currentCategory = useMemo(
    () => categories.find((item) => item.slug === category) || null,
    [categories, category]
  );

  const childCategories = useMemo(() => {
    if (!currentCategory) return [];
    return categories
      .filter((item) => String(item.parentCategoryId || "") === String(currentCategory.id))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [categories, currentCategory]);

  const sectionOverview = childCategories.length > 0;

  const categoryTitle = useMemo(() => {
    return currentCategory?.name || category.replace(/-/g, " ").toUpperCase();
  }, [currentCategory, category]);

  const groupedSections = useMemo(() => {
    if (!sectionOverview) return [];

    return childCategories
      .map((childCategory) => {
        const items = products.filter((product) => product.category === childCategory.slug);
        const matchedProducts = search
          ? items.filter((product) => {
              const term = search.toLowerCase();
              return (
                product.name.toLowerCase().includes(term) ||
                product.categoryName.toLowerCase().includes(term) ||
                product.category.toLowerCase().includes(term)
              );
            })
          : items;

        return {
          key: childCategory.slug,
          title: formatTitle(childCategory),
          products: matchedProducts,
        };
      })
      .filter((section) => section.products.length > 0);
  }, [childCategories, products, search, sectionOverview]);

  const categoryProducts = useMemo(() => {
    if (sectionOverview) return [];

    return products.filter((product) => {
      const matchesCategory = product.category === category;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.categoryName.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, products, search, sectionOverview]);

  return (
    <section className="products-section">
      <div className="products-container">
        <h1 className="section-title">{categoryTitle}</h1>

        {loading && <p className="muted-message">Loading category...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && sectionOverview ? (
          <>
            {groupedSections.length ? (
              groupedSections.map((section) => (
                <div className="category-section" key={section.key}>
                  <h2 className="section-title">{section.title}</h2>
                  <div className="products-grid">
                    {section.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  <div style={{ textAlign: "center", marginTop: "26px" }}>
                    <Link to={`/category/${section.key}`}>
                      <button className="view-btn">VIEW ALL</button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <h3>No products found in this section</h3>
                <p>Create admin subcategories and assign products to them.</p>
              </div>
            )}
          </>
        ) : null}

        {!loading && !error && !sectionOverview ? (
          <>
            <div className="products-grid">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {categoryProducts.length === 0 ? (
              <div className="empty-state">
                <h3>No products found in this category</h3>
                <p>Use a different search term or choose another category.</p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

export default Category;