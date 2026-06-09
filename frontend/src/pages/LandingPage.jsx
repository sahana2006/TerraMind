import { FiActivity, FiArrowUpRight, FiCheckCircle, FiSun } from "react-icons/fi";
import {
  FaArrowRight,
  FaBars,
  FaChartLine,
  FaChartPie,
  FaCloudSunRain,
  FaGithub,
  FaLinkedinIn,
  FaLeaf,
  FaPlay,
  FaRobot,
  FaSeedling,
  FaShield,
  FaStar,
  FaTwitter,
  FaTractor,
  FaVial,
  FaWater,
  FaWind,
  FaSatelliteDish,
  FaChartBar,
  FaBullhorn,
  FaCommentDots,
  FaMoneyBillWave,
} from "react-icons/fa6";
import "./LandingPage.css";
import { Link } from "react-router-dom";

const features = [
  {
    icon: <FaVial />,
    title: "Plant Disease Detection",
    points: ["Upload crop images", "AI diagnosis", "Severity estimation"],
  },
  {
    icon: <FaSeedling />,
    title: "Crop Advisory",
    points: ["Soil analysis", "Crop recommendations", "Fertilizer suggestions"],
  },
  {
    icon: <FaCloudSunRain />,
    title: "Weather Intelligence",
    points: ["Real-time forecasts", "Rainfall alerts", "Irrigation recommendations"],
  },
  {
    icon: <FaRobot />,
    title: "AI Farming Assistant",
    points: ["Agricultural chatbot", "Research-backed answers", "RAG-powered knowledge retrieval"],
  },
  {
    icon: <FaChartLine />,
    title: "Yield Prediction",
    points: ["Production forecasting", "Revenue estimation", "Seasonal analysis"],
  },
  {
    icon: <FaChartPie />,
    title: "Market Intelligence",
    points: ["Price forecasting", "Demand analysis", "Selling recommendations"],
  },
];

const steps = [
  {
    title: "Create Your Farm Profile",
    text: "Set up farms, crops, field boundaries, and growing conditions in minutes.",
  },
  {
    title: "Upload Crop and Soil Information",
    text: "Add images, soil notes, weather context, and seasonal data for each plot.",
  },
  {
    title: "AI Analyzes Agricultural Data",
    text: "TerraMind AI combines models, weather intelligence, and agricultural knowledge.",
  },
  {
    title: "Receive Smart Recommendations",
    text: "Get practical actions for disease control, irrigation, yield, and market timing.",
  },
];

const solutions = [
  "Disease Intelligence Engine",
  "Agricultural RAG Knowledge Base",
  "Multi-Agent AI Farming Assistant",
  "Yield Forecasting System",
  "Market Prediction Engine",
  "Precision Agriculture Dashboard",
];

const benefits = [
  { icon: <FiActivity />, title: "Data-Driven Farming Decisions" },
  { icon: <FaLeaf />, title: "Increased Crop Productivity" },
  { icon: <FaShield />, title: "Reduced Agricultural Risk" },
  { icon: <FaWater />, title: "Better Resource Utilization" },
  { icon: <FaTractor />, title: "Faster Disease Identification" },
  { icon: <FaMoneyBillWave />, title: "Improved Revenue Forecasting" },
];

const testimonials = [
  {
    name: "Anita Sharma",
    role: "Vegetable Farmer",
    location: "Pune, India",
    text: "TerraMind AI helped me catch early leaf blight and plan irrigation before the heat wave hit. It feels like having an agronomist on call.",
  },
  {
    name: "Ramesh Patel",
    role: "Rice Grower",
    location: "Surat, India",
    text: "The yield forecasts and weather advisories gave me better timing for fertilizer and harvesting. My decision-making is much faster now.",
  },
  {
    name: "Meera Das",
    role: "Farm Cooperative Lead",
    location: "Nashik, India",
    text: "Our team now uses TerraMind AI for crop planning, pest alerts, and market insights. It has become part of our daily workflow.",
  },
];

const dashboardPanels = [
  { title: "Weather Panel", accent: "Weather Intelligence", icon: <FiSun /> },
  { title: "Disease Detection Panel", accent: "AI Diagnosis", icon: <FaVial /> },
  { title: "Yield Prediction Panel", accent: "Forecasting", icon: <FaChartBar /> },
  { title: "Market Forecast Panel", accent: "Price Signals", icon: <FaBullhorn /> },
  { title: "AI Assistant Panel", accent: "RAG Search", icon: <FaCommentDots /> },
];

function SectionHeading({ eyebrow, title, description, center = false }) {
  return (
    <div className={`section-heading ${center ? "text-center mx-auto" : ""}`}>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="section-description">{description}</p>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="navbar navbar-expand-lg navbar-dark tm-navbar fixed-top">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-2 fw-semibold" href="#home">
            <span className="brand-mark">
              <FaSeedling />
            </span>
            <span>TerraMind AI</span>
          </a>
          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#tmNavbar"
            aria-controls="tmNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <FaBars />
          </button>
          <div className="collapse navbar-collapse" id="tmNavbar">
            <ul className="navbar-nav mx-auto gap-lg-1 mt-3 mt-lg-0">
              {["Home", "Features", "Solutions", "About", "Contact"].map((item) => (
                <li className="nav-item" key={item}>
                  <a className="nav-link" href={`#${item.toLowerCase()}`}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            <div className="d-flex flex-column flex-lg-row gap-2">
              <Link to="/login" className="btn btn-outline-light btn-sm px-3 rounded-pill">
                Login
              </Link>
              <Link to="/register" className="btn btn-success btn-sm px-3 rounded-pill tm-primary-btn">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main id="home">
        <section className="hero-section">
          <div className="container">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <span className="hero-badge">
                  <FiActivity /> AI for precision farming
                </span>
                <h1 className="hero-title">
                  AI-Powered Precision Agriculture for Smarter Farming
                </h1>
                <p className="hero-subtitle">
                  Empowering farmers with disease detection, crop intelligence, weather insights,
                  yield forecasting, market predictions, and AI-driven agricultural decision support.
                </p>
                <div className="d-flex flex-wrap gap-3 mt-4">
                  <Link to="/register" className="btn btn-success btn-lg rounded-pill px-4 tm-primary-btn">
                    Get Started <FaArrowRight className="ms-2" />
                  </Link>
                  <Link to="/login" className="btn btn-outline-success btn-lg rounded-pill px-4 tm-outline-btn">
                    Login
                  </Link>
                </div>
                <div className="hero-trust mt-4">
                  <div className="trust-item">
                    <FaStar />
                    <span>Built for real farms, cooperatives, and agri-enterprises</span>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="hero-visual glass-panel">
                  <div className="hero-visual-grid">
                    <div className="visual-orbit visual-orbit-1" />
                    <div className="visual-orbit visual-orbit-2" />
                    <div className="farm-dashboard-card main-card">
                      <div className="card-topbar">
                        <span className="signal-dot" />
                        Smart Farm Command Center
                      </div>
                      <div className="card-body p-0">
                        <div className="farm-field">
                          <div className="field-horizon" />
                          <div className="field-row field-row-1" />
                          <div className="field-row field-row-2" />
                          <div className="field-row field-row-3" />
                          <div className="field-row field-row-4" />
                        </div>
                        <div className="mini-metrics">
                          <div className="mini-metric">
                            <FaSatelliteDish />
                            <span>Live telemetry</span>
                          </div>
                          <div className="mini-metric">
                            <FaWind />
                            <span>Weather alerts</span>
                          </div>
                          <div className="mini-metric">
                            <FiCheckCircle />
                            <span>Disease scan ready</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="floating-badge badge-one">
                      <FaShield /> Disease Detection
                    </div>
                    <div className="floating-badge badge-two">
                      <FaChartLine /> Yield Prediction
                    </div>
                    <div className="floating-badge badge-three">
                      <FaRobot /> AI Assistant
                    </div>
                    <div className="floating-badge badge-four">
                      <FiSun /> Weather Intelligence
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section-pad">
          <div className="container">
            <SectionHeading
              eyebrow="Features"
              title="Powerful AI Tools for Modern Agriculture"
              description="Everything TerraMind AI needs to help farmers detect problems earlier, plan better, and act with confidence."
              center
            />
            <div className="row g-4 mt-1">
              {features.map((feature) => (
                <div className="col-md-6 col-lg-4" key={feature.title}>
                  <div className="feature-card card h-100 border-0 shadow-sm">
                    <div className="card-body p-4">
                      <div className="feature-icon">{feature.icon}</div>
                      <h3>{feature.title}</h3>
                      <ul className="feature-points">
                        {feature.points.map((point) => (
                          <li key={point}>
                            <FiCheckCircle /> {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-pad alt-section">
          <div className="container">
            <SectionHeading
              eyebrow="How It Works"
              title="A simple workflow for smarter farm decisions"
              description="TerraMind AI turns raw farm data into practical recommendations through a clean four-step process."
              center
            />
            <div className="row g-4 mt-1 timeline-row">
              {steps.map((step, index) => (
                <div className="col-md-6 col-lg-3" key={step.title}>
                  <div className="timeline-card card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <div className="timeline-step">{index + 1}</div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="solutions" className="section-pad">
          <div className="container">
            <SectionHeading
              eyebrow="Solutions"
              title="Platform modules designed for scalable agricultural intelligence"
              description="Modular building blocks that connect crop data, knowledge retrieval, forecasting, and decision support."
              center
            />
            <div className="row g-4 mt-1">
              {solutions.map((module, index) => (
                <div className="col-md-6 col-lg-4" key={module}>
                  <div className="solution-card card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <div className="solution-index">0{index + 1}</div>
                      <h3>{module}</h3>
                      <p>
                        Designed to work with real-world farm workflows, external AI services, and
                        production orchestration.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="section-pad alt-section">
          <div className="container">
            <div className="row align-items-start g-5">
              <div className="col-lg-5">
                <SectionHeading
                  eyebrow="Why TerraMind"
                  title="Built for reliable farm intelligence"
                  description="A clean platform layer that helps teams move faster without adding unnecessary complexity."
                />
              </div>
              <div className="col-lg-7">
                <div className="row g-3">
                  {benefits.map((benefit) => (
                    <div className="col-md-6" key={benefit.title}>
                      <div className="benefit-card card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center gap-3 p-3">
                          <span className="benefit-icon">{benefit.icon}</span>
                          <h3 className="mb-0">{benefit.title}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-pad alt-section">
          <div className="container">
            <SectionHeading
              eyebrow="Testimonials"
              title="Farmers using TerraMind AI to make better decisions"
              description="Real-world style stories from people who need accurate, actionable agricultural guidance."
              center
            />
            <div className="row g-4 mt-1">
              {testimonials.map((testimonial) => (
                <div className="col-lg-4" key={testimonial.name}>
                  <div className="testimonial-card card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <div className="testimonial-avatar">{testimonial.name.charAt(0)}</div>
                      <p className="testimonial-text">"{testimonial.text}"</p>
                      <h3>{testimonial.name}</h3>
                      <p className="testimonial-meta">
                        {testimonial.role} <span>•</span> {testimonial.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="footer-brand">
                <span className="brand-mark">
                  <FaSeedling />
                </span>
                <h3>TerraMind AI</h3>
              </div>
              <p>
                Precision agriculture intelligence for disease detection, AI assistant workflows,
                weather insights, and farming decisions that scale.
              </p>
            </div>
            <div className="col-md-4 col-lg-2">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="col-md-4 col-lg-2">
              <h4>Resources</h4>
              <ul>
                <li><a href="#features">Documentation</a></li>
                <li><a href="#solutions">API</a></li>
                <li><a href="#contact">Support</a></li>
              </ul>
            </div>
            <div className="col-md-4 col-lg-4">
              <h4>Follow</h4>
              <div className="social-links">
                <a href="/" aria-label="LinkedIn">
                  <FaLinkedinIn />
                </a>
                <a href="/" aria-label="GitHub">
                  <FaGithub />
                </a>
                <a href="/" aria-label="Twitter">
                  <FaTwitter />
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 TerraMind AI. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

