import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { TransportRealtimeService } from './transport-realtime.service';

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  readyState = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(readonly url: string) {}

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
  }

  send(): void {}
}

function jwtWithExpiry(exp: number): string {
  const encode = (value: object) => btoa(JSON.stringify(value))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ exp })}.signature`;
}

describe('TransportRealtimeService', () => {
  const originalWebSocket = globalThis.WebSocket;

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it('refreshes an expired access token before opening the socket', () => {
    const expired = jwtWithExpiry(Math.floor(Date.now() / 1000) - 60);
    const current = jwtWithExpiry(Math.floor(Date.now() / 1000) + 3600);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'refreshToken']);
    auth.getToken.and.returnValues(expired, current);
    auth.refreshToken.and.returnValue(of({ access_token: current, refresh_token: 'rotated', role_id: 4 }));
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;

    TestBed.configureTestingModule({
      providers: [
        TransportRealtimeService,
        { provide: AuthService, useValue: auth }
      ]
    });

    const service = TestBed.inject(TransportRealtimeService);
    service.connect();

    expect(auth.refreshToken).toHaveBeenCalledTimes(1);
    expect(auth.getToken).toHaveBeenCalledTimes(2);
  });
});
