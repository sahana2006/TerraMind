import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaCirclePlus, FaSeedling } from "react-icons/fa6";
import DashboardLayout from "../layouts/DashboardLayout";
import FarmCard from "../components/farms/FarmCard";
import CreateFarmModal from "../components/farms/CreateFarmModal";
import { farmService } from "../services/farmService";

export default function Dashboard() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [savingFarm, setSavingFarm] = useState(false);

  const loadFarms = async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await farmService.list();
      setFarms(response.data);
    } catch (error) {
      const status = error.response?.status;
      if (status !== 401) {
        setPageError("We could not load your farm overview right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const handleSubmitFarm = async (payload) => {
    setSavingFarm(true);
    setPageError("");

    try {
      await farmService.create(payload);
      setShowForm(false);
      await loadFarms();
    } catch (error) {
      const responseData = error.response?.data;
      if (typeof responseData?.detail === "string") {
        setPageError(responseData.detail);
      } else {
        setPageError("We could not create the farm right now.");
      }
      throw error;
    } finally {
      setSavingFarm(false);
    }
  };

  return (
    <DashboardLayout>
      <Container fluid className="px-0">
        <Row className="justify-content-center">
          <Col xl={11} xxl={10}>
            <div className="dashboard-page-header dashboard-page-header--simple">
              <div>
                <p className="dashboard-eyebrow mb-2">TerraMind AI</p>
                <h1 className="dashboard-title mb-2">Dashboard</h1>
                <p className="dashboard-lead mb-0">
                  A clean workspace for farm intelligence, shaped around your current farms and the fastest next step.
                </p>
              </div>

              <Button variant="success" className="dashboard-primary-btn" onClick={() => setShowForm(true)}>
                <FaCirclePlus />
                Create Farm
              </Button>
            </div>

            {pageError && <Alert variant="danger">{pageError}</Alert>}

            {loading ? (
              <Card className="dashboard-card dashboard-empty-panel">
                <Card.Body>
                  <Spinner animation="border" variant="success" />
                  <h2>Loading farm overview</h2>
                  <p>We are pulling in your latest farm records.</p>
                </Card.Body>
              </Card>
            ) : farms.length === 0 ? (
              <Card className="dashboard-card dashboard-empty-panel">
                <Card.Body>
                  <div className="dashboard-empty-panel__icon">
                    <FaSeedling />
                  </div>
                  <h2>No farms yet</h2>
                  <p>
                    Add your first farm to start tracking crops, weather, disease alerts, and AI-powered guidance.
                  </p>
                  <div className="dashboard-empty-panel__actions">
                    <Button variant="success" className="dashboard-primary-btn" onClick={() => setShowForm(true)}>
                      <FaCirclePlus />
                      Create Your First Farm
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <>
                <div className="farm-summary-banner">
                  <div>
                    <strong>Farm Overview</strong>
                    <span>Quick snapshot of the farms currently linked to your account.</span>
                  </div>
                  <Link to="/farms" className="btn btn-outline-success">
                    Manage farms
                  </Link>
                </div>

                <Row className="g-3 g-xl-4">
                  {farms.slice(0, 3).map((farm) => (
                    <Col key={farm.id} xs={12} md={6} xl={4}>
                      <FarmCard farm={farm} compact />
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Col>
        </Row>
      </Container>

      <CreateFarmModal
        show={showForm}
        onHide={() => setShowForm(false)}
        onSubmit={handleSubmitFarm}
        loading={savingFarm}
        errorMessage={pageError}
      />
    </DashboardLayout>
  );
}
