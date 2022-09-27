export class BleDevice {

  constructor(
    readonly device: BluetoothDevice,
  ) {

  }

  private readonly services: { [service: BluetoothServiceUUID]: BluetoothRemoteGATTService } = {};

  async connect(initialServices: BluetoothServiceUUID[]) {
    
  }
}
