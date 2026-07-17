import axios from "axios";

const PROD_BACKEND_FALLBACK = "https://thehookahshop-production.up.railway.app";

function isLocalDevHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isProductionStoreHost(hostname) {
  return hostname === "hookahshoppakistan.store" || hostname === "www.hookahshoppakistan.store";
}

function normalizeApiBase(value) {
  const trimmed = String(value || "").trim().replace(/\/$/, "");
  if (!trimmed) {
    return "";
  }

  // Ensure protocol is present. If the value was provided without protocol
  // (e.g. 'thehookahshop-production.up.railway.app'), prepend https:// so
  // axios receives an absolute baseURL instead of a relative path.
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProto.endsWith("/api") ? withProto : `${withProto}/api`;
}

function getConfiguredServerBase() {
  if (import.meta.env.VITE_API_URL) {
    return normalizeApiBase(import.meta.env.VITE_API_URL).replace(/\/api$/, "");
  }

  const { hostname, origin } = window.location;
  if (isLocalDevHost(hostname)) {
    return `http://${hostname}:5000`;
  }
  if (isProductionStoreHost(hostname)) {
    return PROD_BACKEND_FALLBACK;
  }
  return origin;
}

// Use localhost:5000 in local development and normalize production env values to /api.
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return normalizeApiBase(import.meta.env.VITE_API_URL);
  }
  const { hostname, origin } = window.location;
  if (isLocalDevHost(hostname)) {
    return `http://${hostname}:5000/api`;
  }
  if (isProductionStoreHost(hostname)) {
    return `${PROD_BACKEND_FALLBACK}/api`;
  }
  return `${origin}/api`;
};

const getServerBase = () => {
  return getConfiguredServerBase();
};

const api = axios.create({ baseURL: getApiBase() });

const ADMIN_TOKEN_KEY = "admin_token";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeProduct(raw) {
  const basePrice = toNumber(raw?.price, 0);
  const salePrice = raw?.sale_price === null || raw?.sale_price === undefined ? null : toNumber(raw.sale_price, 0);

  return {
    id: Number(raw?.id),
    name: String(raw?.name || ""),
    slug: String(raw?.slug || ""),
    description: String(raw?.description || ""),
    price: salePrice !== null ? salePrice : basePrice,
    basePrice,
    salePrice,
    sku: raw?.sku || null,
    stockQty: toNumber(raw?.stock_qty, 0),
    status: String(raw?.status || "draft"),
    imageUrl: raw?.image_url || "",
    youtubeVideoUrl: raw?.youtube_video_url || "",
    categoryId: toNumber(raw?.category_id, 0),
    category: String(raw?.category_slug || ""),
    categoryName: String(raw?.category_name || ""),
    createdAt: raw?.created_at,
    updatedAt: raw?.updated_at,
  };
}

function normalizeCategory(raw) {
  return {
    id: Number(raw?.id),
    name: String(raw?.name || ""),
    slug: String(raw?.slug || ""),
    parentCategoryId:
      raw?.parent_category_id === null || raw?.parent_category_id === undefined
        ? null
        : Number(raw.parent_category_id),
    parentCategorySlug: String(raw?.parent_category_slug || ""),
    parentCategoryName: String(raw?.parent_category_name || ""),
    status: String(raw?.status || "active"),
  };
}

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function extractApiError(error, fallbackMessage = "Request failed") {
  return error?.response?.data?.message || fallbackMessage;
}

export function resolveImageUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return `${getServerBase()}${raw}`;
  return `${getServerBase()}/${raw}`;
}

export function optimizeCloudinaryUrl(url, width) {
  if (!url) return "";
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    if (!url.includes("/upload/f_auto,q_auto,w_")) {
      return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
    }
  }
  return url;
}

export function sendVerificationCode(email) {
  return api.post("/auth/send-code", { email });
}

export function verifyCode(email, code) {
  return api.post("/auth/verify-code", { email, code });
}

export async function fetchProducts(params = {}) {
  const response = await api.get("/products", { params });
  return (response.data?.products || []).map(normalizeProduct);
}

export async function fetchProductById(id) {
  const response = await api.get(`/products/${id}`);
  return normalizeProduct(response.data?.product || {});
}

export async function fetchCategories(params = {}) {
  const response = await api.get("/categories", { params });
  return (response.data?.categories || []).map(normalizeCategory);
}

export async function adminLogin(email, password) {
  const response = await api.post("/admin/auth/login", { email, password });
  return {
    token: response.data?.token || "",
    admin: response.data?.admin || null,
  };
}

export async function fetchAdminMe(token) {
  const response = await api.get("/admin/auth/me", authHeaders(token));
  return response.data?.admin || null;
}

export async function fetchAdminProducts(token, params = {}) {
  const response = await api.get("/admin/products", { ...authHeaders(token), params });
  return (response.data?.products || []).map(normalizeProduct);
}

export async function createAdminProduct(token, payload) {
  const response = await api.post("/admin/products", payload, authHeaders(token));
  return response.data;
}

export async function updateAdminProduct(token, id, payload) {
  const response = await api.put(`/admin/products/${id}`, payload, authHeaders(token));
  return response.data;
}

export async function deleteAdminProduct(token, id) {
  const response = await api.delete(`/admin/products/${id}`, authHeaders(token));
  return response.data;
}

export async function fetchAdminCategories(token) {
  const response = await api.get("/admin/categories", authHeaders(token));
  return (response.data?.categories || []).map(normalizeCategory);
}

export async function createAdminCategory(token, payload) {
  const response = await api.post("/admin/categories", payload, authHeaders(token));
  return response.data;
}

export async function deleteAdminCategory(token, id) {
  const response = await api.delete(`/admin/categories/${id}`, authHeaders(token));
  return response.data;
}

export default api;
