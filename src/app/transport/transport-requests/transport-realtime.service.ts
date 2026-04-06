import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';
import { DriverJobOffer } from './transport-requests.service';

export interface WebSocketMessage {
  type: 'incoming_job' | 'job_removed' | 'job_accepted' | 'capacity_warning' | 'job_cancelled' |
          'driver_availability_locked' | 'driver_availability_updated' | 'job_cancelled_by_retailer' |
          'initial_jobs' | 'connection_established';
  data?: any;
  ride_id?: number;
  job_id?: number;
  attempt_no?: number;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransportRealtimeService {
  private ws: WebSocket | null = null;
  private wsUrl: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // 2 seconds
  private reconnectTimeout: any;
  private messageQueue: string[] = [];
  private isConnected = false;
  private tokenRefreshCheckInterval: any;
  private readonly TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  private offersSubject = new BehaviorSubject<DriverJobOffer[]>([]);
  public offers$: Observable<DriverJobOffer[]> = this.offersSubject.asObservable();

  private newOfferSubject = new Subject<DriverJobOffer>();
  public newOffer$: Observable<DriverJobOffer> = this.newOfferSubject.asObservable();

  private offerRemovedSubject = new Subject<{ ride_id: number; job_id: number; attempt_no: number }>();
  public offerRemoved$: Observable<{ ride_id: number; job_id: number; attempt_no: number }> = this.offerRemovedSubject.asObservable();

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$: Observable<boolean> = this.connectionStatusSubject.asObservable();

  private errorSubject = new Subject<string>();
  public error$: Observable<string> = this.errorSubject.asObservable();

  private availabilityLockedSubject = new Subject<void>();
  public availabilityLocked$: Observable<void> = this.availabilityLockedSubject.asObservable();

  private cancelCooldownSubject = new Subject<Date>();
  public cancelCooldown$: Observable<Date> = this.cancelCooldownSubject.asObservable();

  constructor(private authService: AuthService) {
    this.setupWSUrl();
  }

  private setupWSUrl() {
    const realtimeApiUrl = environment.realtimeApiUrl;
    // Convert http/https to ws/wss
    this.wsUrl = realtimeApiUrl
      .replace(/^https:/, 'wss:')
      .replace(/^http:/, 'ws:');
  }

  connect(): void {
    if (this.isConnected || this.ws) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.errorSubject.next('TRANSPORT_REQUESTS.ERROR_NO_AUTH_TOKEN');
      return;
    }

    // Check if token is expired or about to expire
    if (this.isTokenExpired(token)) {
      this.errorSubject.next('TRANSPORT_REQUESTS.ERROR_AUTH_TOKEN_EXPIRED_LOGIN');
      return;
    }

    const wsUrlWithAuth = `${this.wsUrl}/ws/driver?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrlWithAuth);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionStatusSubject.next(true);
        this.processMessageQueue();
        // Start token refresh check
        this.startTokenRefreshCheck();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error: Event) => {
        this.errorSubject.next('TRANSPORT_REQUESTS.ERROR_WS_CONNECTION');
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.connectionStatusSubject.next(false);
        this.reconnect();
      };
    } catch (error) {
      this.errorSubject.next('TRANSPORT_REQUESTS.ERROR_WS_ESTABLISH');
      this.reconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.tokenRefreshCheckInterval) {
      clearInterval(this.tokenRefreshCheckInterval);
      this.tokenRefreshCheckInterval = null;
    }
    this.isConnected = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatusSubject.next(false);
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.errorSubject.next('TRANSPORT_REQUESTS.ERROR_WS_RECONNECT_FAILED');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      switch (message.type) {
        // Initial batch of open jobs on connection
        case 'initial_jobs':
          if (Array.isArray(message.data)) {
            const offers = message.data.map((o: any) => this.mapToDriverJobOffer(o));
            this.offersSubject.next(offers);
          }
          break;

        // New incoming job offer
        case 'incoming_job':
          if (message.data) {
            const offer: DriverJobOffer = this.mapToDriverJobOffer(message.data);
            const currentOffers = this.offersSubject.value;
            // Check if offer already exists (avoid duplicates)
            const existingIndex = currentOffers.findIndex(
              o => o.ride_id === offer.ride_id && o.attempt_no === offer.attempt_no
            );
            if (existingIndex === -1) {
              this.offersSubject.next([...currentOffers, offer]);
            }
            this.newOfferSubject.next(offer);
          }
          break;

        // Job removed (accepted by driver, expired, or cancelled)
        case 'job_removed':
          if (message.ride_id !== undefined) {
            const currentOffers = this.offersSubject.value.filter(
              o => !(o.ride_id === message.ride_id && o.attempt_no === message.attempt_no)
            );
            this.offersSubject.next(currentOffers);
            this.offerRemovedSubject.next({
              ride_id: message.ride_id,
              job_id: message.job_id || 0,
              attempt_no: message.attempt_no || 0
            });
          }
          break;

        // Job accepted by driver (informational)
        case 'job_accepted':
          // Already handled by job_removed, but keeping for future use
          break;

        // Capacity warning/nudge
        case 'capacity_warning':
          // Component can listen for this if needed
          break;

        // Connection established confirmation
        case 'connection_established':
          // Server-side confirmation, no action needed
          break;

        // Job cancelled
        case 'job_cancelled':
          if (message.ride_id !== undefined) {
            const currentOffers = this.offersSubject.value.filter(
              o => !(o.ride_id === message.ride_id && o.attempt_no === message.attempt_no)
            );
            this.offersSubject.next(currentOffers);
          }
          break;

        // Driver availability locked (dispute/admin action) - clears all offers
        case 'driver_availability_locked':
          this.offersSubject.next([]);
          this.availabilityLockedSubject.next();
          if (message.data?.locked_until) {
            const cooldownUntil = new Date(message.data.locked_until);
            this.cancelCooldownSubject.next(cooldownUntil);
          }
          break;

        // Driver availability updated (admin override)
        case 'driver_availability_updated':
          if (message.data?.status_expires_at) {
            const expiresAt = new Date(message.data.status_expires_at);
            this.cancelCooldownSubject.next(expiresAt);
          }
          break;

        // Job cancelled by retailer
        case 'job_cancelled_by_retailer':
          if (message.ride_id !== undefined) {
            const currentOffers = this.offersSubject.value.filter(
              o => !(o.ride_id === message.ride_id && o.attempt_no === message.attempt_no)
            );
            this.offersSubject.next(currentOffers);
          }
          break;
      }
    } catch (error) {
      // Silent fail for parsing errors - don't spam console
    }
  }

  private mapToDriverJobOffer(data: any): DriverJobOffer {
    return {
      ride_id: data.ride_id || 0,
      job_id: data.job_id || 0,
      attempt_no: data.attempt_no || 0,
      driver_id: data.driver_id || 0,
      status: data.status || 'pending',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      expires_at: data.expires_at,
      accepted_at: data.accepted_at,
      rejected_at: data.rejected_at,
      removed_at: data.removed_at,
      pickup_address: data.pickup_address || '',
      drop_address: data.drop_address || '',
      load_weight_kg: data.load_weight_kg || 0,
      offered_rate: data.offered_rate || 0,
      city: data.city || '',
      area: data.area || '',
      capacity_warning: data.capacity_warning || false,
      authorized_capacity_kg: data.authorized_capacity_kg,
      current_load_kg: data.current_load_kg,
      projected_load_kg: data.projected_load_kg,
      overload_kg: data.overload_kg
    };
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(message);
      }
    }
  }

  sendMessage(message: any): void {
    const messageStr = JSON.stringify(message);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(messageStr);
    } else {
      this.messageQueue.push(messageStr);
      if (!this.isConnected) {
        this.connect();
      }
    }
  }

  getCurrentOffers(): DriverJobOffer[] {
    return this.offersSubject.value;
  }

  /**
   * Check if JWT token is expired or about to expire
   * Decodes JWT header and checks exp claim
   */
  private isTokenExpired(token: string): boolean {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true; // Invalid token format
      }

      // Decode payload (base64url -> base64)
      const base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64Url.padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), '=');
      const payload = JSON.parse(atob(paddedBase64));

      // Check expiration (exp is in seconds, Date.now() is in ms)
      if (payload.exp) {
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

        return currentTime > (expirationTime - bufferTime);
      }

      return false;
    } catch (error) {
      // If we can't decode, assume it's valid
      return false;
    }
  }

  /**
   * Start periodic check for token expiration
   * If token is about to expire, reconnect with fresh token
   */
  private startTokenRefreshCheck(): void {
    // Clear existing check
    if (this.tokenRefreshCheckInterval) {
      clearInterval(this.tokenRefreshCheckInterval);
    }

    // Start new check
    this.tokenRefreshCheckInterval = setInterval(() => {
      const token = this.authService.getToken();
      if (!token) {
        this.errorSubject.next('TRANSPORT_REQUESTS.ERROR_AUTH_TOKEN_LOST');
        this.disconnect();
        return;
      }

      if (this.isTokenExpired(token)) {
        // Token is expired or about to expire, reconnect
        this.errorSubject.next('TRANSPORT_REQUESTS.ERROR_AUTH_TOKEN_EXPIRED_RECONNECTING');
        this.disconnect();

        // Wait a moment then reconnect with new token
        setTimeout(() => {
          this.connect();
        }, 1000);
      }
    }, this.TOKEN_CHECK_INTERVAL);

  }

  isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}
