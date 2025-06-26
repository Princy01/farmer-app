import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getActiveDeliveries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transportation/delivery/active-deliveries`);
  }

  getUpcomingDeliveries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transportation/delivery/upcoming-deliveries`);
  }

  getCompletedDeliveries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transportation/delivery/completed-deliveries`);
  }


}
