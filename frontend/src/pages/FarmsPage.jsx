import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Container, Modal, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaCirclePlus, FaEye, FaSeedling } from "react-icons/fa6";
import DashboardLayout from "../layouts/DashboardLayout";
import FarmCard from "../components/farms/FarmCard";
import CreateFarmModal, { emptyFarmForm } from "../components/farms/CreateFarmModal";
import { farmService } from "../services/farmService";

const parseApiError = (error) => {
  const responseData = error.response?.data;

  if (!responseData) {
    return "Something went wrong while saving your farm.";
  }

  if (typeof responseData.detail === "string") {
    return responseData.detail;
  }

  const messages = Object.values(responseData)
    .flat()
    .filter(Boolean)
    .map((value) => (Array.isArray(value) ? value[0] : value));

  return messages.length > 0 ? messages.join(" ") : "Something went wrong while saving your farm.";
};

const formatCoordinate = (value) =>
  value === null || value === undefined ? "Not set" : Number(value).toFixed(6);

function FarmDetailsModal({ farm, show, onHide }) {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="farm-modal__title">
          <FaEye />
          Farm Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {farm && (
          <div className="farm-details">
            <div className="farm-details__hero">
              <div className="farm-details__icon">
                <FaSeedling />
              </div>
              <div>
                <h3>{farm.name}</h3>
                <p>{farm.primary_crop}</p>
              </div>
            </div>

            <div className="farm-details__grid">
              <div>
                <span>Area</span>
                <strong>{farm.area}</strong>
              </div>
              <div>
                <span>Soil Type</span>
                <strong>{farm.soil_type}</strong>
              </div>
              <div>
                <span>Latitude</span>
                <strong>{formatCoordinate(farm.latitude)}</strong>
              </div>
              <div>
                <span>Longitude</span>
                <strong>{formatCoordinate(farm.longitude)}</strong>
              </div>
              <div className="farm-details__location">
                <span>Location Summary</span>
                <strong>
                  {formatCoordinate(farm.latitude)}, {formatCoordinate(farm.longitude)}
                </strong>
                {farm.address && <p>{farm.address}</p>}
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function FarmsPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [savingFarm, setSavingFarm] = useState(false);
  const [viewingFarm, setViewingFarm] = useState(null);
  const [deletingFarmId, setDeletingFarmId] = useState(null);

  const pageTitle = useMemo(() => (farms.length > 0 ? `${farms.length} Farms` : "No Farms Yet"), [farms]);

  const loadFarms = async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await farmService.list();
      setFarms(response.data);
    } catch (error) {
      const status = error.response?.status;
      if (status !== 401) {
        setPageError("We could not load your farms right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const openCreateModal = () => {
    setEditingFarm(null);
    setShowForm(true);
  };

  const openEditModal = (farm) => {
    setEditingFarm(farm);
    setShowForm(true);
  };

  const closeForm = () => {
    if (savingFarm) {
      return;
    }
    setShowForm(false);
    setEditingFarm(null);
  };

  const handleSubmitFarm = async (payload) => {
    setSavingFarm(true);
    setPageError("");
    setActionMessage("");

    try {
      if (editingFarm) {
        await farmService.update(editingFarm.id, payload);
        setActionMessage("Farm updated successfully.");
      } else {
        await farmService.create(payload);
        setActionMessage("Farm created successfully.");
      }

      setShowForm(false);
      setEditingFarm(null);
      await loadFarms();
    } catch (error) {
      setPageError(parseApiError(error));
      throw error;
    } finally {
      setSavingFarm(false);
    }
  };

  const handleDelete = async (farm) => {
    const confirmed = window.confirm(`Delete "${farm.name}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingFarmId(farm.id);
    setPageError("");
    setActionMessage("");

    try {
      await farmService.remove(farm.id);
      setActionMessage("Farm deleted successfully.");
      await loadFarms();
    } catch (error) {
      setPageError("We could not delete the farm right now. Please try again.");
    } finally {
      setDeletingFarmId(null);
    }
  };

  return (
    <DashboardLayout>
      <Container fluid className="px-0">
        <Row className="justify-content-center">
          <Col xl={11} xxl={10}>
            <div className="dashboard-page-header farms-page-header">
              <div>
                <p className="dashboard-eyebrow mb-2">Farm Management</p>
                <h1 className="dashboard-title mb-2">Your Farms</h1>
                <p className="dashboard-lead mb-0">
                  Create, review, and manage every farm attached to your TerraMind account.
                </p>
              </div>

              <Button variant="success" className="dashboard-primary-btn" onClick={openCreateModal}>
                <FaCirclePlus />
                Add Farm
              </Button>
            </div>

            {actionMessage && <Alert variant="success">{actionMessage}</Alert>}
            {pageError && <Alert variant="danger">{pageError}</Alert>}

            {loading ? (
              <Card className="dashboard-card dashboard-empty-panel">
                <Card.Body>
                  <Spinner animation="border" variant="success" />
                  <h2>Loading farms</h2>
                  <p>Fetching your farm records from TerraMind.</p>
                </Card.Body>
              </Card>
            ) : farms.length === 0 ? (
              <Card className="dashboard-card dashboard-empty-panel">
                <Card.Body>
                  <div className="dashboard-empty-panel__icon">
                    <FaSeedling />
                  </div>
                  <h2>Create your first farm</h2>
                  <p>
                    Add a farm to unlock location-based insights, crop guidance, and a clean overview of your land.
                  </p>
                  <div className="dashboard-empty-panel__actions">
                    <Button variant="success" className="dashboard-primary-btn" onClick={openCreateModal}>
                      <FaCirclePlus />
                      Create Farm
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <>
                <div className="farm-summary-banner">
                  <div>
                    <strong>{pageTitle}</strong>
                    <span>Manage farms, edit details, and keep records accurate.</span>
                  </div>
                  <Link to="/dashboard" className="btn btn-outline-success">
                    Back to Dashboard
                  </Link>
                </div>

                <Row className="g-3 g-xl-4">
                  {farms.map((farm) => (
                    <Col key={farm.id} xs={12} md={6} xl={4}>
                      <FarmCard
                        farm={farm}
                        onView={setViewingFarm}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                      />
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
        onHide={closeForm}
        onSubmit={handleSubmitFarm}
        loading={savingFarm}
        initialFarm={editingFarm || emptyFarmForm}
        mode={editingFarm ? "edit" : "create"}
        errorMessage={pageError}
      />

      <FarmDetailsModal farm={viewingFarm} show={Boolean(viewingFarm)} onHide={() => setViewingFarm(null)} />

      {deletingFarmId && (
        <div className="farm-deleting-indicator">
          <Spinner animation="border" size="sm" />
          <span>Deleting farm...</span>
        </div>
      )}
    </DashboardLayout>
  );
}
