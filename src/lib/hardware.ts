export type ScannerEvent = { value: string; source: "keyboard" | "camera" | "serial" };

export function isBluetoothSupported() {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function isSerialSupported() {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

export function isSecureHardwareContext() {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function createEscPosText(text: string) {
  const encoder = new TextEncoder();
  return encoder.encode(text.replace(/\r?\n/g, "\r\n") + "\r\n");
}

export async function connectBluetoothPrinter() {
  if (!isBluetoothSupported()) throw new Error("Web Bluetooth is not available in this browser. Use Chrome or Edge on a supported device.");
  if (!isSecureHardwareContext()) throw new Error("Bluetooth hardware access requires HTTPS.");
  const bluetooth = (navigator as Navigator & { bluetooth: any }).bluetooth;
  const device = await bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ["0000ffe0-0000-1000-8000-00805f9b34fb", "000018f0-0000-1000-8000-00805f9b34fb"] });
  if (!device?.gatt) throw new Error("This Bluetooth device does not expose a BLE GATT connection. For a Bluetooth Classic receipt printer, use the Serial connection option instead.");
  const server = await device.gatt.connect();
  const services = await server.getPrimaryServices();
  const characteristics: any[] = [];
  for (const service of services) for (const characteristic of await service.getCharacteristics()) characteristics.push(characteristic);
  const writable = characteristics.find((c) => c.properties?.writeWithoutResponse) ?? characteristics.find((c) => c.properties?.write);
  if (!writable) throw new Error("The selected Bluetooth device connected, but no writable printer characteristic was found.");
  return { device, server, writable };
}

export async function connectSerialDevice() {
  if (!isSerialSupported()) throw new Error("Web Serial is not available in this browser. Use a recent Chrome or Edge desktop browser.");
  if (!isSecureHardwareContext()) throw new Error("Serial hardware access requires HTTPS.");
  const serial = (navigator as Navigator & { serial: any }).serial;
  const port = await serial.requestPort();
  if (!port) throw new Error("No serial device was selected.");
  await port.open({ baudRate: 9600 });
  return port;
}

export async function writeBluetoothPrinter(characteristic: any, bytes: Uint8Array) {
  if (!characteristic) throw new Error("No writable Bluetooth printer characteristic was found.");
  if (characteristic.properties?.writeWithoutResponse && typeof characteristic.writeValueWithoutResponse === "function") return characteristic.writeValueWithoutResponse(bytes);
  if (characteristic.properties?.write && typeof characteristic.writeValueWithResponse === "function") return characteristic.writeValueWithResponse(bytes);
  throw new Error("The selected Bluetooth device cannot accept writes.");
}

export async function writeSerialDevice(port: any, bytes: Uint8Array) {
  if (!port?.writable) throw new Error("The serial printer is not connected.");
  const writer = port.writable.getWriter();
  try { await writer.write(bytes); } finally { writer.releaseLock(); }
}

/** Detect USB/Bluetooth keyboard-wedge scanners without treating normal typing as a scan. */
export function startKeyboardScanner(onScan: (event: ScannerEvent) => void) {
  let buffer = "";
  let firstAt = 0;
  let lastAt = 0;
  let maxGap = 0;
  let startedInEditable = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const reset = () => { buffer = ""; firstAt = 0; lastAt = 0; maxGap = 0; startedInEditable = false; if (timer) clearTimeout(timer); timer = undefined; };
  const handler = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const isEditable = Boolean(target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable);
    const now = performance.now();
    if (event.key === "Enter" || event.key === "Tab") {
      const duration = firstAt ? now - firstAt : Infinity;
      const looksLikeScanner = buffer.length >= 4 && duration <= 450 && maxGap <= 55;
      if (looksLikeScanner) {
        event.preventDefault();
        onScan({ value: buffer.trim(), source: "keyboard" });
      }
      reset();
      return;
    }
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!firstAt) { firstAt = now; startedInEditable = isEditable; }
    if (lastAt) maxGap = Math.max(maxGap, now - lastAt);
    lastAt = now;
    buffer += event.key;
    if (buffer.length > 96) { reset(); return; }
    if (timer) clearTimeout(timer);
    timer = setTimeout(reset, 220);
    // When a scanner is used while the search field is focused, the burst is
    // still captured because scanners are much faster than ordinary typing.
    void startedInEditable;
  };
  window.addEventListener("keydown", handler, true);
  return () => { reset(); window.removeEventListener("keydown", handler, true); };
}
