import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSeedling } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const initialState = {
  username: "",
  password: "",
};

export default function Login() {
  const [formData, setFormData] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { login, authBusy, error, setError } = useAuth();

  const validate = () => {
    const nextErrors = {};
    if (!formData.username.trim()) nextErrors.username = "Username is required.";
    if (!formData.password) nextErrors.password = "Password is required.";
    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await login(formData);
      navigate("/dashboard", { replace: true });
    } catch (loginError) {
      const apiError = loginError.response?.data?.detail || loginError.response?.data?.non_field_errors?.[0];
      if (apiError) {
        setFieldErrors({ form: apiError });
      }
    }
  };

  return (
    <div className="auth-shell">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-6 col-xl-5">
            <div className="auth-brand text-center mb-4">
              <span className="auth-brand-icon">
                <FaSeedling />
              </span>
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Log in to continue managing your farm intelligence.</p>
            </div>

            <div className="card auth-card border-0 shadow-lg">
              <div className="card-body p-4 p-md-5">
                {(error || fieldErrors.form) && (
                  <div className="alert alert-danger">{error || fieldErrors.form}</div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      name="username"
                      className={`form-control form-control-lg ${fieldErrors.username ? "is-invalid" : ""}`}
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter your username"
                    />
                    {fieldErrors.username && <div className="invalid-feedback">{fieldErrors.username}</div>}
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      className={`form-control form-control-lg ${fieldErrors.password ? "is-invalid" : ""}`}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                    />
                    {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
                  </div>

                  <button type="submit" className="btn btn-success btn-lg w-100 auth-submit" disabled={authBusy}>
                    {authBusy ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                        Signing in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>

                <p className="auth-switch text-center mt-4 mb-0">
                  New to TerraMind? <Link to="/register">Create an account</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
