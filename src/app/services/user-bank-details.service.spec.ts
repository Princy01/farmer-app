import { TestBed } from '@angular/core/testing';

import { UserBankDetailService } from './user-bank-details.service';

describe('UserBankDetailService', () => {
  let service: UserBankDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserBankDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
