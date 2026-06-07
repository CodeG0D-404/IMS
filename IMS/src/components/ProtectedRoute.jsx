import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");

  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        let user = JSON.parse(localStorage.getItem("user"));

        // 🔁 Fallback to API
        if (!user) {
          const res = await api.get("/auth/me");
          user = res.data?.user;

          if (!user) throw new Error("No user");

          localStorage.setItem("user", JSON.stringify(user));
        }

        const storeId = localStorage.getItem("storeId");

        const isSelectStorePage = location.pathname === "/select-store";

        /* =========================================
           ❌ NOT LOGGED IN
        ========================================= */
        if (!user) {
          setRedirectPath("/");
          setAuthorized(false);
          return;
        }

        /* =========================================
           🧑‍💼 ADMIN FLOW
        ========================================= */
        if (user.role === "ADMIN") {
          if (!storeId) {
            // ✅ allow ONLY select-store page
            if (isSelectStorePage) {
              setAuthorized(true);
              return;
            }

            setRedirectPath("/select-store");
            setAuthorized(false);
            return;
          }
        }

        /* =========================================
           👷 EMPLOYEE FLOW
        ========================================= */
        if (user.role !== "ADMIN") {
          if (!user.storeId) {
            localStorage.clear();
            setRedirectPath("/");
            setAuthorized(false);
            return;
          }

          // sync storeId if missing
          if (!storeId) {
            localStorage.setItem("storeId", user.storeId);
          }
        }

        /* =========================================
           ✅ ALL GOOD
        ========================================= */
        setAuthorized(true);

      } catch (err) {
        console.error("Auth check failed:", err);

        localStorage.clear();
        setRedirectPath("/");
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  /* =========================================
     UI STATES
  ========================================= */

  if (loading) return <p>Checking authentication...</p>;

  if (!authorized) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}