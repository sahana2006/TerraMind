import SectionCard from "./SectionCard";

export default function PlatformFeaturesOverview({ features }) {
  return (
    <SectionCard
      title="Platform Features Overview"
      subtitle="Everything TerraMind AI can orchestrate from one command center."
    >
      <div className="dashboard-feature-grid">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article key={feature.title} className="dashboard-feature-card">
              <div className="dashboard-feature-card__icon">
                <Icon />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <ul>
                {feature.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}
