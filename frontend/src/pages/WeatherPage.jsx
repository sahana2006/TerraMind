import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaCloudSunRain, FaArrowRotateRight, FaLeaf } from "react-icons/fa6";
import DashboardLayout from "../layouts/DashboardLayout";
import { farmService } from "../services/farmService";
import { weatherService } from "../services/weatherService";
import FarmSelector from "../components/weather/FarmSelector";
import CurrentWeatherCard from "../components/weather/CurrentWeatherCard";
import ForecastCard from "../components/weather/ForecastCard";
import "../styles/weather.css";

const parseError = (error) => {
  const responseData = error.response?.data;

  if (!responseData) {
    return "Weather data could not be loaded right now.";
  }

  if (typeof responseData.detail === "string") {
    return responseData.detail;
  }

  const messages = Object.values(responseData)
    .flat()
    .filter(Boolean)
    .map((value) => (Array.isArray(value) ? value[0] : value));

  return messages.length > 0 ? messages.join(" ") : "Weather data could not be loaded right now.";
};

export default function WeatherPage() {
  const [farms, setFarms] = useState([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [farmsError, setFarmsError] = useState("");
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [lastLoadedFarmId, setLastLoadedFarmId] = useState("");

  const selectedFarm = useMemo(
    () => farms.find((farm) => String(farm.id) === String(selectedFarmId)) || null,
    [farms, selectedFarmId],
  );

  const loadFarms = async () => {
    setFarmsLoading(true);
    setFarmsError("");

    try {
      const response = await farmService.list();
      setFarms(response.data);
    } catch (error) {
      setFarmsError(parseError(error));
    } finally {
      setFarmsLoading(false);
    }
  };

  const loadWeather = async (farmId) => {
    if (!farmId) {
      return;
    }

    setWeatherLoading(true);
    setWeatherError("");

    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        weatherService.getCurrentWeather(farmId),
        weatherService.getForecast(farmId),
      ]);

      setCurrentWeather(currentResponse.data);
      setForecast(forecastResponse.data.forecast || []);
      setLastLoadedFarmId(String(farmId));
    } catch (error) {
      setCurrentWeather(null);
      setForecast([]);
      setWeatherError(parseError(error));
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (!selectedFarmId) {
      setCurrentWeather(null);
      setForecast([]);
      setWeatherError("");
      setLastLoadedFarmId("");
      return;
    }

    loadWeather(selectedFarmId);
  }, [selectedFarmId]);

  useEffect(() => {
    if (selectedFarmId && farms.length > 0) {
      const farmStillExists = farms.some((farm) => String(farm.id) === String(selectedFarmId));
      if (!farmStillExists) {
        setSelectedFarmId("");
      }
    }
  }, [farms, selectedFarmId]);

  const hasWeather = Boolean(currentWeather && forecast.length > 0 && String(lastLoadedFarmId) === String(selectedFarmId));

  return (
    <DashboardLayout>
      <Container fluid className="px-0">
        <Row className="justify-content-center">
          <Col xl={11} xxl={10}>
            <div className="weather-page">
              <div className="weather-page__hero">
                <p className="dashboard-eyebrow mb-2">Weather Intelligence</p>
                <h1 className="mb-2">Weather Intelligence</h1>
                <p className="mb-0">
                  Live current conditions and a 5-day forecast for each farm, powered directly by Open-Meteo and
                  pinned to the farm latitude and longitude.
                </p>
              </div>

              {farmsError && <Alert variant="danger">{farmsError}</Alert>}
              {weatherError && <Alert variant="warning">{weatherError}</Alert>}

              <div className="weather-page__toolbar">
                <FarmSelector
                  farms={farms}
                  value={selectedFarmId}
                  onChange={setSelectedFarmId}
                  loading={farmsLoading}
                  error=""
                />

                <Card className="weather-panel">
                  <Card.Body className="weather-panel__stack">
                    <div className="weather-panel__header">
                      <div>
                        <p className="dashboard-eyebrow mb-2">Farm Context</p>
                        <h2>Selected farm overview</h2>
                        <p className="mb-0">
                          Weather is pulled from the farm coordinates, with no stored weather history.
                        </p>
                      </div>
                      <Badge bg="success" className="weather-panel__badge">
                        {selectedFarm ? selectedFarm.name : "No farm selected"}
                      </Badge>
                    </div>

                    {selectedFarm ? (
                      <div className="farm-details__grid">
                        <div>
                          <span>Farm</span>
                          <strong>{selectedFarm.name}</strong>
                        </div>
                        <div>
                          <span>Crop</span>
                          <strong>{selectedFarm.primary_crop}</strong>
                        </div>
                        <div>
                          <span>Coordinates</span>
                          <strong>
                            {Number(selectedFarm.latitude).toFixed(4)}, {Number(selectedFarm.longitude).toFixed(4)}
                          </strong>
                        </div>
                        <div>
                          <span>Area</span>
                          <strong>{selectedFarm.area}</strong>
                        </div>
                      </div>
                    ) : farmsLoading ? (
                      <div className="weather-state">
                        <Spinner animation="border" variant="success" />
                        <span>Loading farms...</span>
                      </div>
                    ) : farms.length === 0 ? (
                      <div className="weather-state">
                        <FaLeaf />
                        <span>No farms are available yet. Create a farm to unlock weather.</span>
                        <Button as={Link} to="/farms" variant="success" className="dashboard-primary-btn">
                          Go to Farms
                        </Button>
                      </div>
                    ) : (
                      <div className="weather-state">
                        <FaCloudSunRain />
                        <span>Select a farm to load current weather and forecast data.</span>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>

              <Row className="g-3 g-xl-4">
                <Col xl={5}>
                  <CurrentWeatherCard
                    data={currentWeather}
                    loading={weatherLoading || (farmsLoading && !selectedFarm)}
                    error={selectedFarm && weatherError ? weatherError : ""}
                    empty={!selectedFarm && !farmsLoading}
                  />
                </Col>

                <Col xl={7}>
                  <Card className="dashboard-card weather-forecast-section">
                    <Card.Body>
                      <div className="weather-forecast-section__header">
                        <div>
                          <p className="dashboard-eyebrow mb-2">7-Day Forecast</p>
                          <h2 className="mb-2">Outlook for the selected farm</h2>
                          <p className="mb-0">Daily highs, lows, and conditions for the next seven days.</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline-success"
                          className="dashboard-secondary-btn"
                          onClick={() => selectedFarmId && loadWeather(selectedFarmId)}
                          disabled={!selectedFarmId || weatherLoading}
                        >
                          {weatherLoading ? <Spinner size="sm" className="me-2" /> : <FaArrowRotateRight />}
                          Refresh
                        </Button>
                      </div>

                      <div className="mt-3">
                        {weatherLoading ? (
                          <div className="weather-state">
                            <Spinner animation="border" variant="success" />
                            <span>Loading forecast...</span>
                          </div>
                        ) : selectedFarm && hasWeather ? (
                          <div className="weather-forecast-grid">
                            {forecast.map((day) => (
                              <ForecastCard key={day.date} day={day} />
                            ))}
                          </div>
                        ) : selectedFarm ? (
                          <div className="weather-state">
                            <FaCloudSunRain />
                            <span>Forecast will appear once the weather request completes.</span>
                          </div>
                        ) : (
                          <div className="weather-state">
                            <FaCloudSunRain />
                            <span>Select a farm to view the 7-day forecast.</span>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
}
