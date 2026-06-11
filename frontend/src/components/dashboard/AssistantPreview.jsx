import { Button } from "react-bootstrap";
import { FaRobot } from "react-icons/fa6";
import SectionCard from "./SectionCard";

export default function AssistantPreview({ conversation }) {
  return (
    <SectionCard title="AI Assistant Preview" subtitle="A conversational workspace for farm guidance.">
      <div className="dashboard-assistant">
        <div className="dashboard-assistant__header">
          <span className="dashboard-assistant__avatar">
            <FaRobot />
          </span>
          <div>
            <strong>TerraMind Copilot</strong>
            <span>Available 24/7 for agronomy support</span>
          </div>
        </div>

        <div className="dashboard-chat">
          {conversation.map((message) => (
            <div key={message.id} className={`dashboard-chat__bubble is-${message.role}`}>
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        <div className="dashboard-suggestion-row">
          {conversation[conversation.length - 1].suggestions.map((suggestion) => (
            <Button key={suggestion} variant="outline-success" size="sm" className="dashboard-suggestion-btn">
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
