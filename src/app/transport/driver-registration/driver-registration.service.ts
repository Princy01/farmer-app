import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DriverInfoRequest {
  first_name: string;
  last_name: string;
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

export interface DocumentType {
  aadhar_img: string;
  pan_img: string;
  driver_img: string;
  insurance_img: string;
  rc_img: string;
  license_img: string;
}

export interface DriverVehicleInfo {
  veh_number: string;
  reg_date: string;
  state: string;
  type_id: number;
  veh_make: string;
  veh_model: string;
  load_capacity: number;
  fuel_type: string;
  kms_travelled: number;
}

export interface VehicleInsuranceInfo {
  frm_date: string;
  to_date: string;
  ins_company: string;
  amt_insured: number;
}

export interface CompleteDriverRequest {
  driver_info: DriverInfoRequest;
  documents: DocumentType;
  vehicle: DriverVehicleInfo;
  insurance: VehicleInsuranceInfo;
}

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  addCompleteDriver(driverData: CompleteDriverRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/AddCompleteDriver`, driverData, {
      headers: this.getHeaders()
    });
  }

  addDriver(driverInfo: DriverInfoRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/AddADriver`, driverInfo, {
      headers: this.getHeaders()
    });
  }

  addDriverVehicle(vehicleData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/AddADriverVehicle`, vehicleData, {
      headers: this.getHeaders()
    });
  }

  addDriverDocument(documentData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/AddADriverDocument`, documentData, {
      headers: this.getHeaders()
    });
  }

  addDriverInsurance(insuranceData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/AddADriverInsurance`, insuranceData, {
      headers: this.getHeaders()
    });
  }
}