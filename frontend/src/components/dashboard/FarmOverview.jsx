import { Badge, Button } from "react-bootstrap";
import { FaChartLine, FaCircleExclamation, FaTractor } from "react-icons/fa6";
import SectionCard from "./SectionCard";

export default function FarmOverview({ overview }) {
  return (
    <SectionCard
      title="Farm Overview"
      subtitle="Track the state of your connected farms, fields, and live alerts."
      action={<Badge bg="light" text="success">Empty state</Badge>}
    >
      <div className="dashboard-empty-state">
        <div className="dashboard-empty-state__icon">
          <FaTractor />
        </div>
        <h3>No farms yet</h3>
        <p>
          Add your first farm to unlock field intelligence, disease monitoring, weather-linked
          recommendations, and production analytics.
        </p>
        <Button variant="success" className="dashboard-primary-btn">
          Create First Farm
        </Button>
      </div>

      <div className="dashboard-metric-grid">
        {overview.metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div key={metric.label} className="dashboard-mini-stat">
              <div className="dashboard-mini-stat__icon">
                <Icon />
              </div>
              <div>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-alert-box">
        <FaCircleExclamation />
        <div>
          <strong>Recommended next step</strong>
          <span>{overview.recommendation}</span>
        </div>
        <Button variant="outline-success" size="sm" className="ms-auto">
          <FaChartLine className="me-2" />
          See roadmap
        </Button>
      </div>
    </SectionCard>
  );
}
