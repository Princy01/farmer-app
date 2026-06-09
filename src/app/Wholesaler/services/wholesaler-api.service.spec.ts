import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { WholesalerApiService } from './wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { environment } from 'src/environments/environment';

describe('WholesalerApiService', () => {
  let service: WholesalerApiService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'getUserId']);
    authService.getToken.and.returnValue('unit-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService }
      ]
    });
    service = TestBed.inject(WholesalerApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.removeItem('preferred_language');
    localStorage.removeItem('appLang');
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call wholesaler earnings summary with filters, auth, and language headers', async () => {
    localStorage.setItem('preferred_language', 'hi-IN');

    const response = {
      status: 'credited',
      expected_amount: 100,
      deduction_amount: 5,
      net_payable_amount: 95,
      credited_amount: 95,
      pending_amount: 0,
      held_amount: 0,
      ready_amount: 0,
      allocation_count: 1,
      order_count: 1,
      timezone: 'Asia/Kolkata',
      generated_at: '2026-06-09T00:00:00Z'
    };

    const result = firstValueFrom(service.getWholesalerEarningsSummary({
      from: '2026-06-01',
      to: '2026-06-09',
      status: 'credited'
    }));

    const req = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url === `${environment.apiUrl}/wholesaler/earnings/summary`
    );
    expect(req.request.params.get('from')).toBe('2026-06-01');
    expect(req.request.params.get('to')).toBe('2026-06-09');
    expect(req.request.params.get('status')).toBe('credited');
    expect(req.request.headers.get('Authorization')).toBe('Bearer unit-token');
    expect(req.request.headers.get('X-App-Language')).toBe('hi');

    req.flush(response);
    await expectAsync(result).toBeResolvedTo(response);
  });

  it('should call wholesaler earnings orders with pagination and date filters', async () => {
    const response = {
      items: [],
      page: 2,
      page_size: 10,
      total: 12,
      has_more: false
    };

    const result = firstValueFrom(service.getWholesalerEarningsOrders({
      date: '2026-06-08',
      page: 2,
      page_size: 10,
      status: '' as any
    }));

    const req = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url === `${environment.apiUrl}/wholesaler/earnings/orders`
    );
    expect(req.request.params.get('date')).toBe('2026-06-08');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('page_size')).toBe('10');
    expect(req.request.params.has('status')).toBeFalse();

    req.flush(response);
    await expectAsync(result).toBeResolvedTo(response);
  });

  it('should call wholesaler earnings order detail endpoint', async () => {
    const response = {
      order: {
        allocation_id: 1,
        settlement_status: 'released',
        settlement_status_label: 'Credited',
        expected_amount: 100,
        fee_amount: 0,
        tax_amount: 0,
        hold_amount: 0,
        deduction_amount: 0,
        actual_amount: 100,
        credited_amount: 100,
        pending_amount: 0,
        difference_amount: 0
      },
      items: [],
      deduction_reasons: []
    };

    const result = firstValueFrom(service.getWholesalerEarningsOrderDetail(399));

    const req = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url === `${environment.apiUrl}/wholesaler/earnings/orders/399`
    );
    expect(req.request.headers.get('Authorization')).toBe('Bearer unit-token');

    req.flush(response);
    await expectAsync(result).toBeResolvedTo(response);
  });
});
