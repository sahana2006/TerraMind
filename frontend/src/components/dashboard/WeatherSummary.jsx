import { Badge } from "react-bootstrap";
import { FaCloudSun, FaDroplet, FaTemperatureHalf, FaWind } from "react-icons/fa6";
import SectionCard from "./SectionCard";

export default function WeatherSummary({ forecast }) {
  return (
    <SectionCard
      title="Weather Summary"
      subtitle="Farm-first weather context for the next few days."
      action={<Badge bg="success">Live advisory</Badge>}
    >
      <div className="dashboard-weather">
        <div className="dashboard-weather__current">
          <div className="dashboard-weather__icon">
            <FaCloudSun />
          </div>
          <div>
            <strong>{forecast.current.temp}</strong>
            <span>{forecast.current.summary}</span>
          </div>
        </div>

        <div className="dashboard-weather__stats">
          {forecast.current.stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className="dashboard-weather__stat">
                <Icon />
                <div>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              </div>
            );
          })}
        </div>

        <div className="dashboard-weather__forecast">
          {forecast.daily.map((day) => (
            <div key={day.day} className="dashboard-weather__day">
              <span>{day.day}</span>
              <strong>{day.temp}</strong>
              <small>{day.note}</small>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
