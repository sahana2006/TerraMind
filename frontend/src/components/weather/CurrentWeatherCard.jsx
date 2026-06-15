import { Card, Spinner } from "react-bootstrap";
import { FaClock, FaCloudSunRain, FaTriangleExclamation, FaWind } from "react-icons/fa6";
import { formatWeatherTimestamp, getWeatherCondition, getWeatherIcon, getWeatherTone } from "./weatherMeta";

export default function CurrentWeatherCard({ data, loading = false, error = "", empty = false }) {
  const WeatherIcon = data ? getWeatherIcon(data.weather_code) : FaCloudSunRain;
  const condition = data ? getWeatherCondition(data.weather_code) : "Weather unavailable";
  const tone = data ? getWeatherTone(data.weather_code) : "neutral";

  return (
    <Card className={`dashboard-card weather-card weather-card--current tone-${tone}`}>
      <Card.Body>
        <div className="weather-card__header">
          <div>
            <p className="dashboard-eyebrow mb-2">Current Weather</p>
            <h2 className="weather-card__title">Live conditions</h2>
            <p className="weather-card__subtitle">
              Real-time weather pulled from Open-Meteo for the selected farm.
            </p>
          </div>
          <div className="weather-card__hero-icon">
            <WeatherIcon />
          </div>
        </div>

        {loading ? (
          <div className="weather-state">
            <Spinner animation="border" variant="success" />
            <span>Loading current weather...</span>
          </div>
        ) : error ? (
          <div className="weather-state weather-state--error">
            <FaTriangleExclamation />
            <span>{error}</span>
          </div>
        ) : empty ? (
          <div className="weather-state">
            <FaCloudSunRain />
            <span>Select a farm to view current weather.</span>
          </div>
        ) : data ? (
          <>
            <div className="weather-card__temperature">
              <strong>{Number(data.temperature).toFixed(1)}&deg;C</strong>
              <span>{condition}</span>
            </div>

            <div className="weather-current-grid">
              <div className="weather-current-grid__item">
                <FaWind />
                <div>
                  <span>Wind Speed</span>
                  <strong>{Number(data.wind_speed).toFixed(1)} km/h</strong>
                </div>
              </div>

              <div className="weather-current-grid__item">
                <FaTriangleExclamation />
                <div>
                  <span>Weather Code</span>
                  <strong>{data.weather_code}</strong>
                </div>
              </div>

              <div className="weather-current-grid__item weather-current-grid__item--wide">
                <FaClock />
                <div>
                  <span>Last Updated</span>
                  <strong>{formatWeatherTimestamp(data.current_time)}</strong>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="weather-state">
            <FaCloudSunRain />
            <span>Select a farm to begin.</span>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
