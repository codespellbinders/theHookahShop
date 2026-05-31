const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminAuthRoutes = require("./routes/admin/authRoutes");
const adminProductRoutes = require("./routes/admin/productRoutes");
const adminCategoryRoutes = require("./routes/admin/categoryRoutes");

const app = express();

const corsOrigins = String(process.env.CORS_ORIGIN || process.env.CLIENT_URL || "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(
	cors({
		origin: corsOrigins.length ? corsOrigins : true,
		credentials: true,
	})
);
// simple request logger to trace incoming requests
app.use((req, res, next) => {
	console.log(`[REQ] ${req.method} ${req.originalUrl}`);
	next();
});
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// debug echo route
app.post("/api/debug/echo", express.json(), (req, res) => {
	res.json({ headers: req.headers, body: req.body });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));