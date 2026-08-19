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
  return encoder.encode(text.replace(/\n/g, "\r\n") + "\r\n");
}

export async function connectBluetoothPrinter() {
  if (!isBluetoothSupported()) throw new Error("Web Bluetooth is not available in this browser.");
  if (!isSecureHardwareContext()) throw new Error("Bluetooth hardware access requires HTTPS.");
  const bluetooth = (navigator as Navigator & { bluetooth: any }).bluetooth;
  const device = await bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ["0000ffe0-0000-1000-8000-00805f9b34fb", "000018f0-0000-1000-8000-00805f9b34fb"] });
  const server = await device.gatt?.connect();
  if (!server) throw new Error("The printer did not expose a GATT connection.");
  const services = await server.getPrimaryServices();
  const characteristics: any[] = [];
  for (const service of services) {
    for (const characteristic of await service.getCharacteristics()) characteristics.push(characteristic);
  }
  const writable = characteristics.find((c) => c.properties?.writeWithoutResponse || c.properties?.write);
  return { device, server, writable };
}

export async function connectSerialDevice() {
  if (!isSerialSupported()) throw new Error("Web Serial is not available in this browser.");
  if (!isSecureHardwareContext()) throw new Error("Serial hardware access requires HTTPS.");
  const serial = (navigator as Navigator & { serial: any }).serial;
  const port = await serial.requestPort();
  await port.open({ baudRate: 9600 });
  return port;
}

export async function writeBluetoothPrinter(characteristic: any, bytes: Uint8Array) {
  if (!characteristic) throw new Error("No writable Bluetooth printer characteristic was found.");
  if (characteristic.properties?.writeWithoutResponse) return characteristic.writeValueWithoutResponse(bytes);
  if (characteristic.properties?.write) return characteristic.writeValueWithResponse(bytes);
  throw new Error("The selected Bluetooth device cannot accept writes.");
}

export function startKeyboardScanner(onScan: (event: ScannerEvent) => void) {
  let buffer = "";
  let startedAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const handler = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const isInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
    const now = performance.now();
    if (!startedAt || now - startedAt > 120) { buffer = ""; startedAt = now; }
    if (event.key === "Enter" || event.key === "Tab") {
      if (buffer.length >= 4) { event.preventDefault(); onScan({ value: buffer.trim(), source: "keyboard" }); }
      buffer = ""; startedAt = 0; return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (!isInput || now - startedAt < 80) buffer += event.key;
      clearTimeout(timer); timer = setTimeout(() => { buffer = ""; startedAt = 0; }, 180);
    }
  };
  window.addEventListener("keydown", handler, true);
  return () => { clearTimeout(timer); window.removeEventListener("keydown", handler, true); };
}
