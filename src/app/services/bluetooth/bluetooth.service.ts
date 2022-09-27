import { EventEmitter, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BluetoothService {

  constructor() { }

  get supported(): boolean {
    return navigator.bluetooth !== undefined;
  }

  /**
   * Emits device identities of disconnected bluetooth devices.
   */
  readonly disconnected = new EventEmitter<string>();

  // Mappings of devices and GATT servers.
  /**
   * Mapping of bluetooth device identities to connected bluetooth device.
   */
  private readonly _connectedDevices: { [id: string]: { device: BluetoothDevice, server: BluetoothRemoteGATTServer } } = {};
  /**
   * Mapping of bluetooth device identities to related GATT servers.
   */
  private readonly _connectedServers: { [id: string]: BluetoothRemoteGATTServer } = {};

  // Management of mappings.
  /**
   * Adds a device to array of connected devices and connected GATT servers.
   * @param device Bluetooth device to add.
   * @param server GATT server to add.
   */
  private addDevice(device: BluetoothDevice, server: BluetoothRemoteGATTServer): void {
    this._connectedDevices[device.id] = device;
    this._connectedServers[device.id] = server;
  }
  /**
   * Checks if a device is in mapping to bluetooth devices and to GATT servers by the device's identities.
   * @param deviceId Identity of bluetooth device.
   * @returns true = contained, false = not contained.
   */
  private containsDevice(deviceId: string): boolean {
    return deviceId in this._connectedDevices && deviceId in this._connectedServers;
  }
  /**
   * Removes a bluetooth device from mapping to servers and devices.
   * @param deviceId Identity of bluetooth device to remove.
   */
  private removeDevice(deviceId: string): void {
    if (deviceId in this._connectedDevices) {
      delete this._connectedDevices[deviceId];
    }
    if (deviceId in this._connectedServers) {
      delete this._connectedServers[deviceId];
    }
  }

  // Management of WebBluetooth API.
  /**
   * Requests connection to a ECG bluetooth device.
   * @returns Selected bluetooth device.
   */
  async requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice> {
    try {
      if (!this.supported) {
        throw 'WebBluetooth API not supported';
      }
      const device = await navigator.bluetooth.requestDevice(options);
      if (!device) {
        throw 'No device selected';
      }
      return device;
    } catch (error) {
      throw `Failed to request device: `+error;
    }
  }
  /**
   * Connects to the GATT server of a bluetooth device.
   * @param device Bluetooth device to connect.
   * @returns Connected GATT server.
   */
  async connectGattServer(device: BluetoothDevice): Promise<BluetoothRemoteGATTServer> {
    try {
      if(!device.gatt) {
        throw 'GATT Server not found!';
      }
      const server = await device.gatt.connect();
      if (!server) {
        throw 'GATT Server not found!';
      }
      return server;
    } catch (error) {
      throw `Failed to connect to GATT Server:`+error;
    }
  }
  /**
   * Gets the ECG GATT service of a GATT server.
   * @param server Bluetooth GATT server to get the service of.
   * @returns ECG GATT service.
   */
  private async getService(server: BluetoothRemoteGATTServer,chooseService : number): Promise<BluetoothRemoteGATTService> {
    try {
      const service = await server.getPrimaryService(chooseService);
      //console.log(service); //for debugging purposes
      if (!service) {
        throw 'Service not found!';
      }
      return service;
    } catch (error) {
      throw `Failed to get Service: `+error;
    }
  }
  /**
   * Gets the ECG GATT characteristic of an ECG GATT service.
   * @param service GATT service to get characteristic of.
   * @returns ECG GATT characteristic.
   */
  private async getCharacteristic(service: BluetoothRemoteGATTService,chooseCharacteristic : number): Promise<BluetoothRemoteGATTCharacteristic> {
    try {
      const characteristic = await service.getCharacteristic(chooseCharacteristic);
      //console.log(characteristic); //for debugging purposes
      if (!characteristic) {
        throw 'characteristic not found!';
      }
      return characteristic;
    } catch (error) {
      throw `Failed to get characteristic: `+error;
    }
  }

  // ECG device API calls.
  /**
   * Connects to a bluetooth ECG device.
   * @param onData Optional callback, called when received data changes.
   * @returns Identity of bluetooth device.
   * @throws Description of failure.
   */
  async connect(onData?: (data: DataView) => any): Promise<string> {
    try {
      //this.debugPrint();
      // Request connection to bluetooth ecg devices.
      const device = await this.requestDevice();
      // Ensure that device is not already connected.
      if (this.containsDevice(device.id)) {
        console.warn('Selected device is already connected');
      }
      // Connect to GATT server.
      const server = await this.connectGattServer(device);
      try {
        //create the services
        const ecgService = await this.getService(server, SERVICE_NAME_ECG);
        // Get the ecg data characteristic.
        const ecgCharacteristic = await this.getCharacteristic(ecgService, CHARACTERISTIC_NAME_ECG);

        var batteryService;
        var batteryCharacteristic;
        try {
          //get the battery service
          batteryService = await this.getService(server, SERVICE_NAME_BATTERY);
          // Get the battery data characteristic.
          batteryCharacteristic = await this.getCharacteristic(batteryService, CHARACTERISTIC_NAME_BATTERY);
        } catch(error) {
          console.log("battery service missing");
          batteryCharacteristic=undefined;
        }
        //formally define the characteristics first, then assign a value(for formal reasons)
        var movementService;
        var accCharacteristic;
        var gyrCharacteristic;
        var magCharacteristic;
        try {
          // Get the movement service
          movementService = await this.getService(server, SERVICE_NAME_MOVEMENT);
          // Get the accelerometer data characteristic
          accCharacteristic = await this.getCharacteristic(movementService, CHARACTERISTIC_NAME_ACC);
          // Get the gyroscope data characteristic
          gyrCharacteristic = await this.getCharacteristic(movementService, CHARACTERISTIC_NAME_GYR);
          // Get the magnetometer data characteristic
          magCharacteristic = await this.getCharacteristic(movementService, CHARACTERISTIC_NAME_MAG);
        } catch(error) {
          console.log("custom Firmware is missing!");
          this.newFirmware=false;
        }
        //connect the services
        this.ecg.connectEcg(ecgCharacteristic, batteryCharacteristic, device);
        if(this.newFirmware){
          this.mov.connectMov(accCharacteristic, gyrCharacteristic, magCharacteristic, device);
        }

        const onServerDisconnected = () => {
          if(device) {
            // GATT server disconnected -> Stop listening to changed characteristic value, removed service and disconnected GATT server.
            device.removeEventListener('gattserverdisconnected', onServerDisconnected);
            // Remove device from connected devices.
            this.removeDevice(device.id);
            // Emit disconnected event.
            this.disconnected.emit(device.id);
            console.log("disconnect event");
          }
        };

        device.addEventListener('gattserverdisconnected', onServerDisconnected);

        // Add device to connected devices.
        this.addDevice(device, server);
        // Return the connected device.
        return device.id;
      } catch (error) {
        try {
          // Ensure that connection to GATT server is closed after failure.
          server.disconnect();
        } catch (e) {
          throw `${error} Disconnect from server also failed: `+e;
        }
        throw error;
      }
    } catch (error) {
      throw `Failed to connect to Movesense ECG device: ${error}`;
    }
  }
  /**
   * Disconnects from a bluetooth ECG device.
   * @param deviceId Identity of bluetooth device to disconnect.
   */
  disconnect(deviceId: string): void {
    if (!this.containsDevice(deviceId)) return;
    this._connectedServers[deviceId]?.disconnect();
    this._connectedDevices[deviceId]?.gatt.disconnect();
    this.removeDevice(deviceId);
  }
  /**
   * Gets if a bluetooth ECG device is connected.
   * @param deviceId Identity of bluetooth device.
   * @returns true = connected, false = not connected.
   */
  isConnected(deviceId: string): boolean {
    return this.containsDevice(deviceId) && this._connectedServers[deviceId]?.connected;
  }

  public debugPrint() : void {
    console.log(Date.now());
    console.log("Devices: "+JSON.stringify(this._connectedDevices));
    console.log("Servers: "+JSON.stringify(this._connectedServers));
  }
}
