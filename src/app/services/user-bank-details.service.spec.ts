import { TestBed } from '@angular/core/testing';

import { UserBankDetailsService } from './user-bank-details.service';

describe('UserBankDetailsService', () => {
  let service: UserBankDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserBankDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
