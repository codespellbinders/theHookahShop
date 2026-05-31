const { verifyAdminToken } = require("../lib/adminToken");

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Admin authorization token is required." });
  }

  try {
    const payload = verifyAdminToken(token);
    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired admin token." });
  }
}

module.exports = {
  authenticateAdmin,
};
