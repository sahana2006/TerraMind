import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaRightFromBracket, FaSeedling } from "react-icons/fa6";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const user = currentUser();

  const displayName = user?.username || user?.full_name || "TerraMind User";
  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <DashboardLayout>
      <Container fluid className="px-0">
        <Row className="justify-content-center">
          <Col xl={7} xxl={6}>
            <div className="dashboard-page-header dashboard-page-header--simple">
              <div>
                <p className="dashboard-eyebrow mb-2">Account</p>
                <h1 className="dashboard-title mb-2">Profile</h1>
                <p className="dashboard-lead mb-0">Your TerraMind account details and session controls.</p>
              </div>
            </div>

            <Card className="dashboard-card dashboard-profile-card">
              <Card.Body>
                <div className="dashboard-profile-card__hero">
                  <span className="dashboard-profile-card__avatar">
                    <FaSeedling />
                  </span>
                  <div>
                    <h2>{displayName}</h2>
                    <p>{user?.email || "No email available"}</p>
                  </div>
                </div>

                <div className="dashboard-profile-card__grid">
                  <div>
                    <span>Username</span>
                    <strong>{user?.username || "Not set"}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{user?.email || "Not set"}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{user?.phone_number || "Not set"}</strong>
                  </div>
                  <div>
                    <span>Role</span>
                    <strong>{user?.role || "Farmer"}</strong>
                  </div>
                </div>

                <div className="dashboard-profile-card__actions">
                  <Button variant="outline-success" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                    Back
                  </Button>
                  <Button variant="danger" onClick={handleSignOut}>
                    <FaRightFromBracket />
                    Sign out
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
