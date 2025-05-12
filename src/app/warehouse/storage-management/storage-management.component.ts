import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-storage-management',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './storage-management.component.html',
  styleUrls: ['./storage-management.component.scss'],
})
export class StorageManagementComponent {
  storageZones = [
    { name: 'Cold Storage', produce: 'Leafy greens, tomatoes', conditions: '2–8°C' },
    { name: 'Dry Storage', produce: 'Potatoes, onions', conditions: 'Room temperature' },
    { name: 'Dispatch Area', produce: 'Fast-moving items', conditions: 'Easily accessible' },
    { name: 'Spoilage Zone', produce: 'Damaged goods', conditions: 'For waste tracking' },
  ];

  storageItems = [
    {
      product: 'Tomatoes',
      zone: 'Cold Storage',
      rack: 'R1',
      shelf: 'S3',
      quantity: 120,
      updatedAt: new Date(),
    },
    {
      product: 'Onions',
      zone: 'Dry Storage',
      rack: 'R2',
      shelf: 'S1',
      quantity: 200,
      updatedAt: new Date(),
    },
    {
      product: 'Spinach',
      zone: 'Cold Storage',
      rack: 'R3',
      shelf: 'S2',
      quantity: 80,
      updatedAt: new Date(),
    },
    {
      product: 'Potatoes',
      zone: 'Dry Storage',
      rack: 'R1',
      shelf: 'S5',
      quantity: 300,
      updatedAt: new Date(),
    },
    {
      product: 'Damaged Lettuce',
      zone: 'Spoilage Zone',
      rack: 'R4',
      shelf: 'S2',
      quantity: 15,
      updatedAt: new Date(),
    },
  ];
}
