import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, OperatorFunction } from 'rxjs';
import { retry, timeout, shareReplay, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface State {
  id: number;
  state_name: string;
  state_shortname: string;
}

export interface City {
  id: number;
  city_shortname: string;
  city_name: string;
}

export interface Location {
  id: number;
  location_name: string | null;
  city_id: number;
  city_name: string | null;
  state_id: number;
  state_name: string | null;
}

export interface BusinessType {
  b_typeid: number;
  b_typename: string;
  remarks: string;
}

export interface BusinessBranch {
  branch_id: number;
  bid: number;
  shop_name: string;
  type_id: number;
  location: number;
  state: number;
  city_id: number;
  address: string;
  email: string;
  number: string;
  gst_num: string;
  pan_num: string;
  privilege_user: boolean;
  established_year: string;
  active_status: boolean;
  latitude: number;
  longitude: number;
  image: string;
  location_capture_source?: string | null;
  location_verification_status?: string | null;
  location_captured_at?: string | null;
  location_verified_at?: string | null;
  location_verified_by?: number | null;
  location_verification_notes?: string | null;
}

export interface BranchAddressResolutionCandidate {
  location_id: number;
  location_name: string;
  alias_text: string;
  language_code: string;
  script_code: string;
  score: number;
  contains_alias: boolean;
  contains_latin: boolean;
}

export interface BranchAddressResolutionResponse {
  status: 'pending' | 'resolved' | 'suggested' | 'unresolved' | 'manual_override';
  confidence: number;
  resolved_location_id?: number;
  resolved_location_name?: string;
  selected_location_id?: number;
  selected_location_match?: boolean;
  normalized_query: string;
  candidates: BranchAddressResolutionCandidate[];
}

@Injectable({ providedIn: 'root' })
export class AddBusinessService {
  private apiUrl = environment.apiUrl;
  private readonly HTTP_TIMEOUT = 30000; // 30 seconds
  private readonly RETRY_ATTEMPTS = 3;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for reference data

  // Cache storage with TTL
  private statesCache$: Observable<State[]> | null = null;
  private citiesCache: Map<number, { data: Observable<City[]>, timestamp: number }> = new Map();
  private locationsCache: Map<number, { data: Observable<Location[]>, timestamp: number }> = new Map();
  private businessTypesCache$: Observable<BusinessType[]> | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Apply exponential backoff retry logic
   * E.g., 1s delay on 1st retry, 2s on 2nd, 4s on 3rd
   */
  private applyRetryStrategy<T>(): OperatorFunction<T, T> {
    return retry({
      count: this.RETRY_ATTEMPTS,
      delay: (error, retryCount) => {
        const backoffMs = Math.pow(2, retryCount - 1) * 1000;
        return new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    });
  }

  /**
   * Check if cached data is still valid (within TTL)
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Clear all caches on logout or session change
   */
  clearCache(): void {
    this.statesCache$ = null;
    this.businessTypesCache$ = null;
    this.citiesCache.clear();
    this.locationsCache.clear();
  }

  getStates(): Observable<State[]> {
    // Return cached data if still valid
    if (this.statesCache$) {
      return this.statesCache$;
    }

    // Fetch fresh data with timeout, retry, and cache
    this.statesCache$ = this.http.get<State[]>(
      `${this.apiUrl}/getStates`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      this.applyRetryStrategy(),
      shareReplay(1), // Share result among subscribers
      catchError((error) => {
        this.statesCache$ = null; // Clear cache on error
        throw error; // Re-throw to let caller handle or use empty in component
      })
    ) as Observable<State[]>;

    return this.statesCache$;
  }

  getCitiesOfState(stateId: number): Observable<City[]> {
    // Check cache validity
    const cached = this.citiesCache.get(stateId);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    // Fetch fresh data
    const cities$ = this.http.get<City[]>(
      `${this.apiUrl}/getAllCitiesOfState/${stateId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      this.applyRetryStrategy(),
      shareReplay(1),
      catchError((error) => {
        this.citiesCache.delete(stateId); // Clear from cache on error
        throw error;
      })
    ) as Observable<City[]>;

    // Store in cache
    this.citiesCache.set(stateId, { data: cities$, timestamp: Date.now() });
    return cities$;
  }

  getLocationsByCity(cityId: number): Observable<Location[]> {
    // Check cache validity
    const cached = this.locationsCache.get(cityId);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    // Fetch fresh data
    const locations$ = this.http.get<Location[]>(
      `${this.apiUrl}/getLocationsByCity/${cityId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      this.applyRetryStrategy(),
      shareReplay(1),
      catchError((error) => {
        this.locationsCache.delete(cityId); // Clear from cache on error
        throw error;
      })
    ) as Observable<Location[]>;

    // Store in cache
    this.locationsCache.set(cityId, { data: locations$, timestamp: Date.now() });
    return locations$;
  }

  createBusinessBranch(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/business-branches`, data, { headers })
      .pipe(
        timeout(this.HTTP_TIMEOUT),
        this.applyRetryStrategy()
      );
  }

  modifyBusinessBranch(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/branchDetailsUpdate`, data, { headers })
      .pipe(
        timeout(this.HTTP_TIMEOUT),
        this.applyRetryStrategy()
      );
  }

  resolveBusinessBranchAddress(data: {
    address: string;
    city_id: number;
    selected_location_id?: number | null;
  }): Observable<BranchAddressResolutionResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<BranchAddressResolutionResponse>(
      `${this.apiUrl}/business-branches/resolve-address`,
      data,
      { headers }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      this.applyRetryStrategy()
    );
  }

  getBusinessBranchById(branchId: number): Observable<BusinessBranch> {
    const headers = this.getAuthHeaders();
    return this.http.get<BusinessBranch>(
      `${this.apiUrl}/business-branches/${branchId}`,
      { headers }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      this.applyRetryStrategy()
    );
  }

  getBusinessTypes(): Observable<BusinessType[]> {
    // Return cached data if available
    if (this.businessTypesCache$) {
      return this.businessTypesCache$;
    }

    // Fetch fresh data with timeout, retry, and cache
    this.businessTypesCache$ = this.http.get<BusinessType[]>(
      `${this.apiUrl}/getBusinessTypes`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      this.applyRetryStrategy(),
      shareReplay(1),
      catchError((error) => {
        this.businessTypesCache$ = null; // Clear cache on error
        throw error;
      })
    ) as Observable<BusinessType[]>;

    return this.businessTypesCache$;
  }
}
