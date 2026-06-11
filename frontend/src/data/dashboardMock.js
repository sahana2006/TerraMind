import {
  FaArrowTrendUp,
  FaChartLine,
  FaClipboardCheck,
  FaCloudRain,
  FaCubesStacked,
  FaMicrochip,
  FaRobot,
  FaShieldHeart,
  FaSunPlantWilt,
  FaTractor,
} from "react-icons/fa6";

export const sidebarItems = [
  { label: "Dashboard", href: "/dashboard", icon: FaChartLine, active: true },
  { label: "Farms", href: "/farms", icon: FaTractor },
  { label: "Disease Detection", href: "/disease-detection", icon: FaSunPlantWilt },
  { label: "Crop Advisory", href: "/crop-advisory", icon: FaClipboardCheck },
  { label: "Weather", href: "/weather", icon: FaCloudRain },
  { label: "AI Assistant", href: "/assistant", icon: FaRobot },
  { label: "Yield Prediction", href: "/yield-prediction", icon: FaArrowTrendUp },
  { label: "Market Prediction", href: "/market-prediction", icon: FaCubesStacked },
  { label: "Analytics", href: "/analytics", icon: FaMicrochip },
  { label: "Profile", href: "/profile", icon: FaShieldHeart },
];
