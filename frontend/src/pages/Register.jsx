import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSeedling } from "react-icons/fa6";
import { authService } from "../services/authService";
import "./Auth.css";

const initialState = {
  username: "",
  email: "",
  phone_number: "",
  password: "",
  confirm_password: "",
};

export default function Register() {
  const [formData, setFormData] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const nextErrors = {};
    if (!formData.username.trim()) nextErrors.username = "Username is required.";
    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!formData.phone_number.trim()) nextErrors.phone_number = "Phone number is required.";
    if (!formData.password) nextErrors.password = "Password is required.";
    if (formData.password !== formData.confirm_password) {
      nextErrors.confirm_password = "Passwords do not match.";
    }
    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await authService.register(formData);
      setMessage("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      const apiErrors = error.response?.data || {};
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        ...Object.fromEntries(
          Object.entries(apiErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
        ),
      }));
      setMessage("");
    } finally {
      setLoading(false);
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
              <h1 className="auth-title">Create your TerraMind account</h1>
              <p className="auth-subtitle">Join the agriculture intelligence platform in minutes.</p>
            </div>

            <div className="card auth-card border-0 shadow-lg">
              <div className="card-body p-4 p-md-5">
                {message && <div className="alert alert-success">{message}</div>}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      name="username"
                      className={`form-control form-control-lg ${fieldErrors.username ? "is-invalid" : ""}`}
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="farmer_john"
                    />
                    {fieldErrors.username && <div className="invalid-feedback">{fieldErrors.username}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className={`form-control form-control-lg ${fieldErrors.email ? "is-invalid" : ""}`}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                    />
                    {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      className={`form-control form-control-lg ${fieldErrors.phone_number ? "is-invalid" : ""}`}
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                    />
                    {fieldErrors.phone_number && (
                      <div className="invalid-feedback">{fieldErrors.phone_number}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      className={`form-control form-control-lg ${fieldErrors.password ? "is-invalid" : ""}`}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                    />
                    {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      name="confirm_password"
                      className={`form-control form-control-lg ${fieldErrors.confirm_password ? "is-invalid" : ""}`}
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Repeat your password"
                    />
                    {fieldErrors.confirm_password && (
                      <div className="invalid-feedback">{fieldErrors.confirm_password}</div>
                    )}
                  </div>

                  {fieldErrors.non_field_errors && (
                    <div className="alert alert-danger">{fieldErrors.non_field_errors}</div>
                  )}

                  <button type="submit" className="btn btn-success btn-lg w-100 auth-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                        Creating account...
                      </>
                    ) : (
                      "Register"
                    )}
                  </button>
                </form>

                <p className="auth-switch text-center mt-4 mb-0">
                  Already have an account? <Link to="/login">Login here</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
