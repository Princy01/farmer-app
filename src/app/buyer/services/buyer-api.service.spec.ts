import { TestBed } from '@angular/core/testing';

import { BuyerApiService } from './buyer-api.service';

describe('BuyerApiService', () => {
  let service: BuyerApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BuyerApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
