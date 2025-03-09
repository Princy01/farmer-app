import { TestBed } from '@angular/core/testing';

import { Screen3Service } from './screen3.service';

describe('Screen3Service', () => {
  let service: Screen3Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Screen3Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
