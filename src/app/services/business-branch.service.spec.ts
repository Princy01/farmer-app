import { TestBed } from '@angular/core/testing';

import { BusinessBranchService } from './business-branch.service';

describe('BusinessBranchService', () => {
  let service: BusinessBranchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusinessBranchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
