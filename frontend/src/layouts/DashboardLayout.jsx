import { useState } from "react";
import { Offcanvas } from "react-bootstrap";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import SidebarNav from "../components/dashboard/SidebarNav";
import { sidebarItems } from "../data/dashboardMock";

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className={`dashboard-shell ${sidebarCollapsed ? "is-collapsed" : ""}`}>
      <aside className="dashboard-sidebar d-none d-lg-flex">
        <SidebarNav
          items={sidebarItems}
          collapsed={sidebarCollapsed}
          onNavigate={() => setSidebarCollapsed(false)}
        />
      </aside>

      <Offcanvas
        className="dashboard-sidebar-mobile"
        show={showMobileSidebar}
        onHide={() => setShowMobileSidebar(false)}
        placement="start"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title>TerraMind AI</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <SidebarNav
            items={sidebarItems}
            onNavigate={() => setShowMobileSidebar(false)}
          />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="dashboard-main">
        <DashboardNavbar
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          onOpenMobileSidebar={() => setShowMobileSidebar(true)}
        />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
