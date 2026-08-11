/**
 * Kabheat IoT Hardware BLE Service (Native Capacitor Edition)
 * Configured specifically for Raspberry Pi Pico W
 * Sensors: DS18B20 (Skin Temp), GSR, MAX30102 (Heart Rate & SpO2)
 * Profile: Nordic UART Service (NUS)
 */
import { BleClient, numberToUUID } from '@capacitor-community/bluetooth-le';

export const GATT_SERVICES = {
  NORDIC_UART_SERVICE: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
};

export const GATT_CHARACTERISTICS = {
  NORDIC_TX: "6e400003-b5a3-f393-e0a9-e50e24dcca9e", // Pico -> Phone (Notify)
  NORDIC_RX: "6e400002-b5a3-f393-e0a9-e50e24dcca9e", // Phone -> Pico (Write)
};

/**
 * Parses line format emitted by Pico W:
 * e.g., "GSR:512,TEMP:24.31,HR:72,SPO2:98"
 */
export function parsePicoBioSensorPayload(rawString) {
  const telemetry = {};
  const line = rawString.trim();

  // Try JSON parsing first
  if (line.startsWith("{") && line.endsWith("}")) {
    try {
      const data = JSON.parse(line);
      return {
        bodyTemp: data.bodyTemp || data.temp || data.TEMP,
        ambientTemp: data.ambientTemp,
        humidity: data.humidity,
        heartRate: data.heartRate || data.hr || data.HR,
        spO2: data.spO2 || data.spo2 || data.SPO2,
        gsr: data.gsr || data.GSR,
        latitude: data.lat || data.latitude || data.LAT,
        longitude: data.lng || data.longitude || data.LNG,
        satellites: data.satellites || data.sats || data.SATS,
      };
    } catch (e) {
      // Fallback to key-value string parsing
    }
  }

  // Key-value parsing for: "GSR:512,TEMP:24.31,HR:72,SPO2:98"
  const parts = line.split(",");
  for (const part of parts) {
    const [key, val] = part.split(":");
    if (!key || val === undefined) continue;

    const cleanKey = key.trim().toUpperCase();
    const cleanVal = val.trim();

    if (cleanKey === "GSR") {
      const parsedGSR = parseInt(cleanVal, 10);
      if (!isNaN(parsedGSR)) telemetry.gsr = parsedGSR;
    } else if (cleanKey === "TEMP") {
      if (cleanVal !== "NA") {
        const parsedTemp = parseFloat(cleanVal);
        if (!isNaN(parsedTemp)) telemetry.bodyTemp = parsedTemp;
      }
    } else if (cleanKey === "HR") {
      const parsedHR = parseInt(cleanVal, 10);
      if (!isNaN(parsedHR) && parsedHR > 0) telemetry.heartRate = parsedHR;
    } else if (cleanKey === "SPO2") {
      const parsedSpO2 = parseInt(cleanVal, 10);
      if (!isNaN(parsedSpO2) && parsedSpO2 > 0) telemetry.spO2 = parsedSpO2;
    } else if (cleanKey === "LAT") {
      const parsedLat = parseFloat(cleanVal);
      if (!isNaN(parsedLat)) telemetry.latitude = parsedLat;
    } else if (cleanKey === "LNG") {
      const parsedLng = parseFloat(cleanVal);
      if (!isNaN(parsedLng)) telemetry.longitude = parsedLng;
    } else if (cleanKey === "SATS") {
      const parsedSats = parseInt(cleanVal, 10);
      if (!isNaN(parsedSats)) telemetry.satellites = parsedSats;
    }
  }

  return telemetry;
}

class BLEHardwareManager {
  constructor() {
    this.deviceId = null;
    this.deviceName = null;
    this.isConnected = false;
    this.packetCount = 0;
    this.onTelemetryUpdate = null;
    this.buffer = "";
  }

  async connectBLE(onTelemetryCallback) {
    try {
      await BleClient.initialize({ androidNeverForLocation: true });

      const device = await BleClient.requestDevice({
        services: [GATT_SERVICES.NORDIC_UART_SERVICE],
      });

      this.deviceId = device.deviceId;
      this.deviceName = device.name || "Kabheat Hardware";

      await BleClient.connect(this.deviceId, (id) => this.onDisconnected(id));
      
      this.isConnected = true;
      this.onTelemetryUpdate = onTelemetryCallback;

      // Listen to NUS TX notifications
      await BleClient.startNotifications(
        this.deviceId,
        GATT_SERVICES.NORDIC_UART_SERVICE,
        GATT_CHARACTERISTICS.NORDIC_TX,
        (value) => {
          const textDecoder = new TextDecoder("utf-8");
          const chunk = textDecoder.decode(value.buffer);
          
          this.buffer += chunk;
          const lines = this.buffer.split("\n");
          this.buffer = lines.pop(); // keep remainder

          for (const line of lines) {
            if (line.trim()) {
              this.packetCount++;
              const parsedPayload = parsePicoBioSensorPayload(line);
              if (this.onTelemetryUpdate && Object.keys(parsedPayload).length > 0) {
                this.onTelemetryUpdate(parsedPayload, line.trim());
              }
            }
          }
        }
      );

      return {
        deviceName: this.deviceName,
        deviceId: this.deviceId,
        connected: true,
      };
    } catch (error) {
      console.warn("BLE Connection failed or cancelled:", error);
      throw error;
    }
  }

  async connectSerial(onTelemetryCallback) {
    throw new Error("USB Serial connection is not supported in the native mobile app.");
  }

  async disconnect() {
    if (this.deviceId && this.isConnected) {
      try {
        await BleClient.disconnect(this.deviceId);
      } catch (err) {
        console.warn("Error disconnecting:", err);
      }
    }
    this.isConnected = false;
    this.deviceId = null;
  }

  onDisconnected(deviceId) {
    if (deviceId === this.deviceId) {
      this.isConnected = false;
      console.log("Device Disconnected");
    }
  }
}

export const bleHardwareManager = new BLEHardwareManager();
