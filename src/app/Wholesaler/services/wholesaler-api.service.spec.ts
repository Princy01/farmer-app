import { TestBed } from '@angular/core/testing';

import { WholesalerApiService } from './wholesaler-api.service';

describe('WholesalerApiService', () => {
  let service: WholesalerApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WholesalerApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
