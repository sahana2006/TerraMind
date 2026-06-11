import { Card } from "react-bootstrap";

export default function SectionCard({ title, subtitle, action, className = "", children }) {
  return (
    <Card className={`dashboard-card ${className}`.trim()}>
      <Card.Body>
        {(title || subtitle || action) && (
          <div className="dashboard-card__header">
            <div>
              {title ? <h2 className="dashboard-card__title">{title}</h2> : null}
              {subtitle ? <p className="dashboard-card__subtitle mb-0">{subtitle}</p> : null}
            </div>
            {action ? <div className="dashboard-card__action">{action}</div> : null}
          </div>
        )}
        {children}
      </Card.Body>
    </Card>
  );
}
