import { TestBed } from '@angular/core/testing';

import { BrightnessService } from './brightness.service';

describe('BrightnessService', () => {
  let service: BrightnessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrightnessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
