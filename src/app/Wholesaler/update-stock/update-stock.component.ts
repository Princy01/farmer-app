import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StockService } from 'src/app/Wholesaler/services/stock.service';

@Component({
  selector: 'app-update-stock',
  templateUrl: './update-stock.component.html',
  styleUrls: ['./update-stock.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class UpdateStockComponent {
  @Input() stockItem: any;
  stockUpdateData: any = {
    productID: null,
    stock: null,
    businessBranchId: 1,
    dateOfEntry: new Date().toISOString().split('T')[0]
  };

  constructor(
    private stockService: StockService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.stockUpdateData.productID = this.stockItem.id;
  }

  updateStock() {
    this.stockService.updateStock(this.stockUpdateData).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Stock updated successfully',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        this.modalCtrl.dismiss();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Failed to update stock',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
