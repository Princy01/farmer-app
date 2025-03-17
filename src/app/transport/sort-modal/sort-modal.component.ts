import { Component, Input, inject } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sort-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './sort-modal.component.html',
  styleUrls: ['./sort-modal.component.scss']
})
export class SortModalComponent {
  private modalController = inject(ModalController);

  @Input() sortOption = '';

  applySort() {
    this.modalController.dismiss({ sortOption: this.sortOption });
  }

  closeModal() {
    this.modalController.dismiss();
  }
}
