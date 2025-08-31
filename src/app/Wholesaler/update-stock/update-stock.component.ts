import { Component, Input, OnInit } from '@angular/core';
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
export class UpdateStockComponent implements OnInit {
  @Input() stockItem: any;
  @Input() branchId!: number;

  stockToDeduct: number | null = null;

  constructor(
    private stockService: StockService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() { }

  async updateStock() {
    if (this.stockToDeduct == null || this.stockToDeduct < 0) {
      const toast = await this.toastCtrl.create({
        message: 'Please enter a valid amount to deduct',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    const updatedStock = (this.stockItem.current_stock ?? this.stockItem.currentStock) - this.stockToDeduct;
    if (updatedStock < 0) {
      const toast = await this.toastCtrl.create({
        message: 'Deducted stock cannot be more than current stock',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    const payload = {
      product_id: this.stockItem.product_id ?? this.stockItem.id,
      stock_to_be_deducted: this.stockToDeduct,
      b_b_id: this.branchId,
      date_of_entry: new Date().toISOString().split('T')[0]
    };

    this.stockService.updateStock(payload).subscribe({
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