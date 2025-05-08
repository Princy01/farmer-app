import { Injectable } from '@angular/core';

export interface Warehouse {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private warehouses: Warehouse[] = [
    { id: '1', name: 'Warehouse A' },
    { id: '2', name: 'Warehouse B' },
    { id: '3', name: 'Warehouse C' }
  ];

  getWarehouses(): Warehouse[] {
    return this.warehouses;
  }
}