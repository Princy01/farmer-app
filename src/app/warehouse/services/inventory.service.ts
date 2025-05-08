import { Injectable } from '@angular/core';

export interface InventoryBatch {
  batchNo: string;
  name: string;
  grade: string;
  quantity: number;
  arrivalDate: string;
  expiryDate: string;
  source: string;
  warehouseId: string;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private inventory: InventoryBatch[] = [
    {
      batchNo: 'B001',
      name: 'Tomato',
      grade: 'A',
      quantity: 1000,
      arrivalDate: '2025-04-01',
      expiryDate: '2025-04-10',
      source: 'Farmer A',
      warehouseId: '1', // Associated warehouse
    },
    {
      batchNo: 'B002',
      name: 'Potato',
      grade: 'B',
      quantity: 2500,
      arrivalDate: '2025-04-02',
      expiryDate: '2025-04-12',
      source: 'Farmer B',
      warehouseId: '1',
    },
    {
      batchNo: 'B003',
      name: 'Onion',
      grade: 'A',
      quantity: 1050,
      arrivalDate: '2025-04-05',
      expiryDate: '2025-04-15',
      source: 'Farmer C',
      warehouseId: '2',
    },
    {
      batchNo: 'B004',
      name: 'Carrot',
      grade: 'C',
      quantity: 800,
      arrivalDate: '2025-04-07',
      expiryDate: '2025-04-17',
      source: 'Farmer D',
      warehouseId: '2',
    },
    {
      batchNo: 'B005',
      name: 'Spinach',
      grade: 'A',
      quantity: 600,
      arrivalDate: '2025-04-10',
      expiryDate: '2025-04-14',
      source: 'Organic Farms',
      warehouseId: '3',
    },
    {
      batchNo: 'B006',
      name: 'Cabbage',
      grade: 'B',
      quantity: 1200,
      arrivalDate: '2025-04-08',
      expiryDate: '2025-04-18',
      source: 'Farm Fresh',
      warehouseId: '3',
    },
    {
      batchNo: 'B007',
      name: 'Cauliflower',
      grade: 'A',
      quantity: 900,
      arrivalDate: '2025-04-09',
      expiryDate: '2025-04-19',
      source: 'Green Valley',
      warehouseId: '1',
    },
    {
      batchNo: 'B008',
      name: 'Bell Pepper',
      grade: 'A',
      quantity: 500,
      arrivalDate: '2025-04-11',
      expiryDate: '2025-04-20',
      source: 'Redfield Farms',
      warehouseId: '2',
    },
  ];

  /** Return a copy of the full inventory array */
  getInventory(): InventoryBatch[] {
    return [...this.inventory];
  }

  /** Find a single batch by its batchNo */
  getInventoryByBatch(batchNo: string): InventoryBatch | undefined {
    return this.inventory.find(b => b.batchNo === batchNo);
  }

  /** Fetch inventory for a specific warehouse */
  getInventoryByWarehouse(warehouseId: string): InventoryBatch[] {
    return this.inventory.filter(batch => batch.warehouseId === warehouseId);
  }

  /** Add a new batch (automatically assigns next batchNo and marks source as Manual Entry) */
  addInventory(batch: Omit<InventoryBatch, 'batchNo' | 'source'>): void {
    const nextId = this.inventory.length + 1;
    const newBatch: InventoryBatch = {
      batchNo: `B00${nextId}`,
      source: 'Manual Entry',
      ...batch,
    };
    this.inventory.push(newBatch);
  }

  /** Update an existing batch by matching batchNo */
  updateInventory(updatedBatch: InventoryBatch): void {
    const idx = this.inventory.findIndex(b => b.batchNo === updatedBatch.batchNo);
    if (idx > -1) {
      this.inventory[idx] = { ...updatedBatch };
    }
  }
}