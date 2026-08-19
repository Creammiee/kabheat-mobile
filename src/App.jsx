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
import { saveHeatLogToCloud, fetchRecentHeatLogs, auth } from "./services/firebaseService";
import { onAuthStateChanged } from "firebase/auth";
import { Geolocation } from "@capacitor/geolocation";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [tempUnit, setTempUnit] = useState(() => localStorage.getItem("kabheat_tempUnit") || "celsius");
  const [alertThreshold, setAlertThreshold] = useState(() => {
    const saved = localStorage.getItem("kabheat_alertThreshold");
    return saved ? JSON.parse(saved) : 45;
  });

  useEffect(() => localStorage.setItem("kabheat_tempUnit", tempUnit), [tempUnit]);
  useEffect(() => localStorage.setItem("kabheat_alertThreshold", JSON.stringify(alertThreshold)), [alertThreshold]);
  const [bleConnected, setBleConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // UI Customization State (Persisted)
  const [themeConfig, setThemeConfig] = useState(() => {
    const saved = localStorage.getItem("kabheat_themeConfig");
    return saved ? JSON.parse(saved) : DEFAULT_THEME_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem("kabheat_themeConfig", JSON.stringify(themeConfig));
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
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem("kabheat_logs");
    return saved ? JSON.parse(saved) : INITIAL_HEAT_LOGS;
  });

  useEffect(() => {
    localStorage.setItem("kabheat_logs", JSON.stringify(logs));
  }, [logs]);

  // Emergency Contacts (Persisted)
  const [emergencyContacts, setEmergencyContacts] = useState(() => {
    const saved = localStorage.getItem("kabheat_emergencyContacts");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("kabheat_emergencyContacts", JSON.stringify(emergencyContacts));
  }, [emergencyContacts]);

  // Real-time calculated heat index (Heuristic)
  const heatIndex = calculateHeatIndex(telemetry.ambientTemp, telemetry.humidity);
  const risk = getHeatRiskLevel(heatIndex, telemetry);

  // GPS Location Tracking (Capacitor)
  useEffect(() => {
    let watchId = null;

    const startLocationTracking = async () => {
      try {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted') {
            console.warn("Location permission denied");
            return;
          }
        }

        watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
          (position, err) => {
            if (err) {
              console.warn("Error getting location: ", err);
              return;
            }
            if (position) {
              setTelemetry((prev) => ({
                ...prev,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                satellites: "GPS",
              }));
            }
          }
        );
      } catch (err) {
        console.warn("Geolocation init error: ", err);
      }
    };

    startLocationTracking();

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, []);

  // Fetch real-time weather (Ambient Temp & Humidity) based on Location
  useEffect(() => {
    if (!telemetry.latitude || !telemetry.longitude) return;

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${telemetry.latitude}&longitude=${telemetry.longitude}&current=temperature_2m,relative_humidity_2m`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data && data.current) {
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
    telemetry.longitude ? telemetry.longitude.toFixed(1) : null
  ]);

  // Add Log Handler
  const handleAddLog = async (newLog) => {
    setLogs((prev) => [newLog, ...prev]);
    
    // Sync to cloud (Firebase offline persistence handles queuing automatically if offline)
    try {
      await saveHeatLogToCloud(newLog);
    } catch (err) {
      console.warn("Firebase sync deferred or failed", err);
    }
  };

  // Load existing logs from Firestore on app startup
  useEffect(() => {
    const loadCloudLogs = async () => {
      const cloudLogs = await fetchRecentHeatLogs();
      if (cloudLogs && cloudLogs.length > 0) {
        setLogs((prev) => {
          const map = new Map(prev.map(l => [l.id, l]));
          cloudLogs.forEach(l => map.set(l.id, l));
          return Array.from(map.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        });
      }
    };
    loadCloudLogs();
  }, []);

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
          user={user}
          authLoading={authLoading}
          setOpenIoTPairing={setOpenIoTPairing}
          bleConnected={bleConnected}
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


