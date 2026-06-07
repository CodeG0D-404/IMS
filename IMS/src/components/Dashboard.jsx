import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./Css/Sidebar.css";
import "./Css/Dashboard.css";

const Dashboard = () => {
  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;