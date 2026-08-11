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
import { DEFAULT_ML_CONFIG, predictHeatStrain } from "./services/mlPredictor";
import { applyTheme, DEFAULT_THEME_CONFIG } from "./utils/themeEngine";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [tempUnit, setTempUnit] = useState("celsius");
  const [alertThreshold, setAlertThreshold] = useState(45);
  const [bleConnected, setBleConnected] = useState(true);

  // UI Customization State
  const [themeConfig, setThemeConfig] = useState(DEFAULT_THEME_CONFIG);

  useEffect(() => {
    applyTheme(themeConfig);
  }, [themeConfig]);

  // ML Config State
  const [mlConfig, setMlConfig] = useState(DEFAULT_ML_CONFIG);

  // Live Telemetry State (Enhanced with biometrics from PicoBioSensor hardware)
  const [telemetry, setTelemetry] = useState({
    bodyTemp: 37.4,
    ambientTemp: 34.5,
    humidity: 70,
    heartRate: 72,
    spO2: 98,
    gsr: 512,
    activityLevel: "moderate", // 'sedentary' | 'light' | 'moderate' | 'heavy'
  });

  // Emergency SOS & Modals
  const [openIoTPairing, setOpenIoTPairing] = useState(false);
  const [openSOSModal, setOpenSOSModal] = useState(false);
  const [openAddLogModal, setOpenAddLogModal] = useState(false);

  // Hydration Data
  const [hydrationData, setHydrationData] = useState({
    currentMl: 1250,
    targetMl: 2500,
    intakesCount: 3,
  });

  // Heat Logs List
  const [logs, setLogs] = useState(INITIAL_HEAT_LOGS);

  // Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: "Safety Officer Marcus", relation: "Supervisor", phone: "+63 917 555 0192" },
    { name: "Maria Santos", relation: "Family / Emergency", phone: "+63 918 222 9104" },
  ]);

  // Real-time calculated heat index (Heuristic)
  const heatIndex = calculateHeatIndex(telemetry.ambientTemp, telemetry.humidity);
  const risk = getHeatRiskLevel(heatIndex, telemetry.bodyTemp);

  // Real-time ML Prediction output
  const mlPrediction = predictHeatStrain(telemetry, hydrationData, mlConfig);

  // Periodic Telemetry Simulation (subtle sensor fluctuations)
  useEffect(() => {
    if (!bleConnected) return;

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const bodyDelta = (Math.random() - 0.5) * 0.05;
        const ambientDelta = (Math.random() - 0.5) * 0.1;
        const hrDelta = Math.round((Math.random() - 0.5) * 3);
        const gsrDelta = Math.round((Math.random() - 0.5) * 8);
        return {
          ...prev,
          bodyTemp: Math.min(41.0, Math.max(36.0, Math.round((prev.bodyTemp + bodyDelta) * 10) / 10)),
          ambientTemp: Math.min(48.0, Math.max(24.0, Math.round((prev.ambientTemp + ambientDelta) * 10) / 10)),
          heartRate: Math.min(180, Math.max(50, prev.heartRate + hrDelta)),
          gsr: Math.min(1024, Math.max(100, prev.gsr + gsrDelta)),
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [bleConnected]);

  // Trigger Overheat Alert Simulator
  const triggerOverheatTest = () => {
    setTelemetry({
      bodyTemp: 39.8,
      ambientTemp: 42.0,
      humidity: 82,
      heartRate: 145,
      spO2: 91,
      gsr: 850,
      activityLevel: "heavy",
    });
    setOpenIoTPairing(false);
    setOpenSOSModal(true);
  };

  // Add Log Handler
  const handleAddLog = (newLog) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  const effectiveRiskLevel = mlConfig.engineMode === "noaa" ? risk.level : mlPrediction.riskLevel;

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
          mlPrediction={mlPrediction}
          mlConfig={mlConfig}
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
          mlPrediction={mlPrediction}
          mlConfig={mlConfig}
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
          mlConfig={mlConfig}
          setMlConfig={setMlConfig}
          themeConfig={themeConfig}
          setThemeConfig={setThemeConfig}
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
        triggerOverheatTest={triggerOverheatTest}
      />

      <EmergencySOSModal
        isOpen={openSOSModal}
        onClose={() => setOpenSOSModal(false)}
        currentPos={{ lat: 14.5995, lng: 120.9842 }}
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

