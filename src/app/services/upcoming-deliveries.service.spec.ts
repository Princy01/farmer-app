import { TestBed } from '@angular/core/testing';

import { UpcomingDeliveriesService } from './upcoming-deliveries.service';

describe('UpcomingDeliveriesService', () => {
  let service: UpcomingDeliveriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpcomingDeliveriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
