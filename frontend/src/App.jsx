import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import CropAdvisoryPage from "./pages/CropAdvisoryPage";
import DiseaseDetectionPage from "./pages/DiseaseDetectionPage";
import FarmsPage from "./pages/FarmsPage";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import WeatherPage from "./pages/WeatherPage";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farms"
            element={
              <ProtectedRoute>
                <FarmsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disease-detection"
            element={
              <ProtectedRoute>
                <DiseaseDetectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-advisory"
            element={
              <ProtectedRoute>
                <CropAdvisoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/weather"
            element={
              <ProtectedRoute>
                <WeatherPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
