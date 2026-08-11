/**
 * KabHeat Utility Functions
 * NOAA Heat Index Formula & Thermal Risk Classification
 */

// Calculate Heat Index using Rothfusz regression equation (in Celsius)
export function calculateHeatIndex(tempC, humidity) {
  // Convert Celsius to Fahrenheit for NOAA formula
  const T = (tempC * 9) / 5 + 32;
  const RH = humidity;

  // Simple formula if T < 80°F (approx 26.7°C)
  if (T < 80) {
    const simpleHI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094);
    const hiC = ((simpleHI - 32) * 5) / 9;
    return Math.round(hiC * 10) / 10;
  }

  // Full Rothfusz regression
  let hiF =
    -42.379 +
    2.04901523 * T +
    10.14333127 * RH -
    0.22475541 * T * RH -
    0.00683783 * T * T -
    0.05481717 * RH * RH +
    0.00122874 * T * T * RH +
    0.00085282 * T * RH * RH -
    0.00000199 * T * T * RH * RH;

  // Adjustment for low humidity
  if (RH < 13 && T >= 80 && T <= 112) {
    const adjustment =
      ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95.0)) / 17);
    hiF -= adjustment;
  }

  // Adjustment for high humidity
  if (RH > 85 && T >= 80 && T <= 87) {
    const adjustment = ((RH - 85) / 10) * ((87 - T) / 5);
    hiF += adjustment;
  }

  const hiC = ((hiF - 32) * 5) / 9;
  return Math.round(hiC * 10) / 10;
}

// Risk Level Classification based on Heat Index (°C)
export function getHeatRiskLevel(heatIndexC, bodyTempC = 37.0) {
  if (bodyTempC >= 39.5 || heatIndexC >= 48) {
    return {
      level: "CRITICAL",
      color: "#C93638",
      bgColor: "rgba(201, 54, 56, 0.2)",
      borderColor: "rgba(201, 54, 56, 0.6)",
      title: "Heat Stroke Risk (Critical)",
      description: "Immediate danger of heat stroke! Seek shade, hydrate, and stop physical activity immediately.",
      advice: "Apply cool packs, seek air conditioning or medical assistance.",
      badge: "EMERGENCY ALERT",
      icon: "alert-triangle",
    };
  }

  if (bodyTempC >= 38.5 || heatIndexC >= 41) {
    return {
      level: "DANGER",
      color: "#FA855A",
      bgColor: "rgba(250, 133, 90, 0.18)",
      borderColor: "rgba(250, 133, 90, 0.5)",
      title: "Extreme Caution / High Heat",
      description: "Heat exhaustion likely with prolonged exposure or physical exertion.",
      advice: "Take a 15-minute rest break in a shaded area every 45 minutes.",
      badge: "HIGH RISK",
      icon: "flame",
    };
  }

  if (bodyTempC >= 37.8 || heatIndexC >= 33) {
    return {
      level: "WARNING",
      color: "#FFDE96",
      bgColor: "rgba(255, 222, 150, 0.15)",
      borderColor: "rgba(255, 222, 150, 0.4)",
      title: "Moderate Thermal Strain",
      description: "Fatigue possible with prolonged exposure. Stay regularly hydrated.",
      advice: "Drink at least 250ml of water every 20-30 minutes.",
      badge: "MODERATE RISK",
      icon: "thermometer-sun",
    };
  }

  return {
    level: "SAFE",
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.15)",
    borderColor: "rgba(34, 197, 94, 0.4)",
    title: "Normal Conditions",
    description: "Thermal conditions are safe for outdoor activity.",
    advice: "Maintain regular fluid intake during outdoor tasks.",
    badge: "SAFE CONDITION",
    icon: "shield-check",
  };
}

// Convert Temp
export function formatTemp(tempC, unit = "celsius") {
  if (unit === "fahrenheit") {
    const f = Math.round(((tempC * 9) / 5 + 32) * 10) / 10;
    return `${f}°F`;
  }
  return `${Math.round(tempC * 10) / 10}°C`;
}

// Initial Mock Logs
export const INITIAL_HEAT_LOGS = [
  {
    id: "log-101",
    location: "Construction Site - Zone A",
    temperature: 38.5,
    humidity: 75,
    heatIndex: 46.2,
    bodyTemp: 38.8,
    status: "critical",
    notes: "High solar radiation. Felt lightheaded after 1hr outdoor concrete pouring.",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "log-102",
    location: "Agricultural Field B",
    temperature: 34.0,
    humidity: 68,
    heatIndex: 39.4,
    bodyTemp: 37.6,
    status: "warning",
    notes: "Harvesting crops under direct sunlight. Drank 750ml electrolyte water.",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "log-103",
    location: "Warehouse Logistics Dock",
    temperature: 31.2,
    humidity: 60,
    heatIndex: 33.8,
    bodyTemp: 37.1,
    status: "normal",
    notes: "Ventilated indoor area. Normal hydration maintained.",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];
