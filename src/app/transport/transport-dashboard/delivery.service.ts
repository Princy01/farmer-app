import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private BASE_URL = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) {}

  getActiveDeliveries(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/transportation/delivery/active-deliveries`);
  }

  getUpcomingDeliveries(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/transportation/delivery/upcoming-deliveries`);
  }

  getCompletedDeliveries(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/transportation/delivery/completed-deliveries`);
  }


}
