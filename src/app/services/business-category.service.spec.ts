import { TestBed } from '@angular/core/testing';

import { BusinessCategoryService } from './business-category.service';

describe('BusinessCategoryService', () => {
  let service: BusinessCategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusinessCategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
