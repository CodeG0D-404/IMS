import api from "../../services/api";

export const fetchCategories = async () => {
  const res = await api.get("/categories");
  return res.data.categories || res.data;
};

export const createCategory = async (payload) => {
  const res = await api.post("/categories", payload);
  return res.data;
};

export const deleteCategory = async (id) => {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
};