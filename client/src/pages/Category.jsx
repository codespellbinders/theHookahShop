import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import { useSearchParams } from "react-router-dom";
import { fetchCategories, fetchProducts } from "../services/api";

const HOOKAH_SECTION_ORDER = [
  "premium-hookahs",
  "exclusive-hookahs",
  "budget-hookahs",
  "portable-hookahs",
  "royal-hookahs",
];

function isHookahSection(categorySlug) {
  const slug = String(categorySlug || "").toLowerCase();
  return slug.includes("hookah") && slug !== "hookahs";
}

function formatSectionTitle(category) {
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
  }, [category, search]);

  const categoryTitle = useMemo(() => {
    const match = categories.find((item) => item.slug === category);
    return match?.name || category.replace(/-/g, " ").toUpperCase();
  }, [categories, category]);

  const hookahSections = useMemo(() => {
    if (category !== "hookahs") return [];

    const hookahCategories = categories.filter((item) => isHookahSection(item.slug));
    const categoryMap = new Map(hookahCategories.map((item) => [item.slug, item]));

    const orderedCategories = [
      ...HOOKAH_SECTION_ORDER.map((slug) => categoryMap.get(slug)).filter(Boolean),
      ...hookahCategories.filter((item) => !HOOKAH_SECTION_ORDER.includes(item.slug)),
    ];

    return orderedCategories
      .map((hookahCategory) => {
        const items = products.filter((product) => product.category === hookahCategory.slug);

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
          key: hookahCategory.slug,
          title: formatSectionTitle(hookahCategory),
          products: matchedProducts,
        };
      })
      .filter((section) => section.products.length > 0);
  }, [category, categories, products, search]);

  const categoryProducts = useMemo(() => {
    if (category === "hookahs") return [];

    return products.filter((product) => {
      const matchesCategory = product.category === category;
      const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase()) || product.categoryName.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, products, search]);

  const isHookahOverview = category === "hookahs";

  return (
    <section className="products-section">
      <div className="products-container">
        <h1 className="products-title">{categoryTitle}</h1>

        {loading && <p className="muted-message">Loading category...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && isHookahOverview && (
          <>
              {hookahSections.length ? (
              hookahSections.map((section) => (
                <div className="category-section" key={section.key}>
                  <h2 className="category-section-title">{section.title}</h2>
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
                <h3>No hookah products found</h3>
                <p>Create admin categories like Premium Hookahs and assign products to them.</p>
              </div>
            )}
          </>
        )}

        {!loading && !error && !isHookahOverview && (
          <>
            <div className="products-grid">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {categoryProducts.length === 0 && (
              <div className="empty-state">
                <h3>No products found in this category</h3>
                <p>Use a different search term or choose another category.</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default Category;