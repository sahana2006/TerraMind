import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from "react-bootstrap";
import { FaClipboardCheck, FaRotateRight, FaFlaskVial, FaLeaf } from "react-icons/fa6";
import DashboardLayout from "../layouts/DashboardLayout";
import { cropAdvisoryService } from "../services/cropAdvisoryService";
import "../styles/cropAdvisory.css";

const initialForm = {
  nitrogen: "",
  phosphorus: "",
  potassium: "",
  temperature: "",
  humidity: "",
  ph: "",
  rainfall: "",
};

const parseError = (error) => {
  const responseData = error.response?.data;

  if (!responseData) {
    return "Crop advisory is unavailable right now.";
  }

  if (typeof responseData === "string") {
    const lower = responseData.toLowerCase();
    if (lower.includes("<!doctype html") || lower.includes("<html")) {
      return "Crop advisory could not be loaded right now.";
    }

    return responseData;
  }

  if (typeof responseData.detail === "string") {
    return responseData.detail;
  }

  const messages = Object.values(responseData)
    .flat()
    .filter(Boolean)
    .map((value) => (Array.isArray(value) ? value[0] : value))
    .filter((value) => typeof value === "string" && !value.toLowerCase().includes("<!doctype html"));

  return messages.length > 0 ? messages.join(" ") : "Crop advisory is unavailable right now.";
};

const formatProbability = (value) => `${(Number(value) * 100).toFixed(1)}%`;

export default function CropAdvisoryPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);

  const sortedTopPredictions = useMemo(() => {
    if (!prediction?.top_predictions) {
      return [];
    }

    return [...prediction.top_predictions].sort((a, b) => Number(b.probability) - Number(a.probability));
  }, [prediction]);

  const topFeatureContributions = useMemo(() => {
    if (!prediction?.feature_contributions) {
      return [];
    }

    return [...prediction.feature_contributions]
      .sort((a, b) => Math.abs(Number(b.shap_value)) - Math.abs(Number(a.shap_value)))
      .slice(0, 5);
  }, [prediction]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await cropAdvisoryService.history();
      setHistory(response.data);
    } catch (error) {
      setHistoryError(parseError(error));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setPageError("");

    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, Number(value)]),
    );

    try {
      const response = await cropAdvisoryService.predict(payload);
      setPrediction(response.data.prediction);
      setForm(initialForm);
      await loadHistory();
    } catch (error) {
      setPageError(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Container fluid className="px-0">
        <Row className="justify-content-center">
          <Col xl={11} xxl={10}>
            <div className="crop-advisory-page">
              <div className="crop-advisory-hero">
                <div>
                  <p className="dashboard-eyebrow mb-2">Crop Advisory</p>
                  <h1 className="mb-2">XGBoost crop recommendation</h1>
                  <p className="mb-0">
                    Enter the soil and weather inputs, generate a crop recommendation, and save every prediction to
                    your account history.
                  </p>
                </div>
                <Badge bg="success" className="crop-advisory-hero__badge">
                  <FaClipboardCheck className="me-2" />
                  Saved to database
                </Badge>
              </div>

              {pageError && <Alert variant="danger">{pageError}</Alert>}
              {historyError && <Alert variant="warning">{historyError}</Alert>}

              <Row className="g-3 g-xl-4">
                <Col xl={5}>
                  <Card className="dashboard-card crop-advisory-panel">
                    <Card.Body>
                      <div className="crop-advisory-panel__header">
                        <div>
                          <p className="dashboard-eyebrow mb-2">Soil Inputs</p>
                          <h2>Recommendation form</h2>
                          <p className="mb-0">Provide the seven model features exactly as the crop model expects.</p>
                        </div>
                        <FaFlaskVial />
                      </div>

                      <Form className="crop-advisory-form" onSubmit={handleSubmit}>
                        <Row className="g-3">
                          {[
                            ["nitrogen", "Nitrogen (N)", "number"],
                            ["phosphorus", "Phosphorus (P)", "number"],
                            ["potassium", "Potassium (K)", "number"],
                            ["temperature", "Temperature", "number"],
                            ["humidity", "Humidity", "number"],
                            ["ph", "pH", "number"],
                            ["rainfall", "Rainfall", "number"],
                          ].map(([name, label, type]) => (
                            <Col sm={6} key={name}>
                              <Form.Group controlId={name}>
                                <Form.Label>{label}</Form.Label>
                                <Form.Control
                                  type={type}
                                  name={name}
                                  value={form[name]}
                                  onChange={handleChange}
                                  placeholder={label}
                                  step="any"
                                  required
                                />
                              </Form.Group>
                            </Col>
                          ))}
                        </Row>

                        <div className="crop-advisory-actions mt-4">
                          <Button type="submit" variant="success" className="dashboard-primary-btn" disabled={loading}>
                            {loading ? <Spinner size="sm" className="me-2" /> : <FaLeaf className="me-2" />}
                            Recommend Crop
                          </Button>
                          <Button
                            type="button"
                            variant="outline-success"
                            className="dashboard-secondary-btn"
                            onClick={() => setForm(initialForm)}
                            disabled={loading}
                          >
                            Reset
                          </Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xl={7}>
                  <Card className="dashboard-card crop-advisory-result mb-3">
                    <Card.Body>
                      <div className="crop-advisory-panel__header">
                        <div>
                          <p className="dashboard-eyebrow mb-2">Prediction Result</p>
                          <h2>Latest saved recommendation</h2>
                          <p className="mb-0">The model output is stored in your database history after each submit.</p>
                        </div>
                      </div>

                      {prediction ? (
                        <div className="crop-advisory-result__body">
                          <div className="crop-advisory-result__hero">
                            <span>Recommended crop</span>
                            <strong>{prediction.recommended_crop}</strong>
                            <small>Confidence: {formatProbability(prediction.confidence)}</small>
                          </div>

                          <div className="crop-advisory-toplist">
                            <h3 className="mb-3">Top candidates</h3>
                            <div className="crop-advisory-toplist__items">
                              {sortedTopPredictions.map((item, index) => (
                                <div className="crop-advisory-toplist__item" key={`${item.crop}-${index}`}>
                                  <span>{item.crop}</span>
                                  <strong>{formatProbability(item.probability)}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="crop-advisory-empty">
                          <FaLeaf />
                          <h3>No prediction yet</h3>
                          <p>Fill the form and submit to see the recommendation here.</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  <Card className="dashboard-card crop-advisory-explainer">
                    <Card.Body>
                      <div className="crop-advisory-panel__header">
                        <div>
                          <p className="dashboard-eyebrow mb-2">SHAP Explanation</p>
                          <h2>Why this crop?</h2>
                          <p className="mb-0">
                            Positive values pushed the model toward the recommendation, while negative values pushed
                            against it.
                          </p>
                        </div>
                      </div>

                      {prediction?.feature_contributions ? (
                        <div className="crop-advisory-explainer__list">
                          {topFeatureContributions.map((item) => (
                            <div className="crop-advisory-explainer__item" key={item.feature}>
                              <div>
                                <strong>{item.feature}</strong>
                                <span>Input value: {Number(item.value).toFixed(2)}</span>
                              </div>
                              <span className="crop-advisory-shap-value">
                                {item.direction === "positive" ? "+" : "-"}
                                {Math.abs(Number(item.shap_value)).toFixed(4)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="crop-advisory-empty crop-advisory-empty--history">
                          <FaFlaskVial />
                          <h3>No explanation yet</h3>
                          <p>Run a prediction to see which features influenced the result most.</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="dashboard-card crop-advisory-history mt-3 mt-xl-4">
                <Card.Body>
                  <div className="crop-advisory-panel__header">
                    <div>
                      <p className="dashboard-eyebrow mb-2">Saved History</p>
                      <h2>Recent recommendations</h2>
                      <p className="mb-0">Each prediction is stored with its full input snapshot and model confidence.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline-success"
                      className="dashboard-secondary-btn"
                      onClick={loadHistory}
                      disabled={historyLoading}
                    >
                      {historyLoading ? <Spinner size="sm" className="me-2" /> : <FaRotateRight className="me-2" />}
                      Refresh
                    </Button>
                  </div>

                  {historyLoading ? (
                    <div className="crop-advisory-loading">
                      <Spinner animation="border" variant="success" />
                      <span>Loading saved recommendations...</span>
                    </div>
                  ) : history.length > 0 ? (
                    <div className="table-responsive crop-advisory-table-wrap">
                      <Table hover className="crop-advisory-table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Crop</th>
                            <th>Confidence</th>
                            <th>Inputs</th>
                            <th>Saved</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((entry) => (
                            <tr key={entry.id}>
                              <td>
                                <strong>{entry.recommended_crop}</strong>
                              </td>
                              <td>{formatProbability(entry.confidence)}</td>
                              <td>
                                N {entry.nitrogen}, P {entry.phosphorus}, K {entry.potassium}, pH {entry.ph}
                              </td>
                              <td>{new Date(entry.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="crop-advisory-empty crop-advisory-empty--history">
                      <FaClipboardCheck />
                      <h3>No saved recommendations yet</h3>
                      <p>Your crop advice history will appear here after the first prediction.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
}
