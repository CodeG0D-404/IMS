import api from "../../services/api";

/* =========================================
   GET PRODUCTS
========================================= */
export const fetchProducts = async () => {
  const res = await api.get("/products");
  return res.data;   // return full object
};


/* =========================================
   CREATE PRODUCT
========================================= */
export const createProduct = async (payload) => {
  const res = await api.post("/products", payload);
  return res.data;
};


/* =========================================
   DELETE PRODUCT
========================================= */
export const deleteProduct = async (id) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};