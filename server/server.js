const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
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

app.listen(5000, () => console.log("Server running on port 5000"));