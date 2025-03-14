import { Component, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-assign-driver-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './assign-driver-modal.component.html',
  styleUrls: ['./assign-driver-modal.component.scss'],
})
export class AssignDriverModalComponent {
  @Input() order: any;

  drivers = [
    { id: 1, name: 'Driver A' },
    { id: 2, name: 'Driver B' },
  ];

  vehicles = [
    { id: 1, licensePlate: 'ABC-123' },
    { id: 2, licensePlate: 'XYZ-789' },
  ];

  selectedDriver: number | null = null;
  selectedVehicle: number | null = null;

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  assignDriver() {
    if (!this.selectedDriver || !this.selectedVehicle) {
      alert('Please select a driver and vehicle.');
      return;
    }
    console.log(`Assigned Driver ID: ${this.selectedDriver}, Vehicle ID: ${this.selectedVehicle} to Order ID: ${this.order.id}`);
    this.modalCtrl.dismiss();
  }
}
