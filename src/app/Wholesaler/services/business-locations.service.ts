import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface BusinessLocation {
  id?: number;
  shopName: string;
  number: string;
  location: string;
  state: string;
  address: string;
  email: string;
  gstNumber: string;
  pan: string;
  pincode: string;
  privilegedUser: string;
  active_status: number;
  typeId: string;
  establishedYear: string;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessLocationsService {
  private dummyLocations: BusinessLocation[] = [
    {
      id: 1,
      shopName: 'Mandi Central',
      number: '9876543210',
      location: 'Delhi',
      state: 'Delhi',
      address: 'Azadpur Mandi, Delhi',
      email: 'mandicentral@email.com',
      gstNumber: '07AAACH7409R1ZZ',
      pan: 'AAACH7409R',
      pincode: '110033',
      privilegedUser: 'Admin User',
      active_status: 1,
      typeId: 'wholesale',
      establishedYear: '2020'
    },
    {
      id: 2,
      shopName: 'Punjab Mandi',
      number: '9876543211',
      location: 'Ludhiana',
      state: 'Punjab',
      address: 'Grain Market, Ludhiana',
      email: 'punjabmandi@email.com',
      gstNumber: '03AAACH7409R1ZZ',
      pan: 'AAACH7409R',
      pincode: '141001',
      privilegedUser: 'Manager',
      active_status: 1,
      typeId: 'wholesale',
      establishedYear: '2018'
    }
  ];

  getAllBusinessesOfWholesaler(userId: string): Observable<BusinessLocation[]> {
    // Simulate API call with dummy data
    return of(this.dummyLocations);
  }

  createBusinessesOfWholesaler(userId: string, business: BusinessLocation): Observable<BusinessLocation> {
    // Simulate API call
    const newBusiness = { ...business, id: Date.now() };
    this.dummyLocations.push(newBusiness);
    return of(newBusiness);
  }

  modifyBusinessesOfWholesaler(userId: string, business: BusinessLocation): Observable<BusinessLocation> {
    // Simulate API call
    const index = this.dummyLocations.findIndex(b => b.id === business.id);
    if (index !== -1) {
      this.dummyLocations[index] = business;
    }
    return of(business);
  }
}