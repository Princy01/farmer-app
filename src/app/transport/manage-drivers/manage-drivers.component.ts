import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';

interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  available: boolean;
}

@Component({
  selector: 'app-manage-drivers',
  templateUrl: './manage-drivers.component.html',
  styleUrls: ['./manage-drivers.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class ManageDriversComponent {
  drivers: Driver[] = [
    { id: 1, name: 'Rajesh Kumar', phone: '9876543210', vehicle: 'Truck', available: true },
    { id: 2, name: 'Amit Sharma', phone: '9123456789', vehicle: 'Mini Van', available: false },
    { id: 3, name: 'Sunil Verma', phone: '9988776655', vehicle: 'Pickup', available: true },
    { id: 4, name: 'Vikram Singh', phone: '9871234560', vehicle: 'Bike', available: true }
  ];

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      'add-outline': addOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline
    });
  }

  async addDriver() {
    const alert = await this.alertCtrl.create({
      header: 'Add New Driver',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Driver Name' },
        { name: 'phone', type: 'tel', placeholder: 'Phone Number' },
        { name: 'vehicle', type: 'text', placeholder: 'Assigned Vehicle' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: (data) => {
            const newDriver: Driver = {
              id: this.drivers.length ? this.drivers[this.drivers.length - 1].id + 1 : 1,
              name: data.name,
              phone: data.phone,
              vehicle: data.vehicle,
              available: true
            };
            this.drivers.push(newDriver);
            this.showToast('Driver added successfully!');
          }
        }
      ]
    });
    await alert.present();
  }

  async editDriver(driver: Driver) {
    const alert = await this.alertCtrl.create({
      header: 'Edit Driver',
      inputs: [
        { name: 'name', type: 'text', value: driver.name, placeholder: 'Driver Name' },
        { name: 'phone', type: 'tel', value: driver.phone, placeholder: 'Phone Number' },
        { name: 'vehicle', type: 'text', value: driver.vehicle, placeholder: 'Assigned Vehicle' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Update',
          handler: (data) => {
            driver.name = data.name;
            driver.phone = data.phone;
            driver.vehicle = data.vehicle;
            this.showToast('Driver updated successfully!');
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteDriver(id: number) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to remove this driver?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: () => {
            this.drivers = this.drivers.filter(d => d.id !== id);
            this.showToast('Driver deleted successfully!');
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
