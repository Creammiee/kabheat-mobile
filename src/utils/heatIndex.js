/**
 * KabHeat Utility Functions
 * NOAA Heat Index Formula & Thermal Risk Classification
 */

// Calculate Heat Index using Rothfusz regression equation (in Celsius)
export function calculateHeatIndex(tempC, humidity) {
  if (tempC === null || humidity === null || isNaN(tempC) || isNaN(humidity)) return null;
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

// Risk Level Classification based on Heat Index (°C) and IoT Telemetry
export function getHeatRiskLevel(heatIndexC, telemetry = {}) {
  // Support both old signature (bodyTempC as number) and new signature (telemetry object)
  const bodyTempC = typeof telemetry === 'number' ? telemetry : (telemetry.bodyTemp || 37.0);
  const hr = telemetry.heartRate;
  const gsrDrop = telemetry.gsrDropPercent;

  if (heatIndexC === null || isNaN(heatIndexC)) {
    return {
      level: "UNKNOWN",
      color: "#9ca3af",
      bgColor: "rgba(156, 163, 175, 0.15)",
      borderColor: "rgba(156, 163, 175, 0.4)",
      title: "Waiting for Sensor Data",
      description: "Connect IoT hardware to stream live thermal telemetry.",
      advice: "Pair device to view risk classification.",
      badge: "NO DATA",
      icon: "activity",
    };
  }

  // Multi-symptom Heatstroke Detection
  const hasAllSensors = hr !== undefined && hr !== null && gsrDrop !== undefined && gsrDrop !== null && bodyTempC !== undefined;

  // Based on experimental data: GSR represents resistance. 
  // Baseline (Dry): > 20000. Sweating (Moist): < 20000. Heavy Sweating: < 10000. Heatstroke (Dry): > 20000.
  const gsrRaw = telemetry.gsr; // Use raw resistance for thresholds, not the percentage drop

  // Level 4 (CRITICAL - Heatstroke): Skin > 39.0°C, HR > 140 BPM, Sweat Failure (Dry skin > 20000)
  const isHeatstroke = hasAllSensors && hr > 140 && gsrRaw > 20000 && bodyTempC > 39.0;

  // Level 3 (DANGER - Heat Exhaustion): Skin >= 38.0°C, HR > 120 BPM, Heavy Sweating (< 10000)
  const isHeatExhaustion = hasAllSensors && hr > 120 && gsrRaw < 10000 && bodyTempC >= 38.0;

  // Level 2 (WARNING - Heat Stress): Skin >= 36.5°C, HR >= 100 BPM, Active Sweating (< 20000)
  const isHeatStress = hasAllSensors && hr >= 100 && gsrRaw < 20000 && bodyTempC >= 36.5;

  if (bodyTempC >= 39.5 || heatIndexC >= 48 || isHeatstroke) {
    return {
      level: "CRITICAL",
      color: "var(--tomato-jam)",
      bgColor: "color-mix(in srgb, var(--tomato-jam) 20%, transparent)",
      borderColor: "color-mix(in srgb, var(--tomato-jam) 60%, transparent)",
      title: "Heat Stroke Risk (Critical)",
      description: "Immediate danger of heat stroke! Seek shade, hydrate, and stop physical activity immediately.",
      advice: "Apply cool packs, seek air conditioning or medical assistance.",
      badge: "EMERGENCY ALERT",
      icon: "alert-triangle",
    };
  }

  if (bodyTempC >= 38.5 || heatIndexC >= 41 || isHeatExhaustion) {
    return {
      level: "DANGER",
      color: "var(--coral-glow)",
      bgColor: "color-mix(in srgb, var(--coral-glow) 18%, transparent)",
      borderColor: "color-mix(in srgb, var(--coral-glow) 50%, transparent)",
      title: "Extreme Caution / High Heat",
      description: "Heat exhaustion likely with prolonged exposure or physical exertion.",
      advice: "Take a 15-minute rest break in a shaded area every 45 minutes.",
      badge: "HIGH RISK",
      icon: "flame",
    };
  }

  if (bodyTempC >= 37.8 || heatIndexC >= 33 || isHeatStress) {
    return {
      level: "WARNING",
      color: "var(--soft-peach)",
      bgColor: "color-mix(in srgb, var(--soft-peach) 15%, transparent)",
      borderColor: "color-mix(in srgb, var(--soft-peach) 40%, transparent)",
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
  if (tempC === null || tempC === undefined || isNaN(tempC)) return "--";
  if (unit === "fahrenheit") {
    const f = Math.round(((tempC * 9) / 5 + 32) * 10) / 10;
    return `${f}°F`;
  }
  return `${Math.round(tempC * 10) / 10}°C`;
}

// Initial Mock Logs
export const INITIAL_HEAT_LOGS = [];

