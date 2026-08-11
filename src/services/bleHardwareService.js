/**
 * Kabheat BLE transport for the Raspberry Pi Pico W Nordic UART Service (NUS).
 */
import { BleClient } from "@capacitor-community/bluetooth-le";

export const GATT_SERVICES = {
  NORDIC_UART_SERVICE: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
};

export const GATT_CHARACTERISTICS = {
  NORDIC_TX: "6e400003-b5a3-f393-e0a9-e50e24dcca9e", // Pico -> phone notifications
  NORDIC_RX: "6e400002-b5a3-f393-e0a9-e50e24dcca9e", // Phone -> Pico writes
};

const MAX_RECEIVE_BUFFER_BYTES = 4 * 1024;
const REQUIRED_FIELDS = ["GSR", "TEMP", "HR", "SPO2"];

function parseInteger(value, field, { min = 0 } = {}) {
  if (!/^\d+$/.test(value)) throw new Error(`${field} must be a non-negative integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min) throw new Error(`${field} is out of range`);
  return parsed;
}

function parseKabheatPacket(rawString) {
  const line = rawString.trim();
  if (!line) throw new Error("Empty packet");

  const fields = new Map();
  for (const part of line.split(",")) {
    const separator = part.indexOf(":");
    if (separator < 1) throw new Error(`Invalid field: ${part}`);
    fields.set(part.slice(0, separator).trim().toUpperCase(), part.slice(separator + 1).trim());
  }

  const missing = REQUIRED_FIELDS.filter((field) => !fields.has(field));
  if (missing.length) throw new Error(`Missing required field(s): ${missing.join(", ")}`);

  const gsr = parseInteger(fields.get("GSR"), "GSR");
  const tempValue = fields.get("TEMP");
  const heartRate = parseInteger(fields.get("HR"), "HR");
  const spO2 = parseInteger(fields.get("SPO2"), "SPO2");
  const telemetry = {
    gsr,
    bodyTemp: tempValue.toUpperCase() === "NA" ? null : Number(tempValue),
    heartRate: heartRate || null,
    spO2: spO2 || null,
  };

  if (telemetry.bodyTemp !== null && !Number.isFinite(telemetry.bodyTemp)) {
    throw new Error("TEMP must be a number or NA");
  }

  return telemetry;
}

/** Parses a newline-delimited Pico packet into the app's telemetry shape. */
export function parsePicoBioSensorPayload(rawString) {
  try {
    return parseKabheatPacket(rawString);
  } catch {
    return {};
  }
}

/**
 * NUS notifications are a byte stream, not messages. This small framer is
 * exported so its packet handling can be checked without a BLE peripheral.
 */
export class KabheatPacketFramer {
  constructor(maxBufferSize = MAX_RECEIVE_BUFFER_BYTES) {
    this.maxBufferSize = maxBufferSize;
    this.buffer = "";
  }

  reset() {
    this.buffer = "";
  }

  push(chunk) {
    this.buffer += chunk;
    if (this.buffer.length > this.maxBufferSize) {
      this.reset();
      return [{ error: `Receive buffer exceeded ${this.maxBufferSize} bytes` }];
    }

    const results = [];
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop();
    for (const line of lines) this.#process(line, results);

    // Compatibility/debug fallback: only parse a non-newline buffer once all
    // required fields are present and the entire buffer validates.
    if (REQUIRED_FIELDS.every((field) => this.buffer.toUpperCase().includes(`${field}:`))) {
      try {
        const telemetry = parseKabheatPacket(this.buffer);
        results.push({ rawPacket: this.buffer.trim(), telemetry });
        this.reset();
      } catch {
        // It may still be an incomplete packet; wait for another notification.
      }
    }
    return results;
  }

  #process(line, results) {
    const rawPacket = line.replace(/\r$/, "").trim();
    if (!rawPacket) return;
    try {
      results.push({ rawPacket, telemetry: parseKabheatPacket(rawPacket) });
    } catch (error) {
      results.push({ rawPacket, error: error.message });
    }
  }
}

class BLEHardwareManager {
  constructor() {
    this.deviceId = null;
    this.deviceName = null;
    this.isConnected = false;
    this.notificationsActive = false;
    this.initialized = false;
    this.initializePromise = null;
    this.connectPromise = null;
    this.onTelemetryUpdate = null;
    this.listeners = new Set();
    this.decoder = new TextDecoder("utf-8");
    this.framer = new KabheatPacketFramer();
    this.diagnostics = this.#newDiagnostics();
  }

  #newDiagnostics() {
    return {
      connected: false,
      deviceId: null,
      deviceName: null,
      notificationCount: 0,
      completePacketCount: 0,
      packetCount: 0,
      malformedPacketCount: 0,
      lastNotificationAt: null,
      lastPacketAt: null,
      lastDecodedChunk: "",
      lastRawPacket: "",
      lastParsedTelemetry: null,
      lastParseError: null,
      lastTransportError: null,
      mtu: null,
    };
  }

  getDiagnostics() {
    return { ...this.diagnostics };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getDiagnostics());
    return () => this.listeners.delete(listener);
  }

  #publish() {
    const snapshot = this.getDiagnostics();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  #resetSession() {
    this.framer.reset();
    this.decoder = new TextDecoder("utf-8");
    this.diagnostics = this.#newDiagnostics();
  }

  async #initialize() {
    if (this.initialized) return;
    if (!this.initializePromise) {
      this.initializePromise = BleClient.initialize({ androidNeverForLocation: true })
        .then(() => { this.initialized = true; })
        .finally(() => { this.initializePromise = null; });
    }
    return this.initializePromise;
  }

  async connectBLE(onTelemetryCallback) {
    this.onTelemetryUpdate = onTelemetryCallback;
    if (this.isConnected && this.deviceId) {
      return { deviceName: this.deviceName, deviceId: this.deviceId, connected: true };
    }
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = this.#connect();
    try {
      return await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  async #connect() {
    try {
      await this.#initialize();
      this.#resetSession();
      this.#publish();

      const device = await BleClient.requestDevice({
        services: [GATT_SERVICES.NORDIC_UART_SERVICE],
      });
      this.deviceId = device.deviceId;
      this.deviceName = device.name || "Kabheat Hardware";

      await BleClient.connect(this.deviceId, (id) => this.onDisconnected(id));
      this.isConnected = true;
      Object.assign(this.diagnostics, {
        connected: true,
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      });
      this.#publish();

      // bluetooth-le 8.2 exposes getMtu, but not an MTU request API. Record
      // the negotiated MTU when available; communication never depends on it.
      try {
        this.diagnostics.mtu = await BleClient.getMtu(this.deviceId);
      } catch (error) {
        console.debug("[BLE] MTU unavailable", error);
      }

      this.notificationsActive = true;
      await BleClient.startNotifications(
        this.deviceId,
        GATT_SERVICES.NORDIC_UART_SERVICE,
        GATT_CHARACTERISTICS.NORDIC_TX,
        (value) => this.#onNotification(value),
      );
      this.#publish();

      return { deviceName: this.deviceName, deviceId: this.deviceId, connected: true };
    } catch (error) {
      const deviceId = this.deviceId;
      this.diagnostics.lastTransportError = error.message || String(error);
      await this.#clearConnection();
      if (deviceId) {
        try {
          await BleClient.disconnect(deviceId);
        } catch (disconnectError) {
          console.debug("[BLE] failed connection cleanup", disconnectError);
        }
      }
      console.warn("[BLE] connection failed", error);
      throw error;
    }
  }

  #onNotification(value) {
    if (!this.isConnected || !this.notificationsActive) return;
    try {
      const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      const chunk = this.decoder.decode(bytes, { stream: true });
      this.diagnostics.notificationCount += 1;
      this.diagnostics.lastNotificationAt = Date.now();
      this.diagnostics.lastDecodedChunk = chunk;
      console.debug("[BLE] notification", chunk);

      for (const result of this.framer.push(chunk)) {
        if (result.error && !result.rawPacket) {
          this.diagnostics.lastTransportError = result.error;
          console.warn("[BLE] transport", result.error);
          continue;
        }
        this.diagnostics.completePacketCount += 1;
        this.diagnostics.lastPacketAt = Date.now();
        this.diagnostics.lastRawPacket = result.rawPacket;
        console.debug("[BLE] packet", result.rawPacket);

        if (result.error) {
          this.diagnostics.malformedPacketCount += 1;
          this.diagnostics.lastParseError = result.error;
          console.warn("[BLE] malformed packet", result.error, result.rawPacket);
          continue;
        }

        this.diagnostics.packetCount += 1;
        this.diagnostics.lastParsedTelemetry = result.telemetry;
        console.debug("[BLE] parsed", result.telemetry);
        this.onTelemetryUpdate?.(result.telemetry, result.rawPacket);
      }
    } catch (error) {
      this.diagnostics.lastTransportError = error.message || String(error);
      console.warn("[BLE] notification handling failed", error);
    } finally {
      this.#publish();
    }
  }

  async #clearConnection() {
    const deviceId = this.deviceId;
    const wasSubscribed = this.notificationsActive;
    // Clear shared state before awaiting native cleanup so a late callback from
    // a former connection cannot affect a new pairing attempt.
    this.notificationsActive = false;
    this.isConnected = false;
    this.deviceId = null;
    this.deviceName = null;
    this.framer.reset();
    this.decoder = new TextDecoder("utf-8");
    Object.assign(this.diagnostics, { connected: false, deviceId: null, deviceName: null });
    this.#publish();

    if (wasSubscribed && deviceId) {
      try {
        await BleClient.stopNotifications(deviceId, GATT_SERVICES.NORDIC_UART_SERVICE, GATT_CHARACTERISTICS.NORDIC_TX);
      } catch (error) {
        console.debug("[BLE] stop notifications", error);
      }
    }
  }

  async disconnect() {
    const deviceId = this.deviceId;
    await this.#clearConnection();
    if (deviceId) {
      try {
        await BleClient.disconnect(deviceId);
      } catch (error) {
        console.debug("[BLE] disconnect", error);
      }
    }
  }

  onDisconnected(deviceId) {
    if (deviceId !== this.deviceId) return;
    this.diagnostics.lastTransportError = "Device disconnected";
    this.#clearConnection();
    console.debug("[BLE] device disconnected", deviceId);
  }
}

export const bleHardwareManager = new BLEHardwareManager();
