import { Card } from "react-bootstrap";
import { formatWeatherDate, getWeatherCondition, getWeatherIcon, getWeatherTone } from "./weatherMeta";

export default function ForecastCard({ day }) {
  const WeatherIcon = getWeatherIcon(day.weather_code);
  const condition = getWeatherCondition(day.weather_code);
  const tone = getWeatherTone(day.weather_code);
  const formatted = formatWeatherDate(day.date);

  return (
    <Card className={`dashboard-card weather-forecast-card tone-${tone}`}>
      <Card.Body>
        <div className="weather-forecast-card__top">
          <div>
            <span className="weather-forecast-card__day">{formatted.day}</span>
            <strong className="weather-forecast-card__date">{formatted.date}</strong>
          </div>
          <WeatherIcon className="weather-forecast-card__icon" />
        </div>

        <p className="weather-forecast-card__condition">{condition}</p>

        <div className="weather-forecast-card__temps">
          <div>
            <span>Min</span>
            <strong>{Number(day.min_temperature).toFixed(1)}&deg;C</strong>
          </div>
          <div>
            <span>Max</span>
            <strong>{Number(day.max_temperature).toFixed(1)}&deg;C</strong>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
