/* =========================================
   ALLOW ROLES MIDDLEWARE (SMART VERSION)
========================================= */
export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      /* ============================
         AUTH CHECK
      ============================ */
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      /* ============================
         ADMIN = FULL ACCESS
      ============================ */
      if (req.user.role === "ADMIN") {
        return next();
      }

      /* ============================
         ROLE CHECK
      ============================ */
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      /* ============================
         ALLOWED
      ============================ */
      next();

    } catch (error) {
      console.error("AllowRoles error:", error);

      return res.status(500).json({
        success: false,
        message: "Authorization error",
      });
    }
  };
};