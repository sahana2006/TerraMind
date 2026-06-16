import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, Container, ProgressBar, Row, Spinner } from "react-bootstrap";
import { FaArrowRotateRight, FaCameraRetro, FaLeaf, FaTriangleExclamation } from "react-icons/fa6";
import DashboardLayout from "../layouts/DashboardLayout";
import { diseaseService } from "../services/diseaseService";
import "../styles/diseaseDetection.css";

const formatConfidence = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0.00";
  }

  return Number(value).toFixed(2);
};

export default function DiseaseDetectionPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const previewLabel = useMemo(() => {
    if (!selectedImage) {
      return "No image selected";
    }

    return selectedImage.name;
  }, [selectedImage]);

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl("");
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedImage]);

  const resetSelection = () => {
    setSelectedImage(null);
    setPrediction(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      resetSelection();
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Invalid image file.");
      setSelectedImage(null);
      setPrediction(null);
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setPrediction(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedImage) {
      setError("Please choose a leaf image first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await diseaseService.predict(selectedImage);
      setPrediction(response.data);
    } catch (requestError) {
      const message = requestError.response?.data?.error;
      setError(message || "Prediction failed.");
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Container fluid className="px-0">
        <Row className="justify-content-center">
          <Col xl={11} xxl={10}>
            <div className="disease-page">
              <div className="disease-page__hero">
                <p className="dashboard-eyebrow mb-2">Disease Intelligence</p>
                <h1 className="dashboard-title mb-2">Leaf Disease Detection</h1>
                <p className="dashboard-lead mb-0">
                  Upload a leaf image and get the model’s disease prediction with a confidence score.
                </p>
              </div>

              {error && (
                <Alert variant="danger" className="disease-page__alert">
                  {error}
                </Alert>
              )}

              <Row className="g-3 g-xl-4 align-items-stretch">
                <Col xl={6}>
                  <Card className="dashboard-card disease-upload-card h-100">
                    <Card.Body>
                      <div className="disease-card-header">
                        <div>
                          <p className="dashboard-eyebrow mb-2">Upload Image</p>
                          <h2 className="mb-2">Pick a leaf photo</h2>
                          <p className="mb-0">
                            Supported formats are standard image files such as JPG, PNG, and WEBP.
                          </p>
                        </div>
                        <div className="disease-card-header__badge">
                          <FaCameraRetro />
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="disease-upload-form">
                        <label className={`disease-dropzone ${selectedImage ? "has-file" : ""}`}>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                          <span className="disease-dropzone__icon">
                            <FaLeaf />
                          </span>
                          <strong>{previewLabel}</strong>
                          <span>Choose a healthy or diseased leaf image to analyze.</span>
                        </label>

                        <div className="disease-upload-actions">
                          <Button
                            type="submit"
                            variant="success"
                            className="dashboard-primary-btn"
                            disabled={loading || !selectedImage}
                          >
                            {loading ? <Spinner size="sm" className="me-2" /> : <FaArrowRotateRight />}
                            Predict Disease
                          </Button>

                          <Button
                            type="button"
                            variant="outline-secondary"
                            className="dashboard-secondary-btn"
                            onClick={resetSelection}
                            disabled={loading && !selectedImage}
                          >
                            Clear
                          </Button>
                        </div>
                      </form>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xl={6}>
                  <Card className="dashboard-card disease-result-card h-100">
                    <Card.Body>
                      <div className="disease-card-header">
                        <div>
                          <p className="dashboard-eyebrow mb-2">Prediction</p>
                          <h2 className="mb-2">Inference result</h2>
                          <p className="mb-0">The model output appears here after the upload is processed.</p>
                        </div>
                        <div className="disease-card-header__badge disease-card-header__badge--soft">
                          <FaTriangleExclamation />
                        </div>
                      </div>

                      {previewUrl ? (
                        <div className="disease-preview">
                          <img src={previewUrl} alt="Leaf preview" />
                        </div>
                      ) : (
                        <div className="disease-empty-state">
                          <div className="disease-empty-state__icon">
                            <FaLeaf />
                          </div>
                          <h3>No image loaded</h3>
                          <p>Choose a leaf image on the left to begin classification.</p>
                        </div>
                      )}

                      {prediction && (
                        <div className="disease-result-panel">
                          <div className="disease-result-panel__label">Predicted Disease</div>
                          <div className="disease-result-panel__value">{prediction.disease}</div>

                          <div className="disease-confidence-row">
                            <span>Confidence</span>
                            <strong>{formatConfidence(prediction.confidence)}%</strong>
                          </div>

                          <ProgressBar
                            now={Math.max(0, Math.min(100, Number(prediction.confidence) || 0))}
                            variant="success"
                            className="disease-confidence-bar"
                          />
                        </div>
                      )}
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
