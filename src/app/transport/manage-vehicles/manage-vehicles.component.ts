import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';
import { VehicleFormComponent } from '../vehicle-form-modal/vehicle-form-modal.component';

interface Vehicle {
  id: number;
  type: string;
  capacity: number;
  available: boolean;
  driver?: string;
  driverContact?: string;
  isElectric?: boolean;
  carbonCredits?: number;  // Only for electric vehicles
}

@Component({
  selector: 'app-manage-vehicles',
  templateUrl: './manage-vehicles.component.html',
  styleUrls: ['./manage-vehicles.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class ManageVehiclesComponent {
  vehicles: Vehicle[] = [
    { id: 1, type: 'Truck', capacity: 5000, available: true, driver: 'Rajesh Kumar', driverContact: '9876543210', isElectric: true, carbonCredits: 100 },
    { id: 2, type: 'Mini Van', capacity: 1500, available: false, driver: 'Amit Sharma', driverContact: '9123456789' },
    { id: 3, type: 'Pickup', capacity: 2000, available: true, driver: 'Sunil Verma', driverContact: '9988776655' },
    { id: 4, type: 'Bike', capacity: 200, available: true, driver: 'Vikram Singh', driverContact: '9871234560' }
  ];

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) { addIcons({ addOutline, createOutline, trashOutline }); }

  /**
   * Opens the modal for adding or editing a vehicle.
   * @param vehicle The vehicle object to edit (optional). If not provided, it adds a new vehicle.
   */
  async openVehicleForm(vehicle?: Vehicle) {
    const modal = await this.modalCtrl.create({
      component: VehicleFormComponent,
      componentProps: {
        vehicle: vehicle ? { ...vehicle } : { isElectric: false, carbonCredits: 0 }, // Default values for new vehicles
        isEdit: !!vehicle
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      if (vehicle) {
        // Update existing vehicle
        Object.assign(vehicle, data);
        this.showToast('Vehicle updated successfully!');
      } else {
        // Add new vehicle
        data.id = this.vehicles.length ? this.vehicles[this.vehicles.length - 1].id + 1 : 1;
        this.vehicles.push(data);
        this.showToast('Vehicle added successfully!');
      }
    }
  }

  /**
   * Deletes a vehicle after confirmation.
   * @param id The ID of the vehicle to delete.
   */
  async deleteVehicle(id: number) {
    this.vehicles = this.vehicles.filter(v => v.id !== id);
    this.showToast('Vehicle deleted successfully!');
  }

  /**
   * Displays a toast notification with a given message.
   * @param message The message to display.
   */
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}