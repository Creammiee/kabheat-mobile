/**
 * Kabheat IoT Hardware BLE & Serial Service
 * Configured specifically for Raspberry Pi Pico W "PicoBioSensor"
 * Sensors: DS18B20 (Skin Temp), GSR (Galvanic Skin Response), MAX30102 (Heart Rate & SpO2)
 * Profile: Nordic UART Service (NUS)
 */

export const GATT_SERVICES = {
  NORDIC_UART_SERVICE: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  ENVIRONMENTAL_SENSING: 0x181a,
  HEART_RATE: 0x180d,
  HEALTH_THERMOMETER: 0x1809,
};

export const GATT_CHARACTERISTICS = {
  NORDIC_TX: "6e400003-b5a3-f393-e0a9-e50e24dcca9e", // Pico -> Phone (Notify)
  NORDIC_RX: "6e400002-b5a3-f393-e0a9-e50e24dcca9e", // Phone -> Pico (Write)
};

/**
 * Parses line format emitted by Pico W:
 * e.g., "GSR:512,TEMP:24.31,HR:72,SPO2:98" or JSON
 */
export function parsePicoBioSensorPayload(rawString) {
  const telemetry = {};
  const line = rawString.trim();

  // Try JSON parsing first
  if (line.startsWith("{") && line.endsWith("}")) {
    try {
      const data = JSON.parse(line);
      return {
        bodyTemp: data.bodyTemp || data.temp || data.TEMP || 37.4,
        ambientTemp: data.ambientTemp || 34.5,
        humidity: data.humidity || 70,
        heartRate: data.heartRate || data.hr || data.HR || 72,
        spO2: data.spO2 || data.spo2 || data.SPO2 || 98,
        gsr: data.gsr || data.GSR || 512,
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
    }
  }

  return telemetry;
}

class BLEHardwareManager {
  constructor() {
    this.device = null;
    this.server = null;
    this.nusService = null;
    this.txChar = null;
    this.isConnected = false;
    this.packetCount = 0;
    this.onTelemetryUpdate = null;
    this.buffer = "";
  }

  isBluetoothSupported() {
    return typeof window !== "undefined" && "bluetooth" in navigator;
  }

  isSerialSupported() {
    return typeof window !== "undefined" && "serial" in navigator;
  }

  /**
   * Request Bluetooth Scan targeting "Kabheat"
   */
  async connectBLE(onTelemetryCallback) {
    if (!this.isBluetoothSupported()) {
      throw new Error("Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Brave.");
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: "Kabheat" },
          { name: "KabHeat" },
          { namePrefix: "Kabheat" },
          { namePrefix: "KabHeat" },
          { name: "PicoBioSensor" },
          { namePrefix: "Pico" },
          { services: [GATT_SERVICES.NORDIC_UART_SERVICE] },
        ],
        optionalServices: [
          GATT_SERVICES.NORDIC_UART_SERVICE,
          GATT_SERVICES.ENVIRONMENTAL_SENSING,
          GATT_SERVICES.HEART_RATE,
          GATT_SERVICES.HEALTH_THERMOMETER,
        ],
      });

      this.device.addEventListener("gattserverdisconnected", this.onDisconnected.bind(this));

      this.server = await this.device.gatt.connect();
      this.isConnected = true;
      this.onTelemetryUpdate = onTelemetryCallback;

      // Connect to Nordic UART Service (NUS) TX Characteristic
      await this.startPicoNUSTxNotifications();

      return {
        deviceName: this.device.name || "Kabheat Hardware",
        deviceId: this.device.id,
        connected: true,
      };
    } catch (error) {
      console.warn("BLE Connection failed or cancelled:", error);
      throw error;
    }
  }

  /**
   * Connect to Pico W over Web Serial USB port (115200 baud)
   */
  async connectSerial(onTelemetryCallback) {
    if (!this.isSerialSupported()) {
      throw new Error("Web Serial API is not supported in this browser.");
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      this.isConnected = true;
      this.onTelemetryUpdate = onTelemetryCallback;

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      this.readSerialLoop(reader);

      return {
        deviceName: "PicoBioSensor (USB Serial)",
        connected: true,
      };
    } catch (error) {
      console.warn("Serial Connection failed:", error);
      throw error;
    }
  }

  async startPicoNUSTxNotifications() {
    if (!this.server) return;

    try {
      // 1. Try Nordic UART Service (NUS)
      this.nusService = await this.server.getPrimaryService(GATT_SERVICES.NORDIC_UART_SERVICE).catch(() => null);

      if (this.nusService) {
        this.txChar = await this.nusService.getCharacteristic(GATT_CHARACTERISTICS.NORDIC_TX).catch(() => null);

        if (this.txChar) {
          await this.txChar.startNotifications();
          this.txChar.addEventListener("characteristicvaluechanged", (event) => {
            const value = event.target.value;
            const textDecoder = new TextDecoder("utf-8");
            const chunk = textDecoder.decode(value);

            this.buffer += chunk;
            const lines = this.buffer.split("\n");
            this.buffer = lines.pop();

            for (const line of lines) {
              if (line.trim()) {
                this.packetCount++;
                const parsedPayload = parsePicoBioSensorPayload(line);
                if (this.onTelemetryUpdate && Object.keys(parsedPayload).length > 0) {
                  this.onTelemetryUpdate(parsedPayload, line.trim());
                }
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn("NUS Notification setup error:", err.message);
    }
  }

  async readSerialLoop(reader) {
    let serialBuf = "";
    while (this.isConnected) {
      const { value, done } = await reader.read();
      if (done) break;
      serialBuf += value;
      const lines = serialBuf.split("\n");
      serialBuf = lines.pop();

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
  }

  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.isConnected = false;
    this.device = null;
    this.server = null;
  }

  onDisconnected() {
    this.isConnected = false;
    console.log("PicoBioSensor Disconnected");
  }
}

export const bleHardwareManager = new BLEHardwareManager();
