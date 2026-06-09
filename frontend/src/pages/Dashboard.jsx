import { Link, useNavigate } from "react-router-dom";
import { FaArrowRightFromBracket, FaSeedling } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const user = currentUser();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="auth-shell">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-7">
            <div className="card auth-card border-0 shadow-lg">
              <div className="card-body p-4 p-md-5">
                <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <span className="auth-brand-icon">
                      <FaSeedling />
                    </span>
                    <div>
                      <h1 className="h3 mb-1">Dashboard</h1>
                      <p className="text-muted mb-0">Your authenticated TerraMind workspace.</p>
                    </div>
                  </div>
                  <button type="button" className="btn btn-outline-success" onClick={handleLogout}>
                    <FaArrowRightFromBracket className="me-2" />
                    Logout
                  </button>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="dashboard-info card border-0 bg-light h-100">
                      <div className="card-body">
                        <p className="text-uppercase text-muted small mb-2">Username</p>
                        <h2 className="h5 mb-0">{user?.username || "—"}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="dashboard-info card border-0 bg-light h-100">
                      <div className="card-body">
                        <p className="text-uppercase text-muted small mb-2">Email</p>
                        <h2 className="h5 mb-0">{user?.email || "—"}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="dashboard-info card border-0 bg-light h-100">
                      <div className="card-body">
                        <p className="text-uppercase text-muted small mb-2">Phone Number</p>
                        <h2 className="h5 mb-0">{user?.phone_number || "—"}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="dashboard-info card border-0 bg-light h-100">
                      <div className="card-body">
                        <p className="text-uppercase text-muted small mb-2">Role</p>
                        <span className="badge text-bg-success">{user?.role || "Farmer"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 d-flex gap-2 flex-wrap">
                  <Link to="/" className="btn btn-outline-secondary">
                    Back to Landing
                  </Link>
                  <button type="button" className="btn btn-success" onClick={handleLogout}>
                    Logout securely
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
