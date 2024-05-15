import { EventEmitter } from 'node:events';
import HID from 'node-hid';

export interface Device {
  id: string;
  name?: string;
  manufacturer?: string;
  vendorId: number;
  productId: number;
  serialNumber?: string;
  opened: boolean;
}

class DeviceService extends EventEmitter {
  devices: {
    id: string;
    path: string;
    info: {
      name?: string;
      manufacturer?: string;
      vendorId: number;
      productId: number;
      serialNumber?: string;
    };
    opened: boolean;
    paused: boolean;
    hidHandle: HID.HIDAsync | undefined;
  }[] = [];

  constructor() {
    super();
  }

  getShareableDeviceList(): Device[] {
    return this.devices.map((d) => {
      return {
        id: d.id,
        name: d.info.name,
        manufacturer: d.info.manufacturer,
        vendorId: d.info.vendorId,
        productId: d.info.productId,
        serialNumber: d.info.serialNumber,
        opened: d.opened,
      };
    });
  }

  async getDeviceList(): Promise<Device[]> {
    await this.updateDeviceList();
    return this.getShareableDeviceList();
  }

  async updateDeviceList(): Promise<void> {
    const hidResults = await HID.devicesAsync();

    hidResults.forEach((device) => {
      if (
        !this.devices.find((d) => {
          return d.path === device.path;
        })
      ) {
        if (!device.vendorId || !device.productId) return;
        this.devices.push({
          id: [device.vendorId, device.productId, device.serialNumber].join(
            ':'
          ),
          path: device && device.path ? device.path : '',
          info: {
            name: device.product,
            manufacturer: device.manufacturer,
            vendorId: device.vendorId,
            productId: device.productId,
            serialNumber: device.serialNumber,
          },
          opened: false,
          paused: false,
          hidHandle: undefined,
        });
      }
    });
  }

  handleDeviceData(id: string, data: Uint8Array): void {
    console.log(`HID Data from ${id}:`);
    console.log(data);
  }

  handleDeviceError(id: string, error: Error): void {
    console.log(`HID Error from ${id}:`);
    console.log(error);
  }

  async openDevice(id: string): Promise<void> {
    const device = this.devices.find((d) => d.id === id);
    if (!device) {
      throw new Error('Device not found');
    }
    if (device.opened) {
      // Device is already opened
      return undefined;
    }

    const hidHandle = await HID.HIDAsync.open(device.path);

    device.opened = true;
    device.paused = false;
    device.hidHandle = hidHandle;

    //device.hidHandle.setNonBlocking(true);
    device.hidHandle.on('data', (data) => {
      this.handleDeviceData(device.id, data);
    });
    device.hidHandle.on('error', (err) => {
      this.handleDeviceError(device.id, err);
    });

    this.devices = this.devices.map((s) => (s.id === device.id ? device : s));
    this.emit('updateDeviceList', this.getShareableDeviceList());
    return undefined;
  }

  async closeDevice(id: string): Promise<void> {
    const device = this.devices.find((d) => d.id === id);
    if (!device) {
      throw new Error('Device not found');
    }
    if (!device.opened) {
      // Device is already closed
      return undefined;
    }

    try {
      if (device.hidHandle) {
        device.hidHandle.removeAllListeners();
        device.hidHandle.close();
      }
    } catch (error) {
      console.error('HID close error:');
      console.error(error);
    }

    device.opened = false;
    device.paused = false;
    device.hidHandle = undefined;
    this.devices = this.devices.map((s) => (s.id === device.id ? device : s));
    this.emit('updateDeviceList', this.getShareableDeviceList());

    return undefined;
  }

  async pauseDevice(id: string): Promise<void> {
    const device = this.devices.find((d) => d.id === id);
    if (!device) {
      throw new Error('Device not found');
    }
    if (!device.opened || device.paused) {
      // Device is already closed or paused
      return undefined;
    }

    if (device.hidHandle) device.hidHandle.pause();

    device.paused = true;
    this.devices = this.devices.map((s) => (s.id === device.id ? device : s));
    this.emit('updateDeviceList', this.getShareableDeviceList());

    return undefined;
  }

  async resumeDevice(id: string): Promise<void> {
    const device = this.devices.find((d) => d.id === id);
    if (!device) {
      throw new Error('Device not found');
    }
    if (!device.opened || device.paused) {
      // Device is already closed or resumed
      return undefined;
    }

    if (device.hidHandle) device.hidHandle.resume();

    device.paused = false;
    this.devices = this.devices.map((s) => (s.id === device.id ? device : s));
    this.emit('updateDeviceList', this.getShareableDeviceList());

    return undefined;
  }
}

export default DeviceService;
