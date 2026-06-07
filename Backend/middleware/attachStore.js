export const attachStore = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  let storeId = null;

  if (req.user.role === "EMPLOYEE") {
    storeId = req.user.store?._id || req.user.store;
  }

  if (req.user.role === "ADMIN") {
    storeId = req.headers["x-store-id"];
  }

  if (!storeId) {
    return res.status(400).json({
      message: "Store not selected",
    });
  }

  req.storeId = storeId.toString();

  next();
};