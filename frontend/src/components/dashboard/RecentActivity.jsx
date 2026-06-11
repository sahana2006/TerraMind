import { Badge } from "react-bootstrap";
import SectionCard from "./SectionCard";

export default function RecentActivity({ items }) {
  return (
    <SectionCard title="Recent Activity" subtitle="Stay on top of what changed most recently.">
      <div className="dashboard-activity-list">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="dashboard-activity-item">
              <span className={`dashboard-activity-item__icon is-${item.tone}`}>
                <Icon />
              </span>
              <div className="dashboard-activity-item__content">
                <div className="dashboard-activity-item__topline">
                  <strong>{item.title}</strong>
                  <Badge bg={item.badgeTone}>{item.badge}</Badge>
                </div>
                <p>{item.description}</p>
                <span>{item.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
