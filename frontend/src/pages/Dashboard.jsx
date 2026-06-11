import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { FaCirclePlus, FaSeedling } from "react-icons/fa6";
import DashboardLayout from "../layouts/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Container fluid className="px-0">
        <Row className="justify-content-center">
          <Col xl={9} xxl={8}>
            <div className="dashboard-page-header dashboard-page-header--simple">
              <div>
                <p className="dashboard-eyebrow mb-2">TerraMind AI</p>
                <h1 className="dashboard-title mb-2">Dashboard</h1>
                <p className="dashboard-lead mb-0">
                  A clean workspace for farm intelligence, created to stay calm until your first farm is added.
                </p>
              </div>
            </div>

            <Card className="dashboard-card dashboard-empty-panel">
              <Card.Body>
                <div className="dashboard-empty-panel__icon">
                  <FaSeedling />
                </div>
                <h2>No data available yet</h2>
                <p>
                  Add your first farm to start tracking crops, weather, disease alerts, and AI-powered guidance.
                </p>
                <div className="dashboard-empty-panel__actions">
                  <Button variant="success" className="dashboard-primary-btn">
                    <FaCirclePlus />
                    Create First Farm
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
}
