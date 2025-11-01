import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

// Driver Info Request Interface
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

// Driver Document Request Interface
export interface DriverDocumentRequest {
  driver_id: number;
  aadhar_img: string;
  pan_img: string;
  driver_img: string;
  insurance_img: string;
  rc_img: string;
  license_img: string;
}

// Driver Vehicle Interface
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

// Vehicle Insurance Interface
export interface DriverVehicleInsurance {
  vehicle_id: number;
  frm_date: string;
  to_date: string;
  ins_company: string;
  amt_insured: number;
  driver_id: number;
}

// Response Interfaces
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

  checkDriverExists(): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.baseUrl}/getDriverExists`,
      { headers: this.getHeaders() }
    );
  }

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

  getAllDrivers(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/GetDrivers`,
      { headers: this.getHeaders() }
    );
  }

  getDriverById(driverId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/GetDriverById/${driverId}`,
      { headers: this.getHeaders() }
    );
  }

  updateDriver(driverId: number, driverData: Partial<DriverInfoRequest>): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/UpdateDriver`,
      { driver_id: driverId, ...driverData },
      { headers: this.getHeaders() }
    );
  }

  deleteDriver(driverId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/DeleteDriver/${driverId}`,
      { headers: this.getHeaders() }
    );
  }

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