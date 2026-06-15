import {
  FaBolt,
  FaCloud,
  FaCloudRain,
  FaCloudShowersHeavy,
  FaSnowflake,
  FaSmog,
  FaSun,
} from "react-icons/fa6";

const defaultMeta = {
  label: "Unknown conditions",
  icon: FaCloud,
};

export const getWeatherMeta = (weatherCode) => {
  const code = Number(weatherCode);

  if (Number.isNaN(code)) {
    return defaultMeta;
  }

  if (code === 0) return { label: "Clear sky", icon: FaSun };
  if (code === 1) return { label: "Mainly clear", icon: FaSun };
  if (code === 2) return { label: "Partly cloudy", icon: FaCloud };
  if (code === 3) return { label: "Overcast", icon: FaCloud };
  if (code === 45 || code === 48) return { label: "Fog", icon: FaSmog };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", icon: FaCloudRain };
  if ([61, 63, 65, 66, 67].includes(code)) return { label: "Rain", icon: FaCloudRain };
  if ([71, 73, 75, 77].includes(code)) return { label: "Snow", icon: FaSnowflake };
  if ([80, 81, 82].includes(code)) return { label: "Rain showers", icon: FaCloudShowersHeavy };
  if ([85, 86].includes(code)) return { label: "Snow showers", icon: FaSnowflake };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", icon: FaBolt };

  return defaultMeta;
};

export const getWeatherTone = (weatherCode) => {
  const code = Number(weatherCode);

  if ([0, 1].includes(code)) return "sunny";
  if ([2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "foggy";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rainy";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snowy";
  if ([95, 96, 99].includes(code)) return "stormy";
  return "neutral";
};

export const getWeatherCondition = (weatherCode) => {
  const meta = getWeatherMeta(weatherCode);
  return meta.label;
};

export const getWeatherIcon = (weatherCode) => getWeatherMeta(weatherCode).icon;

export const formatWeatherDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return { day: dateString, date: dateString };
  }

  return {
    day: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date),
  };
};

export const formatWeatherTimestamp = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
