import { useEffect, useState } from "react";
import api from "../services/api";
import "./Css/EmployeeList.css";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/auth/admin/employees");
      setEmployees(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = (id) => {
    setShowPassword((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const openModal = (employee) => {
    setSelectedEmployee(employee);
    setNewPassword("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
  };

  const handlePasswordChange = async () => {
    try {
      await api.post("/auth/admin/reset-password", {
        employeeId: selectedEmployee._id,
        newPassword,
      });

      alert("Password updated successfully");
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update password");
    }
  };

  if (loading) return <div>Loading employees...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="employee-container">

      <h2>Employees</h2>

      <table className="employee-table">

        <thead>
          <tr>
            <th>Store</th>
            <th>Username</th>
            <th>Password</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {employees.length === 0 ? (
            <tr>
              <td colSpan="4">No employees found</td>
            </tr>
          ) : (
            employees.map((emp) => (
              <tr key={emp._id}>

                <td>{emp.store?.name}</td>

                <td>{emp.username}</td>

                <td>
                  <div className="password-cell">

                    <input
                      type={showPassword[emp._id] ? "text" : "password"}
                      value="********"
                      readOnly
                    />

                    <button
                      onClick={() => togglePassword(emp._id)}
                    >
                      👁
                    </button>

                  </div>
                </td>

                <td>
                  <button
                    className="change-btn"
                    onClick={() => openModal(emp)}
                  >
                    Change Password
                  </button>
                </td>

              </tr>
            ))
          )}

        </tbody>

      </table>

      {/* PASSWORD MODAL */}

      {modalOpen && (
        <div className="modal-overlay">

          <div className="modal">

            <h3>Change Password</h3>

            <p>
              Employee: <strong>{selectedEmployee.username}</strong>
            </p>

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="modal-actions">

              <button onClick={handlePasswordChange}>
                Update
              </button>

              <button onClick={closeModal}>
                Cancel
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default EmployeeList;