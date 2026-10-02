import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService, AuthResponse } from './auth.service';
import { environment } from 'src/environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('coalesces concurrent refresh requests and stores the rotated pair', () => {
    localStorage.setItem('refresh_token', 'old-refresh-token');
    const responses: AuthResponse[] = [];

    service.refreshToken().subscribe(response => responses.push(response));
    service.refreshToken().subscribe(response => responses.push(response));

    const request = http.expectOne(`${environment.apiUrl}/auth/refresh-token`);
    expect(request.request.body).toEqual({ refresh_token: 'old-refresh-token' });
    request.flush({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      role_id: 4
    });

    expect(responses.length).toBe(2);
    expect(localStorage.getItem('access_token')).toBe('new-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
    expect(localStorage.getItem('user_role')).toBe('driver');
  });
});
