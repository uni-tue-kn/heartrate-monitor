import { EventEmitter, Injectable } from '@angular/core';
import { BluetoothService } from '../bluetooth/bluetooth.service';
const CHARACTERISTIC_NAME_ECG = 0x2A37;//heart rate measurement
const CHARACTERISTIC_NAME_BATTERY = 0x2A19;//battery level
const SERVICE_NAME_ECG = 0x180D; //heart rate
const SERVICE_NAME_BATTERY = 0x180F;//battery service

@Injectable({
  providedIn: 'root'
})
export class BluetoothEcgService {

  /**
   * Emits device identities of disconnected bluetooth devices.
   */
  readonly disconnected = new EventEmitter<string>();

  /**
   * Mapping of bluetooth device identities to connected bluetooth device.
   */
  private readonly _connectedDevices: { [id: string]: BluetoothDevice } = {};
  private addDevice(device: BluetoothDevice) {
    this._connectedDevices[device.id] = device;
  }
  private removeDevice(deviceId: string) {
    if (deviceId in this._connectedDevices) {
      delete this._connectedDevices[deviceId];
    }
  }

  /**
   * Mapping of bluetooth device identities to related GATT servers.
   */
  private readonly _connectedServers: { [id: string]: BluetoothRemoteGATTServer } = {};
  private addServer(deviceId: string, server: BluetoothRemoteGATTServer) {
    this._connectedServers[deviceId] = server;
  }
  private removeServer(deviceId: string) {
    if (deviceId in this._connectedServers) {
      delete this._connectedServers[deviceId];
    }
  }

  constructor(
    private readonly bluetooth: BluetoothService,
  ) { }

  private async requestDevice(options?: RequestEcgDeviceOptions): Promise<BluetoothDevice> {
    const ecgOptions: RequestEcgDeviceOptions = options ?? {
      filters: [],
    };
    if (!ecgOptions.optionalServices) {
      ecgOptions.optionalServices = [];
    }
    ecgOptions.optionalServices.push(...[
      0x1801,
      SERVICE_NAME_BATTERY,
      SERVICE_NAME_ECG
    ]);
    const device = await this.bluetooth.requestDevice(ecgOptions);
    const onDisconnect = () => {
      device.removeEventListener('gattserverdisconnected', onDisconnect);
      this.removeDevice(device.id);
      this.disconnected.emit(device.id);
    };
    device.addEventListener('gattserverdisconnected', onDisconnect);
    this.addDevice(device);
  }

  private async connectGattServer(device: BluetoothDevice): Promise<BluetoothRemoteGATTServer> {
    const server = await this.bluetooth.connectGattServer(device);
    const onDisconnect = () => {
      device.removeEventListener('gattserverdisconnected', onDisconnect);
      this.removeServer(device.id);
    };
    device.addEventListener('gattserverdisconnected', onDisconnect);
    this.addServer(device.id, server);
    return server;
  }

  async connect(callback: (data: { rr: number, t: Date }) => void, options?: RequestEcgDeviceOptions): Promise<void> {
    const device = await this.requestDevice(options);
    const server = await this.connectGattServer(device);
    const service = await server.getPrimaryService(SERVICE_NAME_ECG);
    service.addEventListener('')
  }
}

export interface RequestEcgDeviceOptions {
  filters: BluetoothLEScanFilter[];
  optionalServices?: BluetoothServiceUUID[] | undefined;
  optionalManufacturerData?: number[] | undefined;
};
