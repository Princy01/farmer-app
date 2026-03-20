import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, catchError, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface DriverInfoRequest {
  first_name: string;
  last_name: string;
  dob: string;
  licence_no: string;
  licence_issued_date: string;
  licence_expiry_date: string;
  licence_type: string;
  address_door_no: string;
  address_street: string;
  address_town: string;
  address_state: string;
  address_pin_code: string;
  address_landmark: string;
  contact_num: string;
  contact_num_addl: string;
  email: string;
  aadhar: string;
  pan: string;
  bank_ac_no: string;
  bank_name: string;
  bank_branch: string;
  ifsc: string;
  bank_address: string;
  status: string;
}

export interface DriverInfoResponse extends DriverInfoRequest {
  driver_id: number;
}

export interface DriverDocumentRequest {
  driver_id: number;
  aadhar_img: string;
  pan_img: string;
  driver_img: string;
  insurance_img: string;
  rc_img: string;
  license_img: string;
}

export interface DriverDocumentResponse {
  document_id: number;
  driver_id: number;
  doc_type: string;
  doc_image: string;
  created_at: string;
}

export interface DriverVehicle {
  veh_number: string;
  reg_date: string;
  state: string;
  type_id: number;
  veh_make: string;
  veh_model: string;
  driver_id: number;
  load_capacity: number;
  fuel_type: string;
  rc_document: string;
  kms_travelled: number;
}

export interface DriverVehicleResponse extends DriverVehicle {
  vehicle_id: number;
}

export interface DriverVehicleInsurance {
  vehicle_id: number;
  frm_date: string;
  to_date: string;
  ins_company: string;
  amt_insured: number;
  driver_id: number;
}

export interface DriverVehicleInsuranceResponse extends DriverVehicleInsurance {
  insurance_id: number;
  created_at?: string;
}

export interface DriverResponse {
  message: string;
  driver_id: number;
}

export interface VehicleResponse {
  message: string;
  vehicle_id: number;
}

export interface DocumentResponse {
  message: string;
  uploaded: number;
  failed?: number;
  error?: string;
}

export interface InsuranceResponse {
  message: string;
}

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

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Check if driver exists (user_id based)
  checkDriverExists(): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.baseUrl}/getDriverExists`,
      { headers: this.getHeaders() }
    );
  }

  // Check if driver registration is completed
  checkDriverRegistrationCompleted(): Observable<boolean> {
    return this.http.get<{ is_completed: boolean }>(
      `${this.baseUrl}/getDriverRegistrationStatus`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.is_completed)
    );
  }

  // Get driver info (user_id based - returns driver data or null)
  getDriverInfo(): Observable<DriverInfoResponse | null> {
    return this.http.get<DriverInfoResponse>(
      `${this.baseUrl}/getDriverInfo`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.log('No driver info found:', error);
        return of(null);
      })
    );
  }

  // Get vehicles by driver_id (which is user_id)
  getDriverVehicles(driverId: number): Observable<DriverVehicleResponse[]> {
    return this.http.get<DriverVehicleResponse[]>(
      `${this.baseUrl}/getDriverVehiclesByDriverId/${driverId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.log('No vehicles found:', error);
        return of([]);
      })
    );
  }

  // Get documents by driver_id (which is user_id)
  getDriverDocuments(driverId: number): Observable<DriverDocumentResponse[]> {
    return this.http.get<DriverDocumentResponse[]>(
      `${this.baseUrl}/getDriverDocuments/${driverId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.log('No documents found:', error);
        return of([]);
      })
    );
  }

  // Get insurance by driver_id (which is user_id)
  getDriverInsurance(driverId: number): Observable<DriverVehicleInsuranceResponse[]> {
    return this.http.get<DriverVehicleInsuranceResponse[]>(
      `${this.baseUrl}/getDriverVehicleInsuranceByDriverId/${driverId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.log('No insurance found:', error);
        return of([]);
      })
    );
  }

  // ADD methods
  addDriver(driverInfo: DriverInfoRequest): Observable<DriverResponse> {
    return this.http.post<DriverResponse>(
      `${this.baseUrl}/AddADriver`,
      driverInfo,
      { headers: this.getHeaders() }
    );
  }

  addDriverDocument(documents: DriverDocumentRequest): Observable<DocumentResponse> {
    return this.http.post<DocumentResponse>(
      `${this.baseUrl}/AddADriverDocument`,
      documents,
      { headers: this.getHeaders() }
    );
  }

  addDriverVehicle(vehicleData: DriverVehicle): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(
      `${this.baseUrl}/AddADriverVehicle`,
      vehicleData,
      { headers: this.getHeaders() }
    );
  }

  addDriverVehicleInsurance(insuranceData: DriverVehicleInsurance): Observable<InsuranceResponse> {
    return this.http.post<InsuranceResponse>(
      `${this.baseUrl}/AddADriverInsurance`,
      insuranceData,
      { headers: this.getHeaders() }
    );
  }

  // UPDATE methods
  updateDriverInfo(driverId: number, driverInfo: DriverInfoRequest): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/updateDriverInfo/${driverId}`,
      driverInfo,
      { headers: this.getHeaders() }
    );
  }

  updateDriverVehicle(vehicleId: number, vehicleData: DriverVehicle): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/updateDriverVehicle/${vehicleId}`,
      vehicleData,
      { headers: this.getHeaders() }
    );
  }

  updateDriverDocument(documentId: number, documentData: any): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/updateDriverDocument/${documentId}`,
      documentData,
      { headers: this.getHeaders() }
    );
  }

  updateDriverVehicleInsurance(insuranceId: number, insuranceData: DriverVehicleInsurance): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/updateDriverInsurance/${insuranceId}`,
      insuranceData,
      { headers: this.getHeaders() }
    );
  }

  // Other methods
  getStates(): Observable<State[]> {
    return this.http.get<State[]>(
      `${this.baseUrl}/getStates`,
      { headers: this.getHeaders() }
    );
  }

  getCitiesOfState(stateId: number): Observable<City[]> {
    return this.http.get<City[]>(
      `${this.baseUrl}/getAllCitiesOfState/${stateId}`,
      { headers: this.getHeaders() }
    );
  }
}