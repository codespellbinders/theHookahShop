const jwt = require("jsonwebtoken");

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev-admin-jwt-secret";
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || "12h";

function signAdminToken(admin) {
  return jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    },
    ADMIN_JWT_SECRET,
    { expiresIn: ADMIN_JWT_EXPIRES_IN }
  );
}

function verifyAdminToken(token) {
  return jwt.verify(token, ADMIN_JWT_SECRET);
}

module.exports = {
  signAdminToken,
  verifyAdminToken,
};
