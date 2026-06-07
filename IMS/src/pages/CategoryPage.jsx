// =============================================
// 📁 src/pages/CategoryPage.jsx
// Clean + Aligned Version
// =============================================

import { useEffect, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/CategoryPage.css";

const ITEMS_PER_PAGE = 100;
const COLUMN_SPLIT = 50;

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [newCategory, setNewCategory] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [page, setPage] = useState(1);

  /* =========================================
     LOAD CATEGORIES
  ========================================= */
  const loadCategories = async () => {
    try {
      setLoading(true);

      const res = await api.get("/categories");

      const list = getData(res) || [];

      setCategories(list);
      setFiltered(list);

    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  /* =========================================
     ADD CATEGORY
  ========================================= */
  const handleAdd = async (e) => {
    e.preventDefault();

    if (!newCategory.trim()) return;

    try {
      setActionLoading(true);

      const res = await api.post("/categories", {
        name: newCategory,
      });

      const newCat = getData(res);

      if (newCat) {
        setCategories((prev) => [newCat, ...prev]);
      }

      setNewCategory("");

    } catch (error) {
      console.error("Error adding category:", error);
      alert(error.response?.data?.message || "Failed to add category");
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================
     DELETE CATEGORY
  ========================================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      setActionLoading(true);

      await api.delete(`/categories/${id}`);

      setCategories((prev) =>
        prev.filter((c) => c._id !== id)
      );

    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================
     SEARCH FILTER
  ========================================= */
  useEffect(() => {
    const result = categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );

    setFiltered(result);
    setPage(1);
  }, [search, categories]);

  /* =========================================
     PAGINATION
  ========================================= */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const leftColumn = pageItems.slice(0, COLUMN_SPLIT);
  const rightColumn = pageItems.slice(COLUMN_SPLIT);

  /* =========================================
     UI
  ========================================= */
  return (
    <div className="category-page">

      <h2 className="category-title">Product Categories</h2>

      {/* Top Bar */}
      <div className="category-topbar">

        <form className="category-add-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="New Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />

          <button type="submit" disabled={actionLoading}>
            {actionLoading ? "Adding..." : "Add"}
          </button>
        </form>

        <input
          type="text"
          className="category-search"
          placeholder="Search Categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {loading ? (
        <p className="category-loading">Loading...</p>
      ) : filtered.length === 0 ? (
        <p>No categories found</p>
      ) : (
        <>
          {/* 2 COLUMN */}
          <div className="category-columns">

            {[leftColumn, rightColumn].map((column, colIndex) => (
              <table className="category-table" key={colIndex}>
                <tbody>
                  {Array.from({ length: COLUMN_SPLIT }).map((_, i) => {
                    const cat = column[i];

                    return (
                      <tr key={i}>
                        {cat ? (
                          <>
                            <td className="category-name">
                              {cat.name}
                            </td>

                            <td>
                              <button
                                className="category-delete-btn"
                                onClick={() => handleDelete(cat._id)}
                                disabled={actionLoading}
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="category-empty-row"></td>
                            <td className="category-empty-row"></td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ))}

          </div>

          {/* Pagination */}
          <div className="category-pagination">

            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </button>

            <span>
              Page {page} / {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>

          </div>
        </>
      )}

    </div>
  );
};

export default CategoryPage;