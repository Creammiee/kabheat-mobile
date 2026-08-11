import React, { useState, useEffect } from "react";
import MobileShell from "./components/MobileShell";
import HomeView from "./views/HomeView";
import LiveTelemetryView from "./views/LiveTelemetryView";
import LogsView from "./views/LogsView";
import HydrationTracker from "./components/HydrationTracker";
import ProfileView from "./views/ProfileView";
import IoTSensorModal from "./components/IoTSensorModal";
import EmergencySOSModal from "./components/EmergencySOSModal";
import AddLogModal from "./components/AddLogModal";
import { calculateHeatIndex, getHeatRiskLevel, INITIAL_HEAT_LOGS } from "./utils/heatIndex";
import { applyTheme, DEFAULT_THEME_CONFIG } from "./utils/themeEngine";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [tempUnit, setTempUnit] = useState("celsius");
  const [alertThreshold, setAlertThreshold] = useState(45);
  const [bleConnected, setBleConnected] = useState(false);

  // API Keys
  const [openWeatherKey, setOpenWeatherKey] = useState(
    localStorage.getItem("openWeatherKey") || ""
  );

  useEffect(() => {
    localStorage.setItem("openWeatherKey", openWeatherKey);
  }, [openWeatherKey]);

  // UI Customization State
  const [themeConfig, setThemeConfig] = useState(DEFAULT_THEME_CONFIG);

  useEffect(() => {
    applyTheme(themeConfig);
  }, [themeConfig]);

  // Live Telemetry State (Enhanced with biometrics from IoT Hardware)
  const [telemetry, setTelemetry] = useState({
    bodyTemp: null,
    ambientTemp: null,
    humidity: null,
    heartRate: null,
    spO2: null,
    gsr: null,
    activityLevel: "moderate", // 'sedentary' | 'light' | 'moderate' | 'heavy'
    latitude: null,
    longitude: null,
  });

  // Emergency SOS & Modals
  const [openIoTPairing, setOpenIoTPairing] = useState(false);
  const [openSOSModal, setOpenSOSModal] = useState(false);
  const [openAddLogModal, setOpenAddLogModal] = useState(false);

  // Hydration Data
  const [hydrationData, setHydrationData] = useState({
    currentMl: 0,
    targetMl: 2500,
    intakesCount: 0,
  });

  // Heat Logs List
  const [logs, setLogs] = useState(INITIAL_HEAT_LOGS);

  // Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  // Real-time calculated heat index (Heuristic)
  const heatIndex = calculateHeatIndex(telemetry.ambientTemp, telemetry.humidity);
  const risk = getHeatRiskLevel(heatIndex, telemetry.bodyTemp);

  // GPS Location Tracking (Device built-in GPS)
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setTelemetry((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          satellites: "Device",
        }));
      },
      (error) => {
        console.warn("Error getting location: ", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fetch real-time weather (Ambient Temp & Humidity) based on Location
  useEffect(() => {
    if (!telemetry.latitude || !telemetry.longitude) return;

    const fetchWeather = async () => {
      try {
        let url = `https://api.open-meteo.com/v1/forecast?latitude=${telemetry.latitude}&longitude=${telemetry.longitude}&current=temperature_2m,relative_humidity_2m`;
        
        if (openWeatherKey) {
          url = `https://api.openweathermap.org/data/2.5/weather?lat=${telemetry.latitude}&lon=${telemetry.longitude}&units=metric&appid=${openWeatherKey}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        if (openWeatherKey && data && data.main) {
          setTelemetry((prev) => ({
            ...prev,
            ambientTemp: data.main.temp,
            humidity: data.main.humidity
          }));
        } else if (!openWeatherKey && data && data.current) {
          setTelemetry((prev) => ({
            ...prev,
            ambientTemp: data.current.temperature_2m,
            humidity: data.current.relative_humidity_2m
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch location weather: ", err);
      }
    };

    fetchWeather();
    
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [
    // Coarse dependency: only re-fetch if location changes by ~11km (0.1 degrees)
    telemetry.latitude ? telemetry.latitude.toFixed(1) : null,
    telemetry.longitude ? telemetry.longitude.toFixed(1) : null,
    openWeatherKey // re-fetch if they change the API key
  ]);

  // Add Log Handler
  const handleAddLog = (newLog) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  const effectiveRiskLevel = risk.level;

  return (
    <MobileShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      bleConnected={bleConnected}
      setOpenIoTPairing={setOpenIoTPairing}
      setOpenSOSModal={setOpenSOSModal}
      criticalAlert={effectiveRiskLevel === "CRITICAL"}
      riskLevel={effectiveRiskLevel}
    >
      {activeTab === "home" && (
        <HomeView
          heatIndex={heatIndex}
          telemetry={telemetry}
          risk={risk}
          tempUnit={tempUnit}
          setActiveTab={setActiveTab}
          setOpenIoTPairing={setOpenIoTPairing}
          setOpenSOSModal={setOpenSOSModal}
          setOpenAddLogModal={setOpenAddLogModal}
          hydrationData={hydrationData}
        />
      )}

      {activeTab === "telemetry" && (
        <LiveTelemetryView
          telemetry={telemetry}
          setTelemetry={setTelemetry}
          tempUnit={tempUnit}
          bleConnected={bleConnected}
          setOpenIoTPairing={setOpenIoTPairing}
        />
      )}

      {activeTab === "logs" && (
        <LogsView
          logs={logs}
          setOpenAddLogModal={setOpenAddLogModal}
          tempUnit={tempUnit}
        />
      )}

      {activeTab === "hydration" && (
        <HydrationTracker
          hydrationData={hydrationData}
          setHydrationData={setHydrationData}
        />
      )}

      {activeTab === "profile" && (
        <ProfileView
          tempUnit={tempUnit}
          setTempUnit={setTempUnit}
          alertThreshold={alertThreshold}
          setAlertThreshold={setAlertThreshold}
          emergencyContacts={emergencyContacts}
          setEmergencyContacts={setEmergencyContacts}
          themeConfig={themeConfig}
          setThemeConfig={setThemeConfig}
          openWeatherKey={openWeatherKey}
          setOpenWeatherKey={setOpenWeatherKey}
        />
      )}

      {/* Global Modals */}
      <IoTSensorModal
        isOpen={openIoTPairing}
        onClose={() => setOpenIoTPairing(false)}
        bleConnected={bleConnected}
        setBleConnected={setBleConnected}
        telemetry={telemetry}
        setTelemetry={setTelemetry}
      />

      <EmergencySOSModal
        isOpen={openSOSModal}
        onClose={() => setOpenSOSModal(false)}
        currentPos={telemetry.latitude ? { lat: telemetry.latitude, lng: telemetry.longitude } : null}
        telemetry={telemetry}
      />

      <AddLogModal
        isOpen={openAddLogModal}
        onClose={() => setOpenAddLogModal(false)}
        onAddLog={handleAddLog}
        currentHeatIndex={heatIndex}
        currentTemp={telemetry.ambientTemp}
      />
    </MobileShell>
  );
}

