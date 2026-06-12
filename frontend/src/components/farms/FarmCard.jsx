import { Badge, Button, Card } from "react-bootstrap";
import {
  FaLocationDot,
  FaPenToSquare,
  FaTrash,
  FaEye,
  FaSeedling,
  FaRulerCombined,
} from "react-icons/fa6";

const formatLocation = (farm) => {
  const parts = [];
  if (farm.latitude !== null && farm.latitude !== undefined) {
    parts.push(Number(farm.latitude).toFixed(4));
  }
  if (farm.longitude !== null && farm.longitude !== undefined) {
    parts.push(Number(farm.longitude).toFixed(4));
  }
  const summary = parts.length ? parts.join(", ") : "Location not set";
  return farm.address ? `${summary} | ${farm.address}` : summary;
};

export default function FarmCard({ farm, onView, onEdit, onDelete, compact = false }) {
  return (
    <Card className={`farm-card dashboard-card ${compact ? "is-compact" : ""}`}>
      <Card.Body>
        <div className="farm-card__topline">
          <div className="farm-card__icon">
            <FaSeedling />
          </div>
          <Badge bg="success" text="light" className="farm-card__badge">
            {farm.soil_type}
          </Badge>
        </div>

        <h3 className="farm-card__title">{farm.name}</h3>
        <p className="farm-card__subtitle">{farm.primary_crop}</p>

        <div className="farm-card__meta-grid">
          <div className="farm-card__meta">
            <FaRulerCombined />
            <div>
              <span>Area</span>
              <strong>{farm.area}</strong>
            </div>
          </div>

          <div className="farm-card__meta farm-card__meta--location">
            <FaLocationDot />
            <div>
              <span>Location</span>
              <strong>{formatLocation(farm)}</strong>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="farm-card__actions">
            <Button variant="outline-success" size="sm" onClick={() => onView?.(farm)}>
              <FaEye />
              View
            </Button>
            <Button variant="outline-primary" size="sm" onClick={() => onEdit?.(farm)}>
              <FaPenToSquare />
              Edit
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => onDelete?.(farm)}>
              <FaTrash />
              Delete
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
