import { TestBed } from '@angular/core/testing';

import { BuyerHomeService } from './buyer-home.service';

describe('BuyerHomeService', () => {
  let service: BuyerHomeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BuyerHomeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
