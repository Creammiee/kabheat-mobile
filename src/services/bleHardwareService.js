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
const CONNECT_TIMEOUT_MS = 10_000;
const NOTIFICATION_TIMEOUT_MS = 5_000;
const RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_ATTEMPTS = 3;
const MAX_RECEIVE_BUFFER_BYTES = 4 * 1024;
const REQUIRED_FIELDS = ["GSR", "TEMP1", "TEMP2", "HR1", "SPO21", "HR2", "SPO22"];

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
    if (separator < 1) continue;
    fields.set(part.slice(0, separator).trim().toUpperCase(), part.slice(separator + 1).trim());
  }

  const telemetry = { gsr: undefined, bodyTemp: undefined, bodyTemp2: undefined, heartRate: undefined, heartRate2: undefined, spO2: undefined, spO22: undefined };

  if (fields.has("GSR")) {
    try {
      const rawGsr = parseInteger(fields.get("GSR"), "GSR");
      // Raw ADC from Pico — spec: ADC = µS × 1,000, no inversion needed
      telemetry.gsr = rawGsr > 0 ? rawGsr : null;
    } catch {}
  }

  if (fields.has("TEMP1")) {
    const val = fields.get("TEMP1");
    telemetry.bodyTemp = val.toUpperCase() === "NA" ? null : Number(val);
    if (!Number.isFinite(telemetry.bodyTemp) && telemetry.bodyTemp !== null) telemetry.bodyTemp = undefined;
  }

  if (fields.has("TEMP2")) {
    const val = fields.get("TEMP2");
    telemetry.bodyTemp2 = val.toUpperCase() === "NA" ? null : Number(val);
    if (!Number.isFinite(telemetry.bodyTemp2) && telemetry.bodyTemp2 !== null) telemetry.bodyTemp2 = undefined;
  }

  if (fields.has("HR1")) {
    try { const r = parseInteger(fields.get("HR1"), "HR1"); telemetry.heartRate = r > 0 ? r : null; } catch {}
  }
  if (fields.has("HR2")) {
    try { const r = parseInteger(fields.get("HR2"), "HR2"); telemetry.heartRate2 = r > 0 ? r : null; } catch {}
  }
  if (fields.has("SPO21")) {
    try { const r = parseInteger(fields.get("SPO21"), "SPO21"); telemetry.spO2 = r > 0 ? r : null; } catch {}
  }
  if (fields.has("SPO22")) {
    try { const r = parseInteger(fields.get("SPO22"), "SPO22"); telemetry.spO22 = r > 0 ? r : null; } catch {}
  }

  if (!Object.values(telemetry).some((v) => v !== undefined)) {
    throw new Error("No valid fields found in packet");
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
    if (val === undefined) return this.ema;
    if (val === null) {
      this.ema = null;
      this.buffer = [];
      return null;
    }
    
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

    this.hr2Filter = new SignalFilter(5, 0.3);
    this.spO22Filter = new SignalFilter(5, 0.3);
    this.temp2Filter = new SignalFilter(3, 0.5);

    this.gsrFilter = new SignalFilter(5, 0.2);
    this.baselineGsr = null;
  }

  process(rawTelemetry) {
    // Sanitize: treat undefined/NaN as null so a single bad packet
    // cannot poison the EMA filter state permanently
    const safe = (v) => (v == null || (typeof v === "number" && !isFinite(v))) ? null : v;

    let heartRate  = safe(rawTelemetry.heartRate);
    let heartRate2 = safe(rawTelemetry.heartRate2);
    let spO2       = safe(rawTelemetry.spO2);
    let spO22      = safe(rawTelemetry.spO22);
    let bodyTemp   = safe(rawTelemetry.bodyTemp);
    let bodyTemp2  = safe(rawTelemetry.bodyTemp2);
    let gsr        = safe(rawTelemetry.gsr);

    // Hard clamp obviously impossible values
    if (spO2    !== null) spO2     = Math.min(100, Math.max(0, spO2));
    if (spO22   !== null) spO22    = Math.min(100, Math.max(0, spO22));
    if (heartRate  !== null) heartRate  = Math.min(250, Math.max(0, heartRate));
    if (heartRate2 !== null) heartRate2 = Math.min(250, Math.max(0, heartRate2));

    const filteredHR    = this.hrFilter.process(heartRate);
    const filteredSpO2  = this.spO2Filter.process(spO2);
    const filteredTemp  = this.tempFilter.process(bodyTemp);

    const filteredHR2   = this.hr2Filter.process(heartRate2);
    const filteredSpO22 = this.spO22Filter.process(spO22);
    const filteredTemp2 = this.temp2Filter.process(bodyTemp2);

    const filteredGsr   = this.gsrFilter.process(gsr);

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
      
      heartRate2: filteredHR2 !== null ? Math.round(filteredHR2) : null,
      spO22: filteredSpO22 !== null ? Math.round(filteredSpO22) : null,
      bodyTemp2: filteredTemp2 !== null ? Number(filteredTemp2.toFixed(1)) : null,

      gsr: filteredGsr !== null ? Math.round(filteredGsr) : null,
      gsrBaseline: this.baselineGsr !== null ? Math.round(this.baselineGsr) : null,
      gsrDropPercent: gsrDropPercent !== null ? Math.round(gsrDropPercent) : null,
    };
  }

  reset() {
    this.hrFilter.reset();
    this.spO2Filter.reset();
    this.tempFilter.reset();
    this.hr2Filter.reset();
    this.spO22Filter.reset();
    this.temp2Filter.reset();
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
    this.tempOffset = 0;
    this.hrOffset = 0;
  }

  setOffsets(tempOffset, hrOffset) {
    this.tempOffset = tempOffset || 0;
    this.hrOffset = hrOffset || 0;
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
    this.#setStatus("connecting");

    // Android can retain a stale GATT connection after the peripheral or app
    // restarts. Clear it before reconnecting; the plugin explicitly recommends
    // this sequence for devices that have been connected previously.
    try {
      await BleClient.disconnect(deviceId);
    } catch (error) {
      console.debug("[BLE] no stale connection to clear", error);
    }

    if (!this.shouldReconnect) throw new Error("Connection cancelled");

    this.deviceId = deviceId;
    this.deviceName = device.name || KABHEAT_DEVICE_NAME;
    await BleClient.connect(
      deviceId,
      (id) => this.onDisconnected(id),
      { timeout: CONNECT_TIMEOUT_MS },
    );
    this.#assertCurrentConnection(deviceId);

    this.#setStatus("discovering");
    try {
      await BleClient.discoverServices(deviceId);
    } catch (error) {
      // connect() normally performs discovery itself. Continue so getServices()
      // can use that result on platforms where explicit discovery is unavailable.
      console.debug("[BLE] explicit service discovery unavailable", error);
    }

    const services = await BleClient.getServices(deviceId);
    this.#assertCurrentConnection(deviceId);
    const nus = services.find((service) => sameUuid(service.uuid, GATT_SERVICES.NORDIC_UART_SERVICE));
    if (!nus) throw new Error("Nordic UART Service unavailable");
    const tx = nus.characteristics.find((characteristic) =>
      sameUuid(characteristic.uuid, GATT_CHARACTERISTICS.NORDIC_TX),
    );
    if (!tx || !tx.properties.notify) throw new Error("TX notifications unavailable");

    this.#setStatus("nus-ready");
    this.#assertCurrentConnection(deviceId);
    this.#setStatus("subscribing");
    // Accept an early first packet while the native subscription completes, but
    // do not expose a connected UI state until this call resolves.
    this.notificationsStarting = true;
    await BleClient.startNotifications(
      deviceId,
      GATT_SERVICES.NORDIC_UART_SERVICE,
      GATT_CHARACTERISTICS.NORDIC_TX,
      (value) => this.#onNotification(value),
      { timeout: NOTIFICATION_TIMEOUT_MS },
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
        
        // Apply Offsets
        // Use != null (loose) to catch both null AND undefined, preventing NaN propagation
        const t = result.telemetry;
        const telemetryWithOffsets = {
          ...t,
          bodyTemp:  t.bodyTemp  != null && isFinite(t.bodyTemp)  ? t.bodyTemp  + this.tempOffset : (t.bodyTemp  ?? null),
          heartRate: t.heartRate != null && isFinite(t.heartRate) ? t.heartRate + this.hrOffset   : (t.heartRate ?? null),
          bodyTemp2: t.bodyTemp2 != null && isFinite(t.bodyTemp2) ? t.bodyTemp2 + this.tempOffset : (t.bodyTemp2 ?? null),
          heartRate2:t.heartRate2!= null && isFinite(t.heartRate2)? t.heartRate2+ this.hrOffset   : (t.heartRate2?? null),
        };

        const filteredTelemetry = this.telemetryFilter.process(telemetryWithOffsets);
        
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
