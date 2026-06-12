import { Nav } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { FaSeedling } from "react-icons/fa6";

export default function SidebarNav({ items, collapsed = false, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigablePaths = new Set(["/dashboard", "/farms", "/profile"]);

  const handleItemClick = (item) => {
    onNavigate?.(item);
    if (navigablePaths.has(item.href)) {
      navigate(item.href);
    }
  };

  return (
    <div className={`dashboard-sidebar__inner ${collapsed ? "is-collapsed" : ""}`}>
      <div className="dashboard-sidebar__brand">
        <span className="dashboard-sidebar__mark">
          <FaSeedling />
        </span>
        <div className="dashboard-sidebar__brand-copy">
          <strong>TerraMind AI</strong>
          <span>Agri-intelligence suite</span>
        </div>
      </div>

      <div className="dashboard-sidebar__section">
        <Nav className="dashboard-sidebar__nav flex-column">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || (item.active && location.pathname === "/dashboard");

            return (
              <button
                key={item.label}
                type="button"
                className={`dashboard-sidebar__link ${isActive ? "is-active" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <span className="dashboard-sidebar__link-icon">
                  <Icon />
                </span>
                <span className="dashboard-sidebar__link-text">{item.label}</span>
              </button>
            );
          })}
        </Nav>
      </div>
    </div>
  );
}
