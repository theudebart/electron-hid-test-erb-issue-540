import { contextBridge, ipcRenderer } from 'electron';
import { Device } from './devices';

const electronHandler = {
  getDeviceList: () => ipcRenderer.invoke('getDeviceList') as Promise<Device[]>,
  openDevice: (deviceId: string) =>
    ipcRenderer.invoke('openDevice', deviceId) as Promise<void>,
  closeDevice: (deviceId: string) =>
    ipcRenderer.invoke('closeDevice', deviceId) as Promise<void>,
  registerForUpdateDeviceList: () =>
    ipcRenderer.invoke('registerForUpdateDeviceList'),
  onUpdateDeviceList: (callback: (result: Device[]) => void) =>
    ipcRenderer.on('updateDeviceList', (_event, result) => callback(result)),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
