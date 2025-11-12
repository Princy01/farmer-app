import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StockService } from 'src/app/Wholesaler/services/stock.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-update-stock',
  templateUrl: './update-stock.component.html',
  styleUrls: ['./update-stock.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
})
export class UpdateStockComponent implements OnInit {
  @Input() stockItem: any;
  @Input() branchId!: number;

  stockToDeduct: number | null = null;

  constructor(
    private stockService: StockService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private translate: TranslateService
  ) { }

  ngOnInit() { }

  async updateStock() {
    if (this.stockToDeduct == null || this.stockToDeduct < 0) {
      const toast = await this.toastCtrl.create({
        message: this.translate.instant('UPDATE_STOCK.INVALID_AMOUNT'),
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    const updatedStock = (this.stockItem.current_stock ?? this.stockItem.currentStock) - this.stockToDeduct;
    if (updatedStock < 0) {
      const toast = await this.toastCtrl.create({
        message: this.translate.instant('UPDATE_STOCK.STOCK_EXCEEDS'),
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
          message: this.translate.instant('UPDATE_STOCK.UPDATE_SUCCESS'),
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        this.modalCtrl.dismiss();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: this.translate.instant('UPDATE_STOCK.UPDATE_FAILED'),
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