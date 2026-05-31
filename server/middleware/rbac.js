const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  sub_admin: [
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "categories.read",
  ],
};

function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes("*") || permissions.includes(permission);
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin || !req.admin.role) {
      return res.status(401).json({ message: "Admin not authenticated." });
    }

    if (!hasPermission(req.admin.role, permission)) {
      return res.status(403).json({ message: "You are not allowed to perform this action." });
    }

    return next();
  };
}

module.exports = {
  requirePermission,
  hasPermission,
  ROLE_PERMISSIONS,
};
