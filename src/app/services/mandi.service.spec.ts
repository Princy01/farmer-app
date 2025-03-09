import { TestBed } from '@angular/core/testing';

import { MandiService } from './mandi.service';

describe('MandiService', () => {
  let service: MandiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MandiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
