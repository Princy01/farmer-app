import { TestBed } from '@angular/core/testing';

import { DeliveryConfirmationService } from './delivery-confirmation.service';

describe('DeliveryConfirmationService', () => {
  let service: DeliveryConfirmationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeliveryConfirmationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
