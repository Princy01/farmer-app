import { TestBed } from '@angular/core/testing';

import { CashPaymentService } from './cash-payment.service';

describe('CashPaymentService', () => {
  let service: CashPaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CashPaymentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
