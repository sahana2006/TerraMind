import { Button, Dropdown, Navbar } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FiChevronDown, FiMenu } from "react-icons/fi";
import { FaSeedling } from "react-icons/fa6";
import { useAuth } from "../../context/AuthContext";

export default function DashboardNavbar({ collapsed, onToggleSidebar, onOpenMobileSidebar }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const user = currentUser();

  const displayName = user?.username || user?.full_name || "TerraMind User";
  const displayEmail = user?.email || "No email available";

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Navbar expand="lg" className="dashboard-navbar">
      <div className="d-flex align-items-center gap-2">
        <Button
          type="button"
          variant="light"
          className="dashboard-icon-button d-lg-none"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
        >
          <FiMenu />
        </Button>

        <Button
          type="button"
          variant="light"
          className="dashboard-icon-button d-none d-lg-inline-flex"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FiMenu />
        </Button>

        <Navbar.Brand as={Link} to="/dashboard" className="dashboard-brand">
          <span className="dashboard-brand__mark">
            <FaSeedling />
          </span>
          <span className="dashboard-brand__copy">
            <strong>TerraMind AI</strong>
          </span>
        </Navbar.Brand>
      </div>

      <div className="dashboard-navbar__actions">
        <Dropdown align="end">
          <Dropdown.Toggle variant="light" className="dashboard-profile-toggle">
            <span className="dashboard-avatar">{displayName.slice(0, 2).toUpperCase()}</span>
            <FiChevronDown className="dashboard-profile-toggle__chevron" />
          </Dropdown.Toggle>
          <Dropdown.Menu className="dashboard-dropdown dashboard-dropdown--profile">
            <Dropdown.Header className="dashboard-dropdown__header">
              <span className="dashboard-dropdown__label">Signed in as</span>
              <strong>{displayName}</strong>
              <small>{displayEmail}</small>
            </Dropdown.Header>
            <Dropdown.Divider />
            <Dropdown.Item as={Link} to="/profile">
              Profile
            </Dropdown.Item>
            <Dropdown.Item as="button" type="button" onClick={handleSignOut} className="text-danger">
              Sign out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </Navbar>
  );
}
