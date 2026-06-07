// =============================================
// 📁 src/pages/Login.jsx
// Login Page (Debug Version)
// =============================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Css/Login.css";

export default function Login() {

  const [role, setRole] = useState("ADMIN");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    console.log("Submitting login...");
    console.log("Role:", role);

    try {
      let res;

      if (role === "ADMIN") {

        console.log("Calling ADMIN login API");

        res = await api.post("/auth/admin/login", {
          email,
          password
        });

      } else {

        console.log("Calling EMPLOYEE login API");

        res = await api.post("/auth/employee/login", {
          username,
          password
        });

      }

      console.log("Login API response:", res);
      console.log("Response data:", res.data);

      const user = res.data?.user;

      console.log("Parsed user object:", user);

      if (!user) {
        console.warn("No user object returned from backend");
        console.log("Redirecting based on role only");

        if (role === "ADMIN") {
          navigate("/select-store");
        } else {
          navigate("/dashboard");
        }

        return;
      }

      console.log("User role:", user.role);

      if (user.role === "ADMIN") {

        console.log("Admin detected → redirecting to select-store");

        navigate("/select-store");

      } else {

        console.log("Employee detected → saving storeId");

        localStorage.setItem("storeId", user.storeId);

        navigate("/dashboard");
      }

    } catch (err) {

      console.error("Login error:", err);

      if (err.response) {
        console.error("Server response:", err.response.data);
      }

      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <h2 className="login-title">Inventory Management System</h2>
        <p className="login-subtitle">Login to continue</p>

        {/* Role Selector */}
        <div className="role-switch">

          <button
            type="button"
            className={role === "ADMIN" ? "active" : ""}
            onClick={() => setRole("ADMIN")}
          >
            Admin
          </button>

          <button
            type="button"
            className={role === "EMPLOYEE" ? "active" : ""}
            onClick={() => setRole("EMPLOYEE")}
          >
            Employee
          </button>

        </div>

        <form onSubmit={handleLogin} className="login-form">

          {role === "ADMIN" ? (
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          ) : (
            <input
              type="text"
              placeholder="Employee Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="login-btn">
            Login
          </button>

        </form>

      </div>

    </div>
  );
}