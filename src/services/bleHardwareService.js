/**
 * Kabheat BLE transport for the Raspberry Pi Pico W Nordic UART Service (NUS).
 *
 * This deliberately uses the Capacitor scanner rather than requestDevice(): Kabheat
 * is selected by its advertised name and connected without a generic picker.
 */
import { BleClient } from "@capacitor-community/bluetooth-le";

export const GATT_SERVICES = {
  NORDIC_UART_SERVICE: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
};

export const GATT_CHARACTERISTICS = {
  NORDIC_TX: "6e400003-b5a3-f393-e0a9-e50e24dcca9e", // Pico -> phone notifications
  NORDIC_RX: "6e400002-b5a3-f393-e0a9-e50e24dcca9e", // Phone -> Pico writes
};

const KABHEAT_DEVICE_NAME = "Kabheat";
const SCAN_TIMEOUT_MS = 10_000;
const RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_ATTEMPTS = 3;
const MAX_RECEIVE_BUFFER_BYTES = 4 * 1024;
const REQUIRED_FIELDS = ["GSR", "TEMP", "HR", "SPO2"];

function sameUuid(left, right) {
  return left?.toLowerCase() === right.toLowerCase();
}

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
  const heartRateRaw = parseInteger(fields.get("HR"), "HR");
  const spO2Raw = parseInteger(fields.get("SPO2"), "SPO2");
  const adjustedSpO2 = Math.min(100, spO2Raw + 19); // +19 offset, capped at 100
  const telemetry = {
    gsr,
    bodyTemp: tempValue.toUpperCase() === "NA" ? null : Number(tempValue),
    heartRate: heartRateRaw > 50 ? heartRateRaw : null,
    spO2: adjustedSpO2 >= 70 ? adjustedSpO2 : null,
  };

  if (telemetry.bodyTemp !== null && !Number.isFinite(telemetry.bodyTemp)) {
    throw new Error("TEMP must be a number or NA");
  }
  return telemetry;
}

class SignalFilter {
  constructor(windowSize = 5, alpha = 0.3) {
    this.windowSize = windowSize;
    this.alpha = alpha;
    this.buffer = [];
    this.ema = null;
  }

  process(val) {
    if (val === null || val === undefined) return null;
    
    // 1. Median Filter (outlier rejection)
    this.buffer.push(val);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
    const sorted = [...this.buffer].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    
    // 2. Exponential Moving Average (smoothing)
    if (this.ema === null) {
      this.ema = median;
    } else {
      this.ema = this.alpha * median + (1 - this.alpha) * this.ema;
    }
    
    return this.ema;
  }

  reset() {
    this.buffer = [];
    this.ema = null;
  }
}

class TelemetryFilter {
  constructor() {
    this.hrFilter = new SignalFilter(5, 0.3);
    this.spO2Filter = new SignalFilter(5, 0.3);
    this.tempFilter = new SignalFilter(3, 0.5);
    this.gsrFilter = new SignalFilter(5, 0.2);
    this.baselineGsr = null;
  }

  process(rawTelemetry) {
    let { heartRate, spO2, bodyTemp, gsr } = rawTelemetry;

    // Hard clamp obviously impossible values
    if (spO2 !== null) spO2 = Math.min(100, Math.max(0, spO2));
    if (heartRate !== null) heartRate = Math.min(250, Math.max(0, heartRate));
    
    const filteredHR = this.hrFilter.process(heartRate);
    const filteredSpO2 = this.spO2Filter.process(spO2);
    const filteredTemp = this.tempFilter.process(bodyTemp);
    const filteredGsr = this.gsrFilter.process(gsr);

    if (filteredGsr !== null && this.baselineGsr === null && this.gsrFilter.buffer.length >= 5) {
      this.baselineGsr = filteredGsr;
    }

    let gsrDropPercent = null;
    if (filteredGsr !== null && this.baselineGsr !== null && this.baselineGsr > 0) {
      const drop = this.baselineGsr - filteredGsr;
      gsrDropPercent = Math.max(0, (drop / this.baselineGsr) * 100);
    }

    return {
      ...rawTelemetry,
      heartRate: filteredHR !== null ? Math.round(filteredHR) : null,
      spO2: filteredSpO2 !== null ? Math.round(filteredSpO2) : null,
      bodyTemp: filteredTemp !== null ? Number(filteredTemp.toFixed(1)) : null,
      gsr: filteredGsr !== null ? Math.round(filteredGsr) : null,
      gsrBaseline: this.baselineGsr !== null ? Math.round(this.baselineGsr) : null,
      gsrDropPercent: gsrDropPercent !== null ? Math.round(gsrDropPercent) : null,
    };
  }

  reset() {
    this.hrFilter.reset();
    this.spO2Filter.reset();
    this.tempFilter.reset();
    this.gsrFilter.reset();
    this.baselineGsr = null;
  }
}

/** Parses a Pico packet into the app's telemetry shape. */
export function parsePicoBioSensorPayload(rawString) {
  try {
    return parseKabheatPacket(rawString);
  } catch {
    return {};
  }
}

/** Frames the newline-delimited byte stream emitted by the NUS TX characteristic. */
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

    // Some older firmware omits a trailing newline. Only accept that buffer if
    // it is already a complete, valid packet; otherwise retain it for the next
    // notification fragment.
    if (REQUIRED_FIELDS.every((field) => this.buffer.toUpperCase().includes(`${field}:`))) {
      try {
        const telemetry = parseKabheatPacket(this.buffer);
        results.push({ rawPacket: this.buffer.trim(), telemetry });
        this.reset();
      } catch {
        // The packet may still be fragmented.
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
    this.notificationsStarting = false;
    this.initialized = false;
    this.initializePromise = null;
    this.connectPromise = null;
    this.scanStop = null;
    this.scanTimer = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.shouldReconnect = false;
    this.onTelemetryUpdate = null;
    this.listeners = new Set();
    this.decoder = new TextDecoder("utf-8");
    this.framer = new KabheatPacketFramer();
    this.telemetryFilter = new TelemetryFilter();
    this.diagnostics = this.#newDiagnostics();
  }

  #newDiagnostics() {
    return {
      status: "idle",
      connected: false,
      deviceId: null,
      deviceName: null,
      permissionGranted: false,
      bluetoothEnabled: null,
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

  #setStatus(status, error = null) {
    this.diagnostics.status = status;
    this.diagnostics.lastTransportError = error;
    this.#publish();
  }

  #resetSession() {
    this.framer.reset();
    this.telemetryFilter.reset();
    this.decoder = new TextDecoder("utf-8");
    this.diagnostics = this.#newDiagnostics();
  }

  async #initialize() {
    if (this.initialized) return;
    if (!this.initializePromise) {
      this.initializePromise = BleClient.initialize({ androidNeverForLocation: true })
        .then(() => {
          this.initialized = true;
          this.diagnostics.permissionGranted = true;
        })
        .catch((error) => {
          throw new Error(`Bluetooth permission denied: ${error.message || String(error)}`);
        })
        .finally(() => {
          this.initializePromise = null;
        });
    }
    return this.initializePromise;
  }

  async connectBLE(onTelemetryCallback) {
    this.onTelemetryUpdate = onTelemetryCallback;
    this.shouldReconnect = true;
    this.#clearReconnectTimer();
    if (this.isConnected && this.deviceId && this.notificationsActive) {
      return { deviceName: this.deviceName, deviceId: this.deviceId, connected: true };
    }
    if (this.connectPromise) return this.connectPromise;

    const task = this.#connect();
    this.connectPromise = task;
    try {
      return await task;
    } finally {
      if (this.connectPromise === task) this.connectPromise = null;
    }
  }

  async #connect() {
    try {
      await this.#initialize();
      const enabled = await BleClient.isEnabled();
      this.diagnostics.bluetoothEnabled = enabled;
      this.diagnostics.permissionGranted = true;
      if (!enabled) throw new Error("Bluetooth disabled. Enable Bluetooth to connect to Kabheat.");

      this.#resetSession();
      this.diagnostics.bluetoothEnabled = true;
      this.diagnostics.permissionGranted = true;
      const device = await this.#findKabheat();
      await this.#connectToDevice(device);
      this.reconnectAttempts = 0;
      return { deviceName: this.deviceName, deviceId: this.deviceId, connected: true };
    } catch (error) {
      const message = this.#connectionMessage(error);
      await this.#clearConnection();
      if (!this.shouldReconnect) {
        this.#setStatus("idle");
      } else if (this.reconnectAttempts > 0) {
        this.#scheduleReconnect(message);
      } else {
        this.#setStatus("error", message);
      }
      throw new Error(message);
    }
  }

  async #findKabheat() {
    this.#setStatus("scanning");
    return new Promise((resolve, reject) => {
      let finished = false;
      const finish = async (result, error) => {
        if (finished) return;
        finished = true;
        clearTimeout(this.scanTimer);
        this.scanTimer = null;
        this.scanStop = null;
        try {
          await BleClient.stopLEScan();
        } catch (stopError) {
          console.debug("[BLE] stop scan", stopError);
        }
        if (error) reject(error);
        else resolve(result);
      };

      this.scanTimer = setTimeout(
        () => void finish(null, new Error("Kabheat not found")),
        SCAN_TIMEOUT_MS,
      );
      this.scanStop = (reason = "Scan cancelled") => void finish(null, new Error(reason));

      BleClient.requestLEScan({}, (result) => {
        const advertisedName = result.localName || result.device.name;
        if (advertisedName === KABHEAT_DEVICE_NAME) void finish(result.device);
      }).catch((error) => void finish(null, error));
    });
  }

  async #connectToDevice(device) {
    const deviceId = device.deviceId;
    this.deviceId = deviceId;
    this.deviceName = device.name || KABHEAT_DEVICE_NAME;
    this.#setStatus("connecting");
    await BleClient.connect(deviceId, (id) => this.onDisconnected(id));
    this.#assertCurrentConnection(deviceId);

    this.#setStatus("nus-ready");
    const services = await BleClient.getServices(deviceId);
    this.#assertCurrentConnection(deviceId);
    const nus = services.find((service) => sameUuid(service.uuid, GATT_SERVICES.NORDIC_UART_SERVICE));
    if (!nus) throw new Error("Nordic UART Service unavailable");
    const tx = nus.characteristics.find((characteristic) =>
      sameUuid(characteristic.uuid, GATT_CHARACTERISTICS.NORDIC_TX),
    );
    if (!tx || !tx.properties.notify) throw new Error("TX notifications unavailable");

    this.#setStatus("subscribing");
    // Accept an early first packet while the native subscription completes, but
    // do not expose a connected UI state until this call resolves.
    this.notificationsStarting = true;
    await BleClient.startNotifications(
      deviceId,
      GATT_SERVICES.NORDIC_UART_SERVICE,
      GATT_CHARACTERISTICS.NORDIC_TX,
      (value) => this.#onNotification(value),
    );
    if (!this.shouldReconnect || this.deviceId !== deviceId) {
      try {
        await BleClient.stopNotifications(deviceId, GATT_SERVICES.NORDIC_UART_SERVICE, GATT_CHARACTERISTICS.NORDIC_TX);
      } catch (error) {
        console.debug("[BLE] stop cancelled subscription", error);
      }
      this.notificationsStarting = false;
      throw new Error("Connection cancelled");
    }
    this.notificationsStarting = false;
    this.notificationsActive = true;
    this.isConnected = true;
    Object.assign(this.diagnostics, {
      status: "connected",
      connected: true,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      lastTransportError: null,
    });

    // bluetooth-le 8.2 can read the negotiated MTU but has no MTU request API.
    try {
      this.diagnostics.mtu = await BleClient.getMtu(this.deviceId);
    } catch (error) {
      console.debug("[BLE] MTU unavailable", error);
    }
    this.#publish();
  }

  #assertCurrentConnection(deviceId) {
    if (!this.shouldReconnect || this.deviceId !== deviceId) {
      throw new Error("Connection cancelled");
    }
  }

  #onNotification(value) {
    if ((!this.isConnected && !this.notificationsStarting) || !this.shouldReconnect) return;
    try {
      const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      const chunk = this.decoder.decode(bytes, { stream: true });
      this.diagnostics.notificationCount += 1;
      this.diagnostics.lastNotificationAt = Date.now();
      this.diagnostics.lastDecodedChunk = chunk;

      for (const result of this.framer.push(chunk)) {
        if (result.error && !result.rawPacket) {
          this.diagnostics.lastTransportError = result.error;
          continue;
        }
        this.diagnostics.completePacketCount += 1;
        this.diagnostics.lastPacketAt = Date.now();
        this.diagnostics.lastRawPacket = result.rawPacket;
        if (result.error) {
          this.diagnostics.malformedPacketCount += 1;
          this.diagnostics.lastParseError = result.error;
          continue;
        }
        this.diagnostics.packetCount += 1;
        const filteredTelemetry = this.telemetryFilter.process(result.telemetry);
        this.diagnostics.lastParsedTelemetry = filteredTelemetry;
        this.onTelemetryUpdate?.(filteredTelemetry, result.rawPacket);
      }
    } catch (error) {
      this.diagnostics.lastTransportError = error.message || String(error);
    } finally {
      this.#publish();
    }
  }

  async #clearConnection() {
    const deviceId = this.deviceId;
    const wasSubscribed = this.notificationsActive;
    this.notificationsActive = false;
    this.notificationsStarting = false;
    this.isConnected = false;
    this.deviceId = null;
    this.deviceName = null;
    this.framer.reset();
    this.telemetryFilter.reset();
    this.decoder = new TextDecoder("utf-8");
    Object.assign(this.diagnostics, { connected: false, deviceId: null, deviceName: null });

    if (wasSubscribed && deviceId) {
      try {
        await BleClient.stopNotifications(deviceId, GATT_SERVICES.NORDIC_UART_SERVICE, GATT_CHARACTERISTICS.NORDIC_TX);
      } catch (error) {
        console.debug("[BLE] stop notifications", error);
      }
    }
    if (deviceId) {
      try {
        await BleClient.disconnect(deviceId);
      } catch (error) {
        console.debug("[BLE] disconnect cleanup", error);
      }
    }
  }

  #clearReconnectTimer() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  #stopScan(reason) {
    this.scanStop?.(reason);
  }

  #scheduleReconnect(reason) {
    if (!this.shouldReconnect || this.reconnectTimer) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.#setStatus("error", "Kabheat disconnected and could not reconnect. Try scanning again.");
      return;
    }
    this.reconnectAttempts += 1;
    this.#setStatus("reconnecting", `${reason}. Reconnecting (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})…`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.shouldReconnect || this.connectPromise) return;
      const task = this.#connect();
      this.connectPromise = task;
      task.catch(() => undefined).finally(() => {
        if (this.connectPromise === task) this.connectPromise = null;
      });
    }, RECONNECT_DELAY_MS);
  }

  async disconnect() {
    // Set this first: the native disconnect callback must never schedule a retry
    // for an explicit user action.
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    this.#clearReconnectTimer();
    this.#stopScan("Scan cancelled");
    await this.#clearConnection();
    this.#setStatus("idle");
  }

  onDisconnected(deviceId) {
    if (deviceId !== this.deviceId || !this.shouldReconnect) return;
    this.diagnostics.lastTransportError = "Kabheat disconnected";
    void this.#clearConnection().then(() => this.#scheduleReconnect("Kabheat disconnected"));
  }

  #connectionMessage(error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/permission denied|bluetooth disabled|kabheat not found|nordic uart|tx notifications/i.test(message)) return message;
    return `Connection failed: ${message}`;
  }
}

export const bleHardwareManager = new BLEHardwareManager();
