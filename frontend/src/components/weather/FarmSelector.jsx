import { Alert, Form, Spinner } from "react-bootstrap";

export default function FarmSelector({ farms, value, onChange, loading = false, error = "" }) {
  return (
    <div className="weather-selector">
      <div className="weather-selector__label">
        <span>Select Farm</span>
        <small>Choose a farm to load live weather data from its coordinates.</small>
      </div>

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      <Form.Select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={loading || farms.length === 0}
        className="weather-selector__control"
      >
        <option value="">Select a farm</option>
        {farms.map((farm) => (
          <option key={farm.id} value={String(farm.id)}>
            {farm.name}
          </option>
        ))}
      </Form.Select>

      {loading && (
        <div className="weather-selector__status">
          <Spinner animation="border" size="sm" />
          <span>Loading your farms...</span>
        </div>
      )}
    </div>
  );
}
