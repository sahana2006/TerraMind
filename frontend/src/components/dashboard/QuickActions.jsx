import { Button } from "react-bootstrap";
import SectionCard from "./SectionCard";

export default function QuickActions({ actions }) {
  return (
    <SectionCard title="Quick Actions" subtitle="Jump straight into the most common workflows.">
      <div className="dashboard-action-grid">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button key={action.title} type="button" className="dashboard-action-card">
              <span className="dashboard-action-card__icon">
                <Icon />
              </span>
              <strong>{action.title}</strong>
              <span>{action.description}</span>
            </button>
          );
        })}
      </div>

      <div className="dashboard-tip">
        <p className="mb-0">
          Use these actions to move from insight to execution without leaving the dashboard.
        </p>
        <Button variant="outline-success" size="sm">
          Customize shortcuts
        </Button>
      </div>
    </SectionCard>
  );
}
