import { TestBed } from '@angular/core/testing';

import { BluetoothEcgService } from './bluetooth-ecg.service';

describe('BluetoothEcgService', () => {
  let service: BluetoothEcgService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BluetoothEcgService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
