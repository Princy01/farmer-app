import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vehicle-form-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './vehicle-form-modal.component.html',
  styleUrls: ['./vehicle-form-modal.component.scss']
})

export class VehicleFormComponent {
  @Input() vehicle: any = {}; // Holds vehicle data
  @Input() isEdit: boolean = false;

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  saveVehicle() {
    this.modalCtrl.dismiss(this.vehicle);
  }
}
