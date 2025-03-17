import { Component, Input, inject } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './filter-modal.component.html',
  styleUrls: ['./filter-modal.component.scss']
})
export class FilterModalComponent {
  private modalController = inject(ModalController);

  @Input() priorityDeliveries = false;
  @Input() delayedDeliveries = false;
  @Input() sharedDeliveries = false;
  @Input() singleDelivery = false;

  applyFilters() {
    this.modalController.dismiss({
      priorityDeliveries: this.priorityDeliveries,
      delayedDeliveries: this.delayedDeliveries,
      sharedDeliveries: this.sharedDeliveries,
      singleDelivery: this.singleDelivery,
    });
  }

  closeModal() {
    this.modalController.dismiss();
  }
}
