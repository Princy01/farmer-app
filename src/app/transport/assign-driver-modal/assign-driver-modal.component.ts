import { Component, Input } from '@angular/core';
import { ModalController, ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UpcomingDeliveriesService } from 'src/app/services/upcoming-deliveries.service'; // Import the service

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

  constructor(
    private modalCtrl: ModalController,
    private toastController: ToastController,
    private upcomingDeliveriesService: UpcomingDeliveriesService
  ) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async assignDriver() {
    if (!this.selectedDriver || !this.selectedVehicle) {
      alert('Please select a driver and vehicle.');
      return;
    }

        // Update order as assigned
    this.order.status = 'Scheduled'; // Mark as "Scheduled" for Upcoming tab
    this.order.driverId = this.selectedDriver;
    this.order.vehicleId = this.selectedVehicle;

    // Save the assigned order in the Upcoming Deliveries Service
    this.upcomingDeliveriesService.addAcceptedOrder(this.order);

    const toast = await this.toastController.create({
      message: 'You can check this order in upcoming deliveries in transport dashboard.',
      duration: 3000,
      position: 'bottom',
      // color: 'success',
    });

    await toast.present();

    // Auto-dismiss modal after a short delay
    setTimeout(() => {
      this.modalCtrl.dismiss();
    }, 1000);
  }
}
