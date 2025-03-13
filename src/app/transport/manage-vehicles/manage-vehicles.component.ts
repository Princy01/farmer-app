import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';

interface Vehicle {
  id: number;
  type: string;
  capacity: number;
  available: boolean;
  driver?: string;
  driverContact?: string;
}

@Component({
  selector: 'app-manage-vehicles',
  templateUrl: './manage-vehicles.component.html',
  styleUrls: ['./manage-vehicles.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class ManageVehiclesComponent {
  vehicles: Vehicle[] = [];

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) { addIcons({
    'add-outline': addOutline,
    'create-outline': createOutline,
    'trash-outline': trashOutline
  }); }

  async addVehicle() {
    const alert = await this.alertCtrl.create({
      header: 'Add New Vehicle',
      inputs: [
        { name: 'type', type: 'text', placeholder: 'Vehicle Type (Truck, Van, etc.)' },
        { name: 'capacity', type: 'number', placeholder: 'Capacity in kg' },
        { name: 'driver', type: 'text', placeholder: 'Driver Name (Optional)' },
        { name: 'driverContact', type: 'tel', placeholder: 'Driver Contact (Optional)' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: (data) => {
            const newVehicle: Vehicle = {
              id: this.vehicles.length ? this.vehicles[this.vehicles.length - 1].id + 1 : 1,
              type: data.type,
              capacity: +data.capacity,
              available: true,
              driver: data.driver || '',
              driverContact: data.driverContact || ''
            };
            this.vehicles.push(newVehicle);
            this.showToast('Vehicle added successfully!');
          }
        }
      ]
    });
    await alert.present();
  }

  async editVehicle(vehicle: Vehicle) {
    const alert = await this.alertCtrl.create({
      header: 'Edit Vehicle',
      inputs: [
        { name: 'type', type: 'text', value: vehicle.type, placeholder: 'Vehicle Type' },
        { name: 'capacity', type: 'number', value: vehicle.capacity, placeholder: 'Capacity' },
        { name: 'driver', type: 'text', value: vehicle.driver || '', placeholder: 'Driver Name (Optional)' },
        { name: 'driverContact', type: 'tel', value: vehicle.driverContact || '', placeholder: 'Driver Contact (Optional)' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Update',
          handler: (data) => {
            vehicle.type = data.type;
            vehicle.capacity = +data.capacity;
            vehicle.driver = data.driver || '';
            vehicle.driverContact = data.driverContact || '';
            this.showToast('Vehicle updated successfully!');
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteVehicle(id: number) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this vehicle?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: () => {
            this.vehicles = this.vehicles.filter(v => v.id !== id);
            this.showToast('Vehicle deleted successfully!');
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}
