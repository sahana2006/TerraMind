import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { FaMapLocationDot, FaPlus, FaPenToSquare } from "react-icons/fa6";

export const soilTypeOptions = [
  "Sandy",
  "Loamy",
  "Clay",
  "Silty",
  "Peaty",
  "Chalky",
  "Other",
];

export const emptyFarmForm = {
  name: "",
  area: "",
  soil_type: "",
  primary_crop: "",
  latitude: "",
  longitude: "",
  address: "",
};

const toFormState = (farm) => ({
  ...emptyFarmForm,
  name: farm?.name ?? "",
  area: farm?.area ?? "",
  soil_type: farm?.soil_type ?? "",
  primary_crop: farm?.primary_crop ?? "",
  latitude: farm?.latitude ?? "",
  longitude: farm?.longitude ?? "",
  address: farm?.address ?? "",
});

const getLocationErrorMessage = (error) => {
  if (!error) {
    return "Unable to access your location.";
  }

  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Please allow access and try again.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your location is currently unavailable.";
  }

  if (error.code === error.TIMEOUT) {
    return "Location request timed out. Please try again.";
  }

  return error.message || "Unable to fetch your current location.";
};

export default function CreateFarmModal({
  show,
  onHide,
  onSubmit,
  loading = false,
  initialFarm = null,
  mode = "create",
  errorMessage = "",
}) {
  const [formData, setFormData] = useState(emptyFarmForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");

  const title = mode === "edit" ? "Edit Farm" : "Create Farm";
  const availableSoilTypes =
    formData.soil_type && !soilTypeOptions.includes(formData.soil_type)
      ? [formData.soil_type, ...soilTypeOptions]
      : soilTypeOptions;

  useEffect(() => {
    if (show) {
      setFormData(toFormState(initialFarm));
      setFieldErrors({});
      setLocationMessage("");
      setLocationError("");
    } else {
      setFormData(emptyFarmForm);
      setFieldErrors({});
      setLocationMessage("");
      setLocationError("");
    }
  }, [show, initialFarm]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Farm name is required.";
    if (!formData.area.toString().trim()) {
      errors.area = "Area is required.";
    } else if (Number.isNaN(Number(formData.area)) || Number(formData.area) <= 0) {
      errors.area = "Enter a valid area greater than zero.";
    }

    if (!formData.soil_type.trim()) errors.soil_type = "Soil type is required.";
    if (!formData.primary_crop.trim()) errors.primary_crop = "Primary crop is required.";

    if (!formData.latitude.toString().trim()) {
      errors.latitude = "Latitude is required.";
    } else if (Number.isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90) {
      errors.latitude = "Latitude must be between -90 and 90.";
    }

    if (!formData.longitude.toString().trim()) {
      errors.longitude = "Longitude is required.";
    } else if (Number.isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180) {
      errors.longitude = "Longitude must be between -180 and 180.";
    }

    return errors;
  };

  const handleCurrentLocation = () => {
    setLocationError("");
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        setFormData((current) => ({
          ...current,
          latitude,
          longitude,
        }));
        setLocationMessage("Current location fetched successfully.");
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(getLocationErrorMessage(error));
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      area: Number(formData.area),
      soil_type: formData.soil_type.trim(),
      primary_crop: formData.primary_crop.trim(),
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      address: formData.address.trim(),
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      return;
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title className="farm-modal__title">
            {mode === "edit" ? <FaPenToSquare /> : <FaPlus />}
            {title}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          {locationMessage && <Alert variant="success">{locationMessage}</Alert>}
          {locationError && <Alert variant="warning">{locationError}</Alert>}

          <div className="row g-3">
            <div className="col-12">
              <Form.Group controlId="farmName">
                <Form.Label>Farm Name</Form.Label>
                <Form.Control
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={Boolean(fieldErrors.name)}
                  placeholder="Green Valley Farm"
                />
                <Form.Control.Feedback type="invalid">{fieldErrors.name}</Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-12 col-md-6">
              <Form.Group controlId="farmArea">
                <Form.Label>Area</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  isInvalid={Boolean(fieldErrors.area)}
                  placeholder="25.50"
                />
                <Form.Control.Feedback type="invalid">{fieldErrors.area}</Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-12 col-md-6">
              <Form.Group controlId="soilType">
                <Form.Label>Soil Type</Form.Label>
                <Form.Select
                  name="soil_type"
                  value={formData.soil_type}
                  onChange={handleChange}
                  isInvalid={Boolean(fieldErrors.soil_type)}
                >
                  <option value="">Select soil type</option>
                  {availableSoilTypes.map((soilType) => (
                    <option key={soilType} value={soilType}>
                      {soilType}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{fieldErrors.soil_type}</Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-12 col-md-6">
              <Form.Group controlId="primaryCrop">
                <Form.Label>Primary Crop</Form.Label>
                <Form.Control
                  name="primary_crop"
                  value={formData.primary_crop}
                  onChange={handleChange}
                  isInvalid={Boolean(fieldErrors.primary_crop)}
                  placeholder="Rice"
                />
                <Form.Control.Feedback type="invalid">{fieldErrors.primary_crop}</Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-12 col-md-6">
              <Form.Group controlId="farmAddress">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Village, district, state"
                />
              </Form.Group>
            </div>

            <div className="col-12 col-md-6">
              <Form.Group controlId="farmLatitude">
                <Form.Label>Latitude</Form.Label>
                <Form.Control
                  type="number"
                  step="0.000001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  isInvalid={Boolean(fieldErrors.latitude)}
                  placeholder="28.613939"
                />
                <Form.Control.Feedback type="invalid">{fieldErrors.latitude}</Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-12 col-md-6">
              <Form.Group controlId="farmLongitude">
                <Form.Label>Longitude</Form.Label>
                <Form.Control
                  type="number"
                  step="0.000001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  isInvalid={Boolean(fieldErrors.longitude)}
                  placeholder="77.209021"
                />
                <Form.Control.Feedback type="invalid">{fieldErrors.longitude}</Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="farm-modal__footer">
          <Button
            type="button"
            variant="outline-success"
            onClick={handleCurrentLocation}
            disabled={locationLoading || loading}
          >
            {locationLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Fetching location...
              </>
            ) : (
              <>
                <FaMapLocationDot className="me-2" />
                Use Current Location
              </>
            )}
          </Button>
          <Button type="submit" variant="success" disabled={loading || locationLoading}>
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                {mode === "edit" ? <FaPenToSquare className="me-2" /> : <FaPlus className="me-2" />}
                {mode === "edit" ? "Update Farm" : "Create Farm"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
