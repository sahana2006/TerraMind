import { Badge, Button } from "react-bootstrap";
import { FaArrowRight, FaCirclePlus, FaLeaf } from "react-icons/fa6";
import SectionCard from "./SectionCard";

export default function WelcomeSection({ capabilities }) {
  return (
    <SectionCard
      className="dashboard-card--hero"
      action={<Badge bg="success" className="dashboard-status-badge">No farms connected</Badge>}
    >
      <div className="dashboard-hero">
        <div className="dashboard-hero__content">
          <span className="dashboard-kicker">
            <FaLeaf />
            Welcome to TerraMind AI
          </span>
          <h2 className="dashboard-hero__title">Start with a single farm and grow into a full AI command center.</h2>
          <p className="dashboard-hero__text">
            TerraMind AI helps you detect crop disease early, monitor weather shifts, compare yields,
            and act faster with AI-driven recommendations tailored for agriculture operations.
          </p>

          <div className="dashboard-hero__actions">
            <Button variant="success" className="dashboard-primary-btn">
              <FaCirclePlus />
              Create First Farm
            </Button>
            <Button variant="outline-success" className="dashboard-secondary-btn">
              Explore platform
              <FaArrowRight />
            </Button>
          </div>
        </div>

        <div className="dashboard-hero__panel">
          <div className="dashboard-hero__metric">
            <strong>AI assistant</strong>
            <span>Ready to guide you through onboarding, crop planning, and alerts.</span>
          </div>
          <ul className="dashboard-capability-list">
            {capabilities.map((capability) => {
              const Icon = capability.icon;

              return (
                <li key={capability.title}>
                  <span className="dashboard-capability-list__icon">
                    <Icon />
                  </span>
                  <div>
                    <strong>{capability.title}</strong>
                    <span>{capability.description}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}
